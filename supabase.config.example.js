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
  /** UUID من جدول public.tenants — يُربط بالمستخدم عبر profiles.tenant_id لـ RLS */
  defaultTenantId: '00000000-0000-0000-0000-000000000001',
  /**
   * true = anon key فقط — لا getSession/ensureAuth قبل القراءة أو الكتابة
   * اجعل skipAuth: false عند تفعيل RLS مع تسجيل دخول حقيقي
   */
  skipAuth: true,
  skipAuthForSales: true,
};

/** Super Admin panel: /admin/index.html — set Auth user app_metadata: { "role": "super_admin" } */
