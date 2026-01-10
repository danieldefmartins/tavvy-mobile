// Supabase Edge Function: pros-create-project
// Creates a new project request and invites matching pros

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateProjectRequest {
  category_id: string
  title: string
  description?: string
  timeline: 'urgent' | 'this_week' | 'this_month' | 'flexible' | 'planning'
  budget_range: string
  address?: string
  city: string
  state: string
  zip_code: string
  latitude?: number
  longitude?: number
  desired_pro_count?: number
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
    const body: CreateProjectRequest = await req.json()

    // Validate required fields
    if (!body.category_id || !body.title || !body.city || !body.state || !body.zip_code) {
      throw new Error('Missing required fields: category_id, title, city, state, zip_code')
    }

    // Create the project request
    const { data: project, error: projectError } = await supabaseClient
      .from('project_requests')
      .insert({
        user_id: user.id,
        category_id: body.category_id,
        title: body.title,
        description: body.description,
        timeline: body.timeline,
        budget_range: body.budget_range,
        address: body.address,
        city: body.city,
        state: body.state,
        zip_code: body.zip_code,
        latitude: body.latitude,
        longitude: body.longitude,
        desired_pro_count: body.desired_pro_count || 10,
        status: 'open',
      })
      .select()
      .single()

    if (projectError) {
      throw new Error(`Failed to create project: ${projectError.message}`)
    }

    // Find matching pros based on category and location
    // Using service account for this query to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get pros that:
    // 1. Have the matching category
    // 2. Are in the same city/state or within service radius
    // 3. Are active and verified
    // 4. Have active subscription (for priority) or not (they'll see locked leads)
    const { data: matchingPros, error: prosError } = await supabaseAdmin
      .from('pro_providers')
      .select(`
        id,
        business_name,
        city,
        state,
        service_radius,
        pro_category_links!inner(category_id),
        pro_subscriptions(status, end_date)
      `)
      .eq('is_active', true)
      .eq('pro_category_links.category_id', body.category_id)
      .or(`city.eq.${body.city},state.eq.${body.state}`)
      .limit(50) // Get more than needed to filter

    if (prosError) {
      console.error('Error finding pros:', prosError)
      // Don't fail the request, just log the error
    }

    // Create invites for matching pros
    const invites = []
    if (matchingPros && matchingPros.length > 0) {
      // Sort pros: subscribed first, then by proximity
      const sortedPros = matchingPros.sort((a, b) => {
        const aSubscribed = a.pro_subscriptions?.some(
          (s: any) => s.status === 'active' && new Date(s.end_date) > new Date()
        )
        const bSubscribed = b.pro_subscriptions?.some(
          (s: any) => s.status === 'active' && new Date(s.end_date) > new Date()
        )
        if (aSubscribed && !bSubscribed) return -1
        if (!aSubscribed && bSubscribed) return 1
        return 0
      })

      // Create invites for top pros
      const prosToInvite = sortedPros.slice(0, body.desired_pro_count || 10)
      
      for (const pro of prosToInvite) {
        const { data: invite, error: inviteError } = await supabaseAdmin
          .from('project_invites')
          .insert({
            project_id: project.id,
            provider_id: pro.id,
            status: 'pending',
          })
          .select()
          .single()

        if (!inviteError && invite) {
          invites.push(invite)
        }
      }

      // TODO: Send notifications to invited pros (SMS/Push)
      // This will be handled by a separate notification function
    }

    return new Response(
      JSON.stringify({
        success: true,
        project,
        invites_sent: invites.length,
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
