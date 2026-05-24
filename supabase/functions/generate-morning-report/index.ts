/**
 * AI Morning Report — Supabase Edge Function
 *
 * Aggregates last-24h sales per tenant_id (total revenue + top products).
 * Invoke via HTTP (schedule later with Supabase Cron or external scheduler).
 *
 * Deploy: supabase functions deploy generate-morning-report
 * Call:   POST /functions/v1/generate-morning-report
 *         Authorization: Bearer <SUPABASE_ANON_KEY or SERVICE_ROLE_KEY>
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const WINDOW_HOURS = 24;
const TOP_PRODUCTS_LIMIT = 5;

type SaleRow = {
  tenant_id: string | null;
  product_name: string | null;
  line_total_aud: number | null;
  quantity: number | null;
  created_at: string;
};

type ProductAgg = {
  product_name: string;
  units_sold: number;
  revenue_aud: number;
};

type TenantReport = {
  tenant_id: string;
  total_sales_aud: number;
  transaction_count: number;
  top_selling_products: ProductAgg[];
};

function roundAud(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function saleAmount(row: SaleRow): number {
  return Number(row.line_total_aud ?? 0) || 0;
}

function aggregateByTenant(sales: SaleRow[]): TenantReport[] {
  const byTenant = new Map<
    string,
    {
      total_sales_aud: number;
      transaction_count: number;
      products: Map<string, ProductAgg>;
    }
  >();

  for (const row of sales) {
    const tenantId = row.tenant_id;
    if (!tenantId) continue;

    if (!byTenant.has(tenantId)) {
      byTenant.set(tenantId, {
        total_sales_aud: 0,
        transaction_count: 0,
        products: new Map(),
      });
    }

    const bucket = byTenant.get(tenantId)!;
    const amount = saleAmount(row);
    bucket.total_sales_aud += amount;
    bucket.transaction_count += 1;

    const name = (row.product_name || "Unknown").trim() || "Unknown";
    const existing = bucket.products.get(name) ?? {
      product_name: name,
      units_sold: 0,
      revenue_aud: 0,
    };
    existing.units_sold += Number(row.quantity) || 1;
    existing.revenue_aud += amount;
    bucket.products.set(name, existing);
  }

  return [...byTenant.entries()].map(([tenant_id, bucket]) => ({
    tenant_id,
    total_sales_aud: roundAud(bucket.total_sales_aud),
    transaction_count: bucket.transaction_count,
    top_selling_products: [...bucket.products.values()]
      .sort((a, b) => b.revenue_aud - a.revenue_aud)
      .slice(0, TOP_PRODUCTS_LIMIT)
      .map((p) => ({
        product_name: p.product_name,
        units_sold: p.units_sold,
        revenue_aud: roundAud(p.revenue_aud),
      })),
  }));
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET" && req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Optional: require CRON_SECRET when verify_jwt is disabled (scheduled jobs)
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (cronSecret) {
    const provided = req.headers.get("x-cron-secret");
    if (provided !== cronSecret) {
      return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    const since = new Date(Date.now() - WINDOW_HOURS * 60 * 60 * 1000).toISOString();

    const { data: sales, error } = await supabase
      .from("sales")
      .select("tenant_id, product_name, line_total_aud, quantity, created_at")
      .gte("created_at", since)
      .not("tenant_id", "is", null)
      .returns<SaleRow[]>();

    if (error) throw error;

    const tenantReports = aggregateByTenant(sales ?? []);

    // ─── OpenAI API (placeholder) ───────────────────────────────────────────
    // const openAiKey = Deno.env.get("OPENAI_API_KEY");
    // for (const report of tenantReports) {
    //   const prompt = `Summarize this morning's ERP sales for tenant ${report.tenant_id}:
    //     Total: ${report.total_sales_aud} AUD, ${report.transaction_count} transactions.
    //     Top products: ${JSON.stringify(report.top_selling_products)}`;
    //   const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    //     method: "POST",
    //     headers: {
    //       Authorization: `Bearer ${openAiKey}`,
    //       "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify({
    //       model: "gpt-4o-mini",
    //       messages: [
    //         { role: "system", content: "You write concise morning sales briefs for store owners." },
    //         { role: "user", content: prompt },
    //       ],
    //     }),
    //   });
    //   const aiJson = await aiRes.json();
    //   const summary = aiJson.choices?.[0]?.message?.content ?? "";
    //   // TODO: persist summary (e.g. morning_reports table) or send email/push
    // }
    // ─────────────────────────────────────────────────────────────────────────

    const body = {
      ok: true,
      function: "generate-morning-report",
      generated_at: new Date().toISOString(),
      window_start: since,
      window_hours: WINDOW_HOURS,
      tenant_count: tenantReports.length,
      tenant_reports: tenantReports,
      ai_summaries: null as string[] | null, // populated after OpenAI integration
    };

    return new Response(JSON.stringify(body), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[generate-morning-report]", message);
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
