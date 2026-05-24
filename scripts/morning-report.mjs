/**
 * AI Morning Report — Cursor SDK runner
 *
 * 1. Loads last-24h sales from Supabase (grouped by tenant_id)
 * 2. Uses Agent.prompt() to generate an executive summary
 *
 * Usage:
 *   export CURSOR_API_KEY=cursor_...
 *   export SUPABASE_URL=https://xxx.supabase.co
 *   export SUPABASE_SERVICE_ROLE_KEY=...
 *   npm install && npm run morning-report
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Agent, CursorAgentError } from "@cursor/sdk";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");

const WINDOW_HOURS = 24;
const TOP_PRODUCTS_LIMIT = 5;

function loadEnvFromConfig() {
  const configPath = join(REPO_ROOT, "supabase.config.js");
  if (!existsSync(configPath)) return;
  const raw = readFileSync(configPath, "utf8");
  const url = raw.match(/url:\s*['"]([^'"]+)['"]/)?.[1];
  const anonKey = raw.match(/anonKey:\s*['"]([^'"]+)['"]/)?.[1];
  if (url && !process.env.SUPABASE_URL) process.env.SUPABASE_URL = url;
  if (anonKey && !process.env.SUPABASE_ANON_KEY) process.env.SUPABASE_ANON_KEY = anonKey;
}

function roundAud(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function saleAmount(row) {
  return Number(row.line_total_aud ?? 0) || 0;
}

function aggregateByTenant(sales) {
  const byTenant = new Map();

  for (const row of sales) {
    const tenantId = row.tenant_id;
    if (!tenantId) continue;

    if (!byTenant.has(tenantId)) {
      byTenant.set(tenantId, {
        tenant_id: tenantId,
        total_sales_aud: 0,
        transaction_count: 0,
        products: new Map(),
      });
    }

    const bucket = byTenant.get(tenantId);
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

  return [...byTenant.values()].map((bucket) => ({
    tenant_id: bucket.tenant_id,
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

async function fetchTenantReports(supabase) {
  const since = new Date(Date.now() - WINDOW_HOURS * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("sales")
    .select("tenant_id, product_name, line_total_aud, quantity, created_at")
    .gte("created_at", since)
    .not("tenant_id", "is", null);

  if (error) throw error;
  return { since, tenantReports: aggregateByTenant(data ?? []) };
}

function buildPrompt(tenantReports, since) {
  return `You are the AI morning report engine for a multi-tenant abaya retail ERP (currency: AUD).

Write a concise morning briefing for the platform operator. Use clear headings and bullet points.
Flag any tenant with unusually high sales or single transactions that look like outliers.

Reporting window started at: ${since}
Tenant data (JSON):
${JSON.stringify(tenantReports, null, 2)}

Include:
1. Platform-wide totals
2. Per-tenant highlights (sales, top products)
3. Recommended follow-ups for today`;
}

async function main() {
  loadEnvFromConfig();

  const apiKey = process.env.CURSOR_API_KEY;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!apiKey) {
    console.error("Missing CURSOR_API_KEY");
    process.exit(1);
  }
  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY)");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { since, tenantReports } = await fetchTenantReports(supabase);

  console.log(`\n📊 Raw aggregate: ${tenantReports.length} tenant(s), window since ${since}\n`);
  console.log(JSON.stringify(tenantReports, null, 2));

  const prompt = buildPrompt(tenantReports, since);

  try {
    const result = await Agent.prompt(prompt, {
      apiKey,
      model: { id: "composer-2.5" },
      local: { cwd: REPO_ROOT },
    });

    if (result.status === "error") {
      console.error("\n❌ Agent run failed:", result.id);
      process.exit(2);
    }

    console.log("\n--- AI Morning Report ---\n");
    console.log(result.result ?? "(no text result)");
    console.log("\n--- end ---\n");
  } catch (err) {
    if (err instanceof CursorAgentError) {
      console.error("Startup failed:", err.message, "retryable=", err.isRetryable);
      process.exit(1);
    }
    throw err;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
