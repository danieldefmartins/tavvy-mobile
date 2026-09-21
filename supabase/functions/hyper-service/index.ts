import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { authorizeAudioProducer, completePollyText } from "../_shared/atlas-audio-policy.ts";
const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Cache-Control": "no-store" };
const AWS_REGION = Deno.env.get("AWS_REGION") || "us-east-1";
const AWS_ACCESS_KEY_ID = Deno.env.get("AWS_ACCESS_KEY_ID");
const AWS_SECRET_ACCESS_KEY = Deno.env.get("AWS_SECRET_ACCESS_KEY");
const VOICE_ID = "Ruth", ENGINE = "neural", OUTPUT_FORMAT = "mp3";
const reply = (status: number, value: unknown) => new Response(JSON.stringify(value), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
async function signAWSRequest(
  method: string,
  service: string,
  host: string,
  path: string,
  body: string,
  contentType: string
): Promise<Headers> {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const canonicalHeaders = `content-type:${contentType}\nhost:${host}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = "content-type;host;x-amz-date";

  const payloadHash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(body));
  const payloadHashHex = Array.from(new Uint8Array(payloadHash)).map((b) => b.toString(16).padStart(2, "0")).join("");

  const canonicalRequest = `${method}\n${path}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHashHex}`;
  const algorithm = "AWS4-HMAC-SHA256";
  const credentialScope = `${dateStamp}/${AWS_REGION}/${service}/aws4_request`;

  const canonicalRequestHash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonicalRequest));
  const canonicalRequestHashHex = Array.from(new Uint8Array(canonicalRequestHash)).map((b) => b.toString(16).padStart(2, "0")).join("");

  const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${canonicalRequestHashHex}`;

  const getSignatureKey = async (key: string, dateStamp: string, regionName: string, serviceName: string): Promise<ArrayBuffer> => {
    const kDate = await crypto.subtle.sign("HMAC", await crypto.subtle.importKey("raw", new TextEncoder().encode("AWS4" + key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]), new TextEncoder().encode(dateStamp));
    const kRegion = await crypto.subtle.sign("HMAC", await crypto.subtle.importKey("raw", kDate, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]), new TextEncoder().encode(regionName));
    const kService = await crypto.subtle.sign("HMAC", await crypto.subtle.importKey("raw", kRegion, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]), new TextEncoder().encode(serviceName));
    return await crypto.subtle.sign("HMAC", await crypto.subtle.importKey("raw", kService, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]), new TextEncoder().encode("aws4_request"));
  };

  const signingKey = await getSignatureKey(AWS_SECRET_ACCESS_KEY!, dateStamp, AWS_REGION, service);
  const signature = await crypto.subtle.sign("HMAC", await crypto.subtle.importKey("raw", signingKey, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]), new TextEncoder().encode(stringToSign));
  const signatureHex = Array.from(new Uint8Array(signature)).map((b) => b.toString(16).padStart(2, "0")).join("");

  const authorizationHeader = `${algorithm} Credential=${AWS_ACCESS_KEY_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signatureHex}`;

  const headers = new Headers();
  headers.set("Content-Type", contentType);
  headers.set("Host", host);
  headers.set("X-Amz-Date", amzDate);
  headers.set("Authorization", authorizationHeader);
  return headers;
}

async function synthesizeSpeech(text: string): Promise<ArrayBuffer> {
  const host = `polly.${AWS_REGION}.amazonaws.com`;
  const path = "/v1/speech";
  
  // Polly has a limit of 3000 characters for neural voices
  if (text.length > 2900) throw new Error("Use complete narration pipeline");
  const processedText = text;

  const body = JSON.stringify({ 
    Engine: ENGINE, 
    OutputFormat: OUTPUT_FORMAT, 
    Text: processedText, 
    VoiceId: VOICE_ID 
  });
  
  const headers = await signAWSRequest("POST", "polly", host, path, body, "application/json");

  const response = await fetch(`https://${host}${path}`, { method: "POST", headers, body });
  
  if (!response.ok) {
    
    throw new Error("Audio provider request failed");
  }
  
  return await response.arrayBuffer();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const denied = authorizeAudioProducer(req, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"), corsHeaders);
  if (denied) return denied;
  if (req.method !== "POST") return reply(405, { success: false, error: "Method not allowed" });
  const url = Deno.env.get("SUPABASE_URL");
  if (!url?.trim()) return reply(503, { success: false, error: "Audio producer unavailable" });
  try {
    const body = await req.json();
    const { article_id, force_regenerate = false } = body;
    if (typeof article_id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(article_id) || typeof force_regenerate !== "boolean") return reply(400, { success: false, error: "Invalid request" });
    const db = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: article, error } = await db.from("atlas_articles").select("id,title,excerpt,content,content_blocks,audio_url,audio_generated_at,updated_at").eq("id", article_id).single();
    if (error || !article) return reply(404, { success: false, error: "Article unavailable" });
    if (!force_regenerate && article.audio_url) return reply(200, { success: true, audio_url: article.audio_url, cached: true });
    let text: string;
    try { text = completePollyText(article); }
    catch { return reply(422, { success: false, error: "Use the complete narration pipeline for this article" }); }
    if (!AWS_ACCESS_KEY_ID?.trim() || !AWS_SECRET_ACCESS_KEY?.trim()) return reply(503, { success: false, error: "Audio producer unavailable" });
    const audio = await synthesizeSpeech(text);
    if (!audio.byteLength) return reply(502, { success: false, error: "Audio provider returned no recording" });
    const name = `article-${article_id}-${crypto.randomUUID()}.mp3`;
    const { error: uploadError } = await db.storage.from("article-audio").upload(name, audio, { contentType: "audio/mpeg", upsert: false });
    if (uploadError) return reply(502, { success: false, error: "Audio upload failed" });
    const { data: link } = db.storage.from("article-audio").getPublicUrl(name);
    // The actual player measures duration. Never label a short file with a full-text estimate.
    let update = db.from("atlas_articles").update({ audio_url: link.publicUrl, audio_duration: null, audio_generated_at: new Date().toISOString() }).eq("id", article_id);
    update = article.audio_url ? update.eq("audio_url", article.audio_url) : update.is("audio_url", null);
    update = article.updated_at ? update.eq("updated_at", article.updated_at) : update.is("updated_at", null);
    const { data: changed, error: updateError } = await update.select("id");
    if (updateError || changed?.length !== 1) return reply(409, { success: false, error: "Article changed; existing recording preserved" });
    return reply(200, { success: true, audio_url: link.publicUrl, audio_duration: null, cached: false });
  } catch { return reply(400, { success: false, error: "Audio could not be prepared" }); }
});
