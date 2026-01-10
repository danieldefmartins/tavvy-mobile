// Supabase Edge Function: pros-start-thread
// Creates a new messaging thread between customer and pro

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface StartThreadRequest {
  project_id: string
  provider_id: string
  initial_message: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    // Create Supabase client with user's auth
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: authHeader } },
      }
    )

    // Get the current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // Parse request body
    const body: StartThreadRequest = await req.json()

    // Validate required fields
    if (!body.project_id || !body.provider_id || !body.initial_message) {
      throw new Error('Missing required fields: project_id, provider_id, initial_message')
    }

    // Verify the user owns this project
    const { data: project, error: projectError } = await supabaseClient
      .from('project_requests')
      .select('id, user_id')
      .eq('id', body.project_id)
      .eq('user_id', user.id)
      .single()

    if (projectError || !project) {
      throw new Error('Project not found or access denied')
    }

    // Check if thread already exists
    const { data: existingThread } = await supabaseClient
      .from('pro_threads')
      .select('id')
      .eq('project_id', body.project_id)
      .eq('provider_id', body.provider_id)
      .single()

    if (existingThread) {
      throw new Error('Thread already exists for this project and provider')
    }

    // Create the thread
    const { data: thread, error: threadError } = await supabaseClient
      .from('pro_threads')
      .insert({
        project_id: body.project_id,
        provider_id: body.provider_id,
        customer_id: user.id,
        status: 'active',
        customer_unread: 0,
        provider_unread: 1, // Initial message is unread for provider
        last_message_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (threadError) {
      throw new Error(`Failed to create thread: ${threadError.message}`)
    }

    // Create the initial message
    const { data: message, error: messageError } = await supabaseClient
      .from('pro_messages')
      .insert({
        thread_id: thread.id,
        sender_id: user.id,
        sender_type: 'customer',
        content: body.initial_message,
        is_read: false,
      })
      .select()
      .single()

    if (messageError) {
      throw new Error(`Failed to create message: ${messageError.message}`)
    }

    // Update the project invite status if exists
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    await supabaseAdmin
      .from('project_invites')
      .update({ status: 'responded', responded_at: new Date().toISOString() })
      .eq('project_id', body.project_id)
      .eq('provider_id', body.provider_id)

    // TODO: Send notification to provider (SMS/Push)

    return new Response(
      JSON.stringify({
        success: true,
        thread,
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
