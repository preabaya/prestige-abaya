# Prestige Abaya — automation scripts

## AI Morning Report (Cursor SDK)

Local/CI runner that mirrors the `generate-morning-report` Edge Function aggregates, then uses **`Agent.prompt()`** from `@cursor/sdk` to write the briefing.

### Setup

```bash
cd scripts
npm install
export CURSOR_API_KEY="cursor_..."
export SUPABASE_SERVICE_ROLE_KEY="..."   # needs read access to sales + tenants
export SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
```

Optional: reads `url` / `anonKey` from `../supabase.config.js` if env vars are unset.

### Run

```bash
npm run morning-report
```

### Schedule (GitHub Actions, cron, etc.)

```yaml
- run: |
    cd scripts && npm ci
    npm run morning-report
  env:
    CURSOR_API_KEY: ${{ secrets.CURSOR_API_KEY }}
    SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

### Edge Function vs SDK

| Path | When to use |
|------|-------------|
| `supabase/functions/generate-morning-report` | Server-side cron inside Supabase; OpenAI placeholder in Deno |
| `scripts/morning-report.mjs` | Cursor agent summary on your machine or CI; uses Composer |

Both can run on the same schedule — Edge Function for structured JSON, SDK script for natural-language digest.
