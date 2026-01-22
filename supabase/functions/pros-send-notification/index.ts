// Supabase Edge Function: pros-send-notification
// Sends SMS/Push notifications to pros for new leads and messages using Go High Level for SMS.

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

// Send SMS via Go High Level
async function sendSmsGHL(to: string, body: string): Promise<boolean> {
  const ghlApiKey = Deno.env.get('GHL_API_KEY');
  const ghlLocationId = Deno.env.get('GHL_LOCATION_ID');

  if (!ghlApiKey || !ghlLocationId) {
    console.log('Go High Level not configured. Missing GHL_API_KEY or GHL_LOCATION_ID.');
    return false;
  }

  try {
    const response = await fetch('https://services.leadconnectorhq.com/conversations/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ghlApiKey}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        type: 'SMS',
        location_id: ghlLocationId,
        phone: to,
        message: body,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Go High Level API error:', error);
      return false;
    }

    console.log('GHL SMS sent successfully.');
    return true;
  } catch (error) {
    console.error('GHL SMS send error:', error);
    return false;
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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body: SendNotificationRequest = await req.json()

    if (!body.provider_id || !body.type || !body.title || !body.body) {
      throw new Error('Missing required fields: provider_id, type, title, body')
    }

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

    const { data: userProfile } = await supabaseAdmin
      .from('profiles')
      .select('expo_push_token')
      .eq('id', provider.user_id)
      .single()

    const results = {
      sms_sent: false,
      push_sent: false,
    }

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
        shouldSendSMS = true
        shouldSendPush = true
        break
    }

    if (shouldSendSMS && provider.phone) {
      const smsBody = `Tavvy Pros: ${body.title}\n\n${body.body}`
      results.sms_sent = await sendSmsGHL(provider.phone, smsBody)
    }

    if (shouldSendPush && userProfile?.expo_push_token) {
      results.push_sent = await sendPushNotification(
        userProfile.expo_push_token,
        body.title,
        body.body,
        body.data
      )
    }

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
