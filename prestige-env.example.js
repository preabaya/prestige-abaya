/**
 * انسخ إلى prestige-env.js (أضفه إلى .gitignore) — متغيرات البيئة للإنتاج
 * يُحمَّل قبل prestige-core.js
 */
window.__PRESTIGE_ENV__ = {
  SUPABASE_URL: 'https://YOUR_PROJECT_REF.supabase.co',
  SUPABASE_ANON_KEY: 'YOUR_ANON_PUBLIC_KEY',
  DEFAULT_TENANT_ID: '00000000-0000-0000-0000-000000000001',
  DEFAULT_BRANCH_ID: '00000000-0000-0000-0000-000000000001',
  DEFAULT_COUNTRY_CODE: 'AU',
};
