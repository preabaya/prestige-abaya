# generate-morning-report

Edge function for the **AI Morning Report**: last 24 hours of `sales`, grouped by `tenant_id`.

## What it returns

Per tenant:

- `total_sales_aud` — sum of `line_total_aud` (fallback `total_amount`)
- `transaction_count`
- `top_selling_products` — top 5 by revenue

## Deploy

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy generate-morning-report
```

Set secrets (Dashboard → Edge Functions → Secrets, or CLI):

```bash
supabase secrets set OPENAI_API_KEY=sk-...
# Optional for cron without JWT:
supabase secrets set CRON_SECRET=your-random-secret
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided automatically in the Edge runtime.

## Invoke manually

```bash
curl -X POST "https://YOUR_PROJECT_REF.supabase.co/functions/v1/generate-morning-report" \
  -H "Authorization: Bearer YOUR_ANON_OR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

With `CRON_SECRET` set (and `verify_jwt = false` in config):

```bash
curl -X POST "https://YOUR_PROJECT_REF.supabase.co/functions/v1/generate-morning-report" \
  -H "x-cron-secret: your-random-secret"
```

## Schedule (later)

**Supabase Dashboard → Edge Functions → Cron**, or add a job:

```sql
-- Example: daily 6:00 UTC (requires pg_cron + pg_net enabled on your project)
select cron.schedule(
  'morning-report',
  '0 6 * * *',
  $$
  select net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/generate-morning-report',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', 'your-random-secret'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

## OpenAI / Cursor SDK

- **In-function:** edit the placeholder block in `index.ts` to call OpenAI Chat Completions.
- **Cursor SDK (local/CI):** run `scripts/morning-report.mjs` — aggregates the same sales data and uses `Agent.prompt()` for the narrative report. See `scripts/README.md`.
