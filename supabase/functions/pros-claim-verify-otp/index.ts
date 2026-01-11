// Supabase Edge Function: pros-claim-verify-otp
// Verifies OTP code and creates provider profile

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VerifyOTPRequest {
  otp: string
}

// Generate a URL-friendly slug from business name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50)
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
    const body: VerifyOTPRequest = await req.json()

    // Validate required fields
    if (!body.otp) {
      throw new Error('Missing required field: otp')
    }

    // Use admin client for database operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the pending claim
    const { data: claim, error: claimError } = await supabaseAdmin
      .from('pro_business_claims')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'code_sent')
      .single()

    if (claimError || !claim) {
      throw new Error('No pending verification found. Please request a new code.')
    }

    // Check if code expired
    if (new Date(claim.verification_code_expires_at) < new Date()) {
      await supabaseAdmin
        .from('pro_business_claims')
        .update({ status: 'expired' })
        .eq('id', claim.id)
      throw new Error('Verification code has expired. Please request a new code.')
    }

    // Increment attempt counter
    await supabaseAdmin
      .from('pro_business_claims')
      .update({ verification_attempts: claim.verification_attempts + 1 })
      .eq('id', claim.id)

    // Check attempt limit
    if (claim.verification_attempts >= 5) {
      await supabaseAdmin
        .from('pro_business_claims')
        .update({ status: 'expired' })
        .eq('id', claim.id)
      throw new Error('Too many failed attempts. Please request a new code.')
    }

    // Verify the OTP
    if (claim.verification_code !== body.otp) {
      const remainingAttempts = 5 - (claim.verification_attempts + 1)
      throw new Error(`Invalid verification code. ${remainingAttempts} attempts remaining.`)
    }

    // OTP is valid! Create the provider profile
    const baseSlug = generateSlug(claim.business_name)
    let slug = baseSlug
    let slugSuffix = 1

    // Ensure unique slug
    while (true) {
      const { data: existingProvider } = await supabaseAdmin
        .from('pro_providers')
        .select('id')
        .eq('slug', slug)
        .single()

      if (!existingProvider) break
      slug = `${baseSlug}-${slugSuffix}`
      slugSuffix++
    }

    // Create provider profile
    const { data: provider, error: providerError } = await supabaseAdmin
      .from('pro_providers')
      .insert({
        user_id: user.id,
        business_name: claim.business_name,
        slug,
        phone: claim.business_phone,
        email: claim.business_email || user.email,
        address: claim.business_address,
        is_verified: true,
        is_active: true,
        verified_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (providerError) {
      throw new Error(`Failed to create provider profile: ${providerError.message}`)
    }

    // Update claim status
    await supabaseAdmin
      .from('pro_business_claims')
      .update({
        status: 'verified',
        verified_at: new Date().toISOString(),
        provider_id: provider.id,
      })
      .eq('id', claim.id)

    // Create default notification preferences
    await supabaseAdmin
      .from('pro_notification_preferences')
      .insert({
        provider_id: provider.id,
      })

    // Check if early adopter slots are available and create subscription
    const { data: earlyAdopterCount } = await supabaseAdmin
      .rpc('get_early_adopter_count')

    const isEarlyAdopter = (earlyAdopterCount || 0) < 1000
    const { data: nextNumber } = await supabaseAdmin
      .rpc('get_next_early_adopter_number')

    // Create a pending subscription (user will need to complete payment)
    const { data: subscription } = await supabaseAdmin
      .from('pro_subscriptions')
      .insert({
        provider_id: provider.id,
        tier: isEarlyAdopter ? 'early_adopter' : 'standard',
        status: 'pending',
        price_per_year: isEarlyAdopter ? 99.00 : 499.00,
        early_adopter_number: isEarlyAdopter ? nextNumber : null,
      })
      .select()
      .single()

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Business verified successfully!',
        provider,
        subscription: {
          tier: subscription?.tier,
          price_per_year: subscription?.price_per_year,
          early_adopter_number: subscription?.early_adopter_number,
          is_early_adopter: isEarlyAdopter,
          early_adopter_slots_remaining: isEarlyAdopter ? 1000 - (earlyAdopterCount || 0) - 1 : 0,
        },
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
