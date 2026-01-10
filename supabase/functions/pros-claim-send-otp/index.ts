// Supabase Edge Function: pros-claim-send-otp
// Sends OTP code to business phone for verification

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SendOTPRequest {
  business_name: string
  business_phone: string
  business_email?: string
  business_address?: string
  place_id?: string // If claiming existing place
}

// Generate a 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Format phone number for Twilio
function formatPhoneNumber(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '')
  // Add +1 if US number without country code
  if (digits.length === 10) {
    return `+1${digits}`
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`
  }
  // Assume it already has country code
  return `+${digits}`
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
    const body: SendOTPRequest = await req.json()

    // Validate required fields
    if (!body.business_name || !body.business_phone) {
      throw new Error('Missing required fields: business_name, business_phone')
    }

    // Use admin client for database operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Check if user already has a pending claim
    const { data: existingClaim } = await supabaseAdmin
      .from('pro_business_claims')
      .select('id, status, verification_attempts')
      .eq('user_id', user.id)
      .in('status', ['pending', 'code_sent'])
      .single()

    // Generate OTP
    const otp = generateOTP()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    if (existingClaim) {
      // Check if too many attempts
      if (existingClaim.verification_attempts >= 5) {
        throw new Error('Too many verification attempts. Please try again later.')
      }

      // Update existing claim with new OTP
      const { error: updateError } = await supabaseAdmin
        .from('pro_business_claims')
        .update({
          business_name: body.business_name,
          business_phone: body.business_phone,
          business_email: body.business_email,
          business_address: body.business_address,
          place_id: body.place_id,
          verification_code: otp,
          verification_code_expires_at: expiresAt.toISOString(),
          status: 'code_sent',
        })
        .eq('id', existingClaim.id)

      if (updateError) {
        throw new Error(`Failed to update claim: ${updateError.message}`)
      }
    } else {
      // Create new claim
      const { error: insertError } = await supabaseAdmin
        .from('pro_business_claims')
        .insert({
          user_id: user.id,
          business_name: body.business_name,
          business_phone: body.business_phone,
          business_email: body.business_email,
          business_address: body.business_address,
          place_id: body.place_id,
          verification_code: otp,
          verification_code_expires_at: expiresAt.toISOString(),
          verification_attempts: 0,
          status: 'code_sent',
        })

      if (insertError) {
        throw new Error(`Failed to create claim: ${insertError.message}`)
      }
    }

    // Send OTP via Twilio
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER')

    if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
      const formattedPhone = formatPhoneNumber(body.business_phone)
      
      const twilioResponse = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: formattedPhone,
            From: twilioPhoneNumber,
            Body: `Your TavvY Pros verification code is: ${otp}. This code expires in 10 minutes.`,
          }),
        }
      )

      if (!twilioResponse.ok) {
        const twilioError = await twilioResponse.text()
        console.error('Twilio error:', twilioError)
        // Don't fail the request, just log the error
        // In development, we can still verify with the code in the database
      }
    } else {
      console.log('Twilio not configured. OTP for testing:', otp)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Verification code sent to your phone',
        // Only include OTP in development/testing
        ...(Deno.env.get('ENVIRONMENT') === 'development' && { otp }),
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
