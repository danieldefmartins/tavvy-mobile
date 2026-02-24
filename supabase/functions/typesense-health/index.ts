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
const MEMORY_WARN_THRESHOLD = 80;
const MIN_EXPECTED_DOCS = 60_000_000;

async function tsFetch(path: string) {
  const res = await fetch(`${TYPESENSE_URL}${path}`, {
    headers: { "X-TYPESENSE-API-KEY": TYPESENSE_API_KEY },
  });
  return res;
}

async function triggerRecover() {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/typesense-recover`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ triggered_by: "auto-recovery" }),
    });
    const data = await res.json();
    console.log("Auto-recovery triggered:", data);
    return data;
  } catch (err) {
    console.error("Failed to trigger recovery:", err);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const alerts: string[] = [];
  let serverOk = false;
  let numDocuments = 0;
  let memoryUsagePercent = 0;

  try {
    // 1. Check /health
    const healthRes = await tsFetch("/health");
    if (!healthRes.ok) {
      alerts.push("CRITICAL: Server health check failed");
    } else {
      const health = await healthRes.json();
      serverOk = health.ok === true;
      if (!serverOk) {
        alerts.push("CRITICAL: Server reports unhealthy state");
      }
    }
  } catch {
    alerts.push("CRITICAL: Server unreachable");
  }

  try {
    // 2. Check collection
    if (serverOk) {
      const collectionRes = await tsFetch(`/collections/${COLLECTION}`);
      if (!collectionRes.ok) {
        alerts.push("CRITICAL: Collection missing");
        numDocuments = 0;
      } else {
        const collection = await collectionRes.json();
        numDocuments = collection.num_documents ?? 0;

        if (numDocuments === 0) {
          alerts.push("CRITICAL: Collection has 0 documents");
        } else if (numDocuments < MIN_EXPECTED_DOCS) {
          alerts.push(
            `WARNING: Only ${numDocuments.toLocaleString()} docs (expected ${MIN_EXPECTED_DOCS.toLocaleString()}+)`
          );
        }
      }
    }
  } catch {
    alerts.push("WARNING: Could not check collection");
  }

  try {
    // 3. Check memory usage via /metrics.json
    if (serverOk) {
      const metricsRes = await tsFetch("/metrics.json");
      if (metricsRes.ok) {
        const metrics = await metricsRes.json();
        // Typesense metrics: system_memory_used_bytes / system_memory_total_bytes
        const usedBytes = Number(metrics.system_memory_used_bytes || 0);
        const totalBytes = Number(metrics.system_memory_total_bytes || 1);
        if (totalBytes > 0) {
          memoryUsagePercent = Math.round((usedBytes / totalBytes) * 100);
        }

        if (memoryUsagePercent > MEMORY_WARN_THRESHOLD) {
          alerts.push(
            `WARNING: Memory at ${memoryUsagePercent}% (threshold: ${MEMORY_WARN_THRESHOLD}%)`
          );
        }
      }
    }
  } catch {
    alerts.push("WARNING: Could not check memory metrics");
  }

  // Determine if auto-recovery is needed
  const hasCritical = alerts.some((a) => a.startsWith("CRITICAL"));
  let recoveryResult = null;

  if (hasCritical && serverOk && numDocuments === 0) {
    // Server is up but collection is empty/missing — try auto-recovery
    console.log("Triggering auto-recovery due to critical alerts:", alerts);
    recoveryResult = await triggerRecover();
  }

  // Log health check
  await supabase
    .from("typesense_health_log")
    .insert({
      server_ok: serverOk,
      num_documents: numDocuments,
      memory_usage_percent: memoryUsagePercent,
      alerts: alerts.length > 0 ? alerts : null,
    })
    .catch((err: Error) => console.error("Failed to log health:", err));

  const status = hasCritical ? "critical" : alerts.length > 0 ? "warning" : "healthy";

  return new Response(
    JSON.stringify({
      status,
      server_ok: serverOk,
      num_documents: numDocuments,
      memory_usage_percent: memoryUsagePercent,
      alerts,
      recovery_triggered: recoveryResult !== null,
      recovery_result: recoveryResult,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
