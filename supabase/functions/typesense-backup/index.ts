import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TYPESENSE_URL = Deno.env.get("TYPESENSE_URL")!;
const TYPESENSE_API_KEY = Deno.env.get("TYPESENSE_API_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const COLLECTION = "places";
const BUCKET = "typesense-backups";
const MIN_DOCS_GUARD = 1000;

async function tsFetch(path: string) {
  const res = await fetch(`${TYPESENSE_URL}${path}`, {
    headers: { "X-TYPESENSE-API-KEY": TYPESENSE_API_KEY },
  });
  if (!res.ok) throw new Error(`Typesense ${path}: ${res.status} ${await res.text()}`);
  return res;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Get collection info
    const collectionRes = await tsFetch(`/collections/${COLLECTION}`);
    const collection = await collectionRes.json();
    const numDocs = collection.num_documents ?? 0;

    // 2. Guard: don't overwrite a good backup with empty data
    if (numDocs < MIN_DOCS_GUARD) {
      const msg = `Skipping backup: only ${numDocs} docs (min: ${MIN_DOCS_GUARD})`;
      console.warn(msg);

      await supabase.from("typesense_backup_log").insert({
        num_documents: numDocs,
        storage_path: "SKIPPED",
        status: "skipped",
        error_message: msg,
      });

      return new Response(JSON.stringify({ status: "skipped", reason: msg }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Export schema
    const schemaJson = JSON.stringify(collection, null, 2);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    await supabase.storage
      .from(BUCKET)
      .upload(`backups/latest/schema.json`, new Blob([schemaJson]), {
        contentType: "application/json",
        upsert: true,
      });

    await supabase.storage
      .from(BUCKET)
      .upload(`backups/${timestamp}/schema.json`, new Blob([schemaJson]), {
        contentType: "application/json",
        upsert: true,
      });

    // 4. Export documents as JSONL
    const exportRes = await tsFetch(
      `/collections/${COLLECTION}/documents/export?filter_by=popularity:>=0`
    );
    const exportBody = await exportRes.text();

    const jsonlBlob = new Blob([exportBody], {
      type: "application/x-ndjson",
    });

    await supabase.storage
      .from(BUCKET)
      .upload(`backups/latest/places.jsonl`, jsonlBlob, {
        contentType: "application/x-ndjson",
        upsert: true,
      });

    await supabase.storage
      .from(BUCKET)
      .upload(`backups/${timestamp}/places.jsonl`, jsonlBlob, {
        contentType: "application/x-ndjson",
        upsert: true,
      });

    // 5. Log success
    const storagePath = `backups/${timestamp}`;
    await supabase.from("typesense_backup_log").insert({
      num_documents: numDocs,
      storage_path: storagePath,
      status: "success",
    });

    console.log(`Backup complete: ${numDocs} docs -> ${storagePath}`);

    return new Response(
      JSON.stringify({ status: "success", num_documents: numDocs, path: storagePath }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Backup failed:", msg);

    await supabase.from("typesense_backup_log").insert({
      num_documents: 0,
      storage_path: "ERROR",
      status: "error",
      error_message: msg,
    }).catch(() => {});

    return new Response(
      JSON.stringify({ status: "error", error: msg }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
