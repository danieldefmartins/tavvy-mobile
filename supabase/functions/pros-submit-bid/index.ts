// Supabase Edge Function: pros-submit-bid
// Allows a pro to submit a bid/response to a project

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SubmitBidRequest {
  project_id: string
  price_low: number
  price_high: number
  pitch: string
  estimated_timeline?: string
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
    const body: SubmitBidRequest = await req.json()

    // Validate required fields
    if (!body.project_id || body.price_low === undefined || body.price_high === undefined || !body.pitch) {
      throw new Error('Missing required fields: project_id, price_low, price_high, pitch')
    }

    // Validate price range
    if (body.price_low > body.price_high) {
      throw new Error('price_low cannot be greater than price_high')
    }

    // Get the user's provider profile
    const { data: provider, error: providerError } = await supabaseClient
      .from('pro_providers')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (providerError || !provider) {
      throw new Error('You must be a registered pro to submit bids')
    }

    // Use admin client for subscription check
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Check for active subscription
    const { data: subscription } = await supabaseAdmin
      .from('pro_subscriptions')
      .select('id, status, end_date')
      .eq('provider_id', provider.id)
      .eq('status', 'active')
      .gt('end_date', new Date().toISOString())
      .single()

    if (!subscription) {
      throw new Error('Active subscription required to submit bids. Please subscribe to continue.')
    }

    // Check if project exists and is open
    const { data: project, error: projectError } = await supabaseAdmin
      .from('project_requests')
      .select('id, status, user_id')
      .eq('id', body.project_id)
      .single()

    if (projectError || !project) {
      throw new Error('Project not found')
    }

    if (project.status !== 'open') {
      throw new Error('This project is no longer accepting bids')
    }

    // Check if already submitted a bid
    const { data: existingBid } = await supabaseAdmin
      .from('pro_bids')
      .select('id')
      .eq('project_id', body.project_id)
      .eq('provider_id', provider.id)
      .single()

    if (existingBid) {
      throw new Error('You have already submitted a bid for this project')
    }

    // Get the invite if exists
    const { data: invite } = await supabaseAdmin
      .from('project_invites')
      .select('id')
      .eq('project_id', body.project_id)
      .eq('provider_id', provider.id)
      .single()

    // Create the bid
    const { data: bid, error: bidError } = await supabaseAdmin
      .from('pro_bids')
      .insert({
        project_id: body.project_id,
        provider_id: provider.id,
        invite_id: invite?.id || null,
        price_low: body.price_low,
        price_high: body.price_high,
        pitch: body.pitch,
        estimated_timeline: body.estimated_timeline,
        status: 'submitted',
      })
      .select()
      .single()

    if (bidError) {
      throw new Error(`Failed to submit bid: ${bidError.message}`)
    }

    // Update invite status if exists
    if (invite) {
      await supabaseAdmin
        .from('project_invites')
        .update({ status: 'responded', responded_at: new Date().toISOString() })
        .eq('id', invite.id)
    }

    // TODO: Send notification to customer about new bid

    return new Response(
      JSON.stringify({
        success: true,
        bid,
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
