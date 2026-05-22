/**
 * انسخ هذا الملف إلى: supabase.config.js
 * ثم ضع قيم مشروعك من Supabase Dashboard → Settings → API
 * لا ترفع supabase.config.js إلى GitHub (يحتوي مفاتيح عامة فقط — anon key آمن مع RLS)
 */
window.SUPABASE_CONFIG = {
  url: 'https://YOUR_PROJECT_REF.supabase.co',
  anonKey: 'YOUR_ANON_PUBLIC_KEY',
  /** عند true يُحمَّل/يُحفظ من Supabase بدل localStorage */
  enabled: true,
};
