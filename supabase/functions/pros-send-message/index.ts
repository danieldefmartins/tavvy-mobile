import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SendMessageRequest {
  conversationId: string
  content: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: authHeader } },
      }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    const body: SendMessageRequest = await req.json()

    if (!body.conversationId || !body.content) {
      throw new Error('Missing required fields: conversationId, content')
    }

    const { data: thread, error: threadError } = await supabaseClient
      .from('pro_threads')
      .select(`
        id,
        customer_id,
        provider_id,
        status,
        pro_providers!inner(id, user_id)
      `)
      .eq('id', body.conversationId)
      .single()

    if (threadError || !thread) {
      throw new Error('Thread not found or access denied')
    }

    let senderType: 'customer' | 'provider'
    if (thread.customer_id === user.id) {
      senderType = 'customer'
    } else if (thread.pro_providers.user_id === user.id) {
      senderType = 'provider'
      
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )
      
      const { data: subscription } = await supabaseAdmin
        .from('pro_subscriptions')
        .select('status, end_date')
        .eq('provider_id', thread.provider_id)
        .eq('status', 'active')
        .gt('end_date', new Date().toISOString())
        .single()
      
      if (!subscription) {
        throw new Error('Active subscription required to send messages')
      }
    } else {
      throw new Error('You are not a participant in this thread')
    }

    if (thread.status !== 'active') {
      throw new Error('This thread is no longer active')
    }

    const { data: message, error: messageError } = await supabaseClient
      .from('pro_messages')
      .insert({
        thread_id: body.conversationId,
        sender_id: user.id,
        sender_type: senderType,
        content: body.content,
        is_read: false,
      })
      .select()
      .single()

    if (messageError) {
      throw new Error(`Failed to send message: ${messageError.message}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
