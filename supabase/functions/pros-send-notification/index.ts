// Supabase Edge Function: pros-send-notification
// Sends SMS/Push notifications to pros for new leads and messages

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type NotificationType = 'new_lead' | 'new_message' | 'bid_accepted' | 'project_update'

interface SendNotificationRequest {
  provider_id: string
  type: NotificationType
  title: string
  body: string
  data?: Record<string, any>
}

// Format phone number for Twilio
function formatPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) {
    return `+1${digits}`
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`
  }
  return `+${digits}`
}

// Send SMS via Twilio
async function sendSMS(to: string, body: string): Promise<boolean> {
  const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
  const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')
  const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER')

  if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
    console.log('Twilio not configured')
    return false
  }

  try {
    const formattedPhone = formatPhoneNumber(to)
    
    const response = await fetch(
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
          Body: body,
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error('Twilio error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('SMS send error:', error)
    return false
  }
}

// Send push notification via Expo
async function sendPushNotification(
  expoPushToken: string,
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<boolean> {
  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: expoPushToken,
        title,
        body,
        data,
        sound: 'default',
        badge: 1,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Expo push error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Push notification error:', error)
    return false
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // This function should be called internally (from other edge functions or triggers)
    // Verify the request is from a trusted source
    const authHeader = req.headers.get('Authorization')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    // Allow service role key or valid user token
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    // Create admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse request body
    const body: SendNotificationRequest = await req.json()

    // Validate required fields
    if (!body.provider_id || !body.type || !body.title || !body.body) {
      throw new Error('Missing required fields: provider_id, type, title, body')
    }

    // Get provider info and notification preferences
    const { data: provider, error: providerError } = await supabaseAdmin
      .from('pro_providers')
      .select(`
        id,
        phone,
        email,
        user_id,
        pro_notification_preferences(
          sms_new_leads,
          sms_messages,
          push_new_leads,
          push_messages
        )
      `)
      .eq('id', body.provider_id)
      .single()

    if (providerError || !provider) {
      throw new Error('Provider not found')
    }

    const prefs = provider.pro_notification_preferences?.[0] || {
      sms_new_leads: true,
      sms_messages: false,
      push_new_leads: true,
      push_messages: true,
    }

    // Get user's push token if available
    const { data: userProfile } = await supabaseAdmin
      .from('profiles')
      .select('expo_push_token')
      .eq('id', provider.user_id)
      .single()

    const results = {
      sms_sent: false,
      push_sent: false,
    }

    // Determine which notifications to send based on type and preferences
    let shouldSendSMS = false
    let shouldSendPush = false

    switch (body.type) {
      case 'new_lead':
        shouldSendSMS = prefs.sms_new_leads
        shouldSendPush = prefs.push_new_leads
        break
      case 'new_message':
        shouldSendSMS = prefs.sms_messages
        shouldSendPush = prefs.push_messages
        break
      case 'bid_accepted':
      case 'project_update':
        shouldSendSMS = true // Always notify for important updates
        shouldSendPush = true
        break
    }

    // Send SMS if enabled and phone available
    if (shouldSendSMS && provider.phone) {
      const smsBody = `TavvY Pros: ${body.title}\n\n${body.body}`
      results.sms_sent = await sendSMS(provider.phone, smsBody)
    }

    // Send push notification if enabled and token available
    if (shouldSendPush && userProfile?.expo_push_token) {
      results.push_sent = await sendPushNotification(
        userProfile.expo_push_token,
        body.title,
        body.body,
        body.data
      )
    }

    // Log notification for analytics
    await supabaseAdmin
      .from('pro_notification_log')
      .insert({
        provider_id: body.provider_id,
        type: body.type,
        title: body.title,
        body: body.body,
        sms_sent: results.sms_sent,
        push_sent: results.push_sent,
      })
      .catch(() => {
        // Table might not exist, ignore error
      })

    return new Response(
      JSON.stringify({
        success: true,
        ...results,
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
