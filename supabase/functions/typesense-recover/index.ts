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
const SAFE_THRESHOLD = 1000;

async function tsFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${TYPESENSE_URL}${path}`, {
    ...options,
    headers: {
      "X-TYPESENSE-API-KEY": TYPESENSE_API_KEY,
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });
  return res;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Safety check: don't wipe a healthy collection
    const collectionRes = await tsFetch(`/collections/${COLLECTION}`);
    if (collectionRes.ok) {
      const collection = await collectionRes.json();
      const numDocs = collection.num_documents ?? 0;

      if (numDocs > SAFE_THRESHOLD) {
        const msg = `Aborting recovery: collection already has ${numDocs} docs (threshold: ${SAFE_THRESHOLD})`;
        console.warn(msg);
        return new Response(
          JSON.stringify({ status: "aborted", reason: msg }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Delete empty/corrupted collection
      console.log(`Deleting existing collection with ${numDocs} docs...`);
      await tsFetch(`/collections/${COLLECTION}`, { method: "DELETE" });
    }

    // 2. Download schema from backup
    const { data: schemaData, error: schemaError } = await supabase.storage
      .from(BUCKET)
      .download("backups/latest/schema.json");

    if (schemaError || !schemaData) {
      throw new Error(`Failed to download schema: ${schemaError?.message}`);
    }

    const schemaText = await schemaData.text();
    const schema = JSON.parse(schemaText);

    // 3. Recreate collection with backed-up schema
    // Clean up schema for creation (remove runtime fields)
    const createSchema = {
      name: schema.name || COLLECTION,
      fields: schema.fields?.filter((f: any) => f.name !== ".*") || [],
      default_sorting_field: schema.default_sorting_field,
    };

    const createRes = await tsFetch("/collections", {
      method: "POST",
      body: JSON.stringify(createSchema),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      throw new Error(`Failed to create collection: ${createRes.status} ${errText}`);
    }
    console.log("Collection recreated from backup schema");

    // 4. Download JSONL from backup
    const { data: jsonlData, error: jsonlError } = await supabase.storage
      .from(BUCKET)
      .download("backups/latest/places.jsonl");

    if (jsonlError || !jsonlData) {
      throw new Error(`Failed to download JSONL: ${jsonlError?.message}`);
    }

    const jsonlText = await jsonlData.text();
    const lines = jsonlText.split("\n").filter((l) => l.trim());

    // 5. Import in batches
    const BATCH_SIZE = 1000;
    let imported = 0;

    for (let i = 0; i < lines.length; i += BATCH_SIZE) {
      const batch = lines.slice(i, i + BATCH_SIZE).join("\n");

      const importRes = await tsFetch(
        `/collections/${COLLECTION}/documents/import?action=create&batch_size=${BATCH_SIZE}`,
        {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: batch,
        }
      );

      if (!importRes.ok) {
        console.error(`Import batch ${i} failed: ${importRes.status}`);
      }

      imported += Math.min(BATCH_SIZE, lines.length - i);
      console.log(`Imported ${imported}/${lines.length} documents`);
    }

    // 6. Verify
    const verifyRes = await tsFetch(`/collections/${COLLECTION}`);
    const verifyData = await verifyRes.json();
    const finalCount = verifyData.num_documents ?? 0;

    console.log(`Recovery complete: ${finalCount} docs restored`);

    return new Response(
      JSON.stringify({
        status: "success",
        documents_restored: finalCount,
        documents_expected: lines.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Recovery failed:", msg);

    return new Response(
      JSON.stringify({ status: "error", error: msg }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
