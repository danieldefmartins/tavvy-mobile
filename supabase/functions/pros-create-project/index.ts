import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// NOTE: service role so we can insert + invite even before RLS is perfect.
// Later we will add proper RLS.
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const {
    created_by, // optional for now (we can replace with auth later)
    category_slug,
    subcategory_slug,
    title,
    description,
    city,
    state,
    zip,
    urgency = "this_week",
    max_pros = 10,
  } = await req.json().catch(() => ({}));

  if (!category_slug) return new Response("Missing category_slug", { status: 400 });
  if (!description) return new Response("Missing description", { status: 400 });

  // 1) Resolve category
  const { data: cat, error: catErr } = await supabase
    .from("service_categories")
    .select("id, slug")
    .eq("slug", category_slug)
    .single();

  if (catErr || !cat) return new Response("Invalid category_slug", { status: 400 });

  // 2) Resolve subcategory (optional)
  let subcategory_id: string | null = null;
  if (subcategory_slug) {
    const { data: sub } = await supabase
      .from("service_subcategories")
      .select("id")
      .eq("category_id", cat.id)
      .eq("slug", subcategory_slug)
      .maybeSingle();
    subcategory_id = sub?.id ?? null;
  }

  // 3) Create project request
  const { data: project, error: projErr } = await supabase
    .from("project_requests")
    .insert({
      created_by: created_by ?? null,
      category_id: cat.id,
      subcategory_id,
      title: title ?? null,
      description,
      city: city ?? null,
      state: state ?? null,
      zip: zip ?? null,
      urgency,
      max_pros: Math.min(Math.max(Number(max_pros) || 10, 1), 50),
      status: "open",
    })
    .select("*")
    .single();

  if (projErr || !project) {
    return new Response(JSON.stringify({ error: projErr }), { status: 500 });
  }

  // 4) Find pros to invite (MVP logic)
  // For now: any place_services for that category, active=true.
  // Later: filter by geo radius based on project location.
  const { data: pros, error: prosErr } = await supabase
    .from("place_services")
    .select("place_id")
    .eq("category_id", cat.id)
    .eq("is_active", true)
    .limit(project.max_pros);

  if (prosErr) {
    return new Response(JSON.stringify({ error: prosErr }), { status: 500 });
  }

  // 5) Create invites
  const invites = (pros ?? []).map((p) => ({
    project_id: project.id,
    place_id: p.place_id,
    status: "invited",
  }));

  if (invites.length > 0) {
    const { error: invErr } = await supabase.from("project_invites").insert(invites);
    if (invErr) {
      return new Response(JSON.stringify({ error: invErr }), { status: 500 });
    }
  }

  return new Response(JSON.stringify({
    project,
    invited_count: invites.length,
  }), { headers: { "Content-Type": "application/json" }});
});