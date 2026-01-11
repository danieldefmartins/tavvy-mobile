import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const INTRO_PRICE = Deno.env.get("STRIPE_PRICE_INTRO")!;
const SUCCESS_URL = Deno.env.get("APP_SUCCESS_URL")!;
const CANCEL_URL = Deno.env.get("APP_CANCEL_URL")!;

function stripeFetch(path: string, body: URLSearchParams) {
  return fetch(`https://api.stripe.com/v1/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const { place_id, email } = await req.json().catch(() => ({}));
  if (!place_id) return new Response("Missing place_id", { status: 400 });

  const params = new URLSearchParams();
  params.set("mode", "subscription");
  params.set("success_url", `${SUCCESS_URL}?session_id={CHECKOUT_SESSION_ID}`);
  params.set("cancel_url", CANCEL_URL);

  // IMPORTANT: metadata used by webhook to map subscription to a place
  params.set("metadata[place_id]", place_id);

  if (email) params.set("customer_email", email);

  // Start at $99/year
  params.set("line_items[0][price]", INTRO_PRICE);
  params.set("line_items[0][quantity]", "1");

  const res = await stripeFetch("checkout/sessions", params);
  const data = await res.json();

  if (!res.ok) {
    return new Response(JSON.stringify({ error: data }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ url: data.url, id: data.id }), {
    headers: { "Content-Type": "application/json" },
  });
});