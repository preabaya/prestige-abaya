/**
 * Prestige Abaya — AUD Base Financial System
 * CurrencyEngine | Expenses | Analytics | Supabase-ready
 */

const BASE_CURRENCY = 'AUD';
const STORAGE_KEY = 'prestige-abaya-v3';
const AUTH_SESSION_KEY = 'prestige-abaya-auth-session';
const CURRENT_TENANT_KEY = 'current_tenant_id';
const SIMPLE_AUTH_KEY = 'loggedIn';
const AUTH_BOOTSTRAP = { username: 'Louay', password: 'Louay2019@' };
/** true = no login screen; app opens as guest (Supabase uses anonymous auth when enabled) */
const AUTH_SKIP_LOGIN = true;
const AUTH_GUEST_NAME = 'guest';

const APP_CONFIG = {
  vatRate: 0.15,
  defaultLang: 'ar',
  stockAlertThreshold: 5,
  exchangeApiUrl: 'https://api.exchangerate-api.com/v4/latest/AUD',
  exchangeCacheHours: 6,
  predictiveStockDays: 15,
  slowMoverDays: 60,
  shippingReminderDays: 28,
  recordSaleMultiplier: 1.5,
  minProfitMarginPct: 20,
  seasonalFactors: { normal: 1, holiday: 1.15, clearance: 0.8 },
  ocrMaxFileMb: 8,
  supabase: { url: '', anonKey: '' },
};

const ABAYA_STYLES = [
  { id: 'classic', key: 'styleClassic' },
  { id: 'embroidered', key: 'styleEmbroidered' },
  { id: 'crepe', key: 'styleCrepe' },
  { id: 'linen', key: 'styleLinen' },
  { id: 'open', key: 'styleOpen' },
  { id: 'kimono', key: 'styleKimono' },
];

const EXPENSE_CATEGORIES = [
  { id: 'import', key: 'catImport' },
  { id: 'intl_shipping', key: 'catIntl' },
  { id: 'packaging', key: 'catPack' },
  { id: 'local_shipping', key: 'catLocal' },
];

const SALE_SOURCES = {
  in_store: 'saleSourceInStore',
  off_store: 'saleSourceOffStore',
};

const PAYMENT_METHODS = [
  { id: 'cash', key: 'payCash' },
  { id: 'transfer', key: 'payTransfer' },
  { id: 'card', key: 'payCard' },
];

const REFUND_METHODS = [
  { id: 'cash', key: 'refundCash' },
  { id: 'card', key: 'refundCard' },
];

const PRODUCT_SIZES = ['52', '54', '56', '58', '60', '62'];

const UI_ICONS = {
  cart: '<svg class="ui-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-1.99.9-1.99 2S15.9 22 17 22s2-.9 2-2-.9-2-2-2zM7.16 14l.84-5h9.45l1.2 6H7.16zM6 6h14l-1-4H5L4 2H1v2h2l3.6 14.59L7 18h12v-2H8.42L6 6z"/></svg>',
  return: '<svg class="ui-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 5V2L7 7l5 5V9c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46A7.93 7.93 0 0 0 20 15c0-4.42-3.58-8-8-8zm-6 6c0-1.01.25-1.97.7-2.8L5.24 6.74A7.93 7.93 0 0 0 4 9c0 4.42 3.58 8 8 8v3l5-5-5-5v3c-3.31 0-6-2.69-6-6z"/></svg>',
  cash: '<svg class="ui-icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>',
  transfer: '<svg class="ui-icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M4 10h12v2H4v-2zm0-4h12v2H4V6zm0 8h8v2H4v-2zm14 0v3.5c0 .83-.67 1.5-1.5 1.5S15 18.33 15 17.5V16h-2v1.5c0 1.93 1.57 3.5 3.5 3.5s3.5-1.57 3.5-3.5V16h-2z"/></svg>',
  card: '<svg class="ui-icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4V10h16v8zm0-11H4V6h16v1z"/></svg>',
  edit: '<svg class="ui-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>',
  discount: '<svg class="ui-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58s1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM6.5 6.5C5.67 6.5 5 5.83 5 5s.67-1.5 1.5-1.5S8 4.17 8 5s-.67 1.5-1.5 1.5zm11.77 9.77l-1.41 1.41-7.07-7.07 1.41-1.41 7.07 7.07z"/></svg>',
  upload: '<svg class="ui-icon" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"/></svg>',
};

const POS_STOCK_URGENT_THRESHOLD = 3;

const TRANSLATIONS = {
  ar: {
    subtitle: 'النظام المالي — العملة الأساسية AUD',
    uploadLogo: 'رفع الشعار',
    dashboard: 'لوحة التحكم',
    pos: 'نقطة بيع سريعة',
    inventory: 'المخزون',
    expenses: 'المصاريف',
    sales: 'المبيعات',
    analytics: 'التحليلات',
    settings: 'الإعدادات',
    save: 'حفظ', cancel: 'إلغاء', delete: 'حذف', edit: 'تعديل', search: 'بحث...',
    code: 'الرمز', name: 'الاسم', size: 'المقاس', color: 'اللون',
    costAud: 'التكلفة (AUD)', priceAud: 'سعر البيع (AUD)', qty: 'الكمية', status: 'الحالة', actions: 'إجراءات',
    available: 'متوفر', low: 'منخفض', out: 'نفد',
    addProduct: 'إضافة منتج', recordSale: 'تسجيل بيع', addExpense: 'إضافة مصروف',
    expenseName: 'اسم المصروف', category: 'التصنيف', currency: 'العملة',
    originalAmount: 'المبلغ الأصلي', exchangeRate: 'سعر الصرف → AUD',
    audValue: 'القيمة بالـ AUD', vat: 'ضريبة القيمة المضافة', totalAud: 'الإجمالي AUD',
    catImport: 'استيراد عبايات', catIntl: 'شحن دولي', catPack: 'تغليف/استكرات', catLocal: 'شحن محلي',
    aud: 'دولار أسترالي', sar: 'ريال سعودي', usd: 'دولار أمريكي',
    profitAud: 'صافي الأرباح (AUD)', revenueAud: 'الإيرادات (AUD)', expensesAud: 'المصاريف (AUD)',
    costDist: 'توزيع التكاليف', profitForecast: 'توقعات الأرباح', topProducts: 'أكثر المنتجات مبيعاً',
    shippingShare: 'نسبة الشحن', abayaShare: 'نسبة العبايات', aiInsights: 'رؤى ذكية',
    noData: 'لا توجد بيانات', saved: 'تم الحفظ', deleted: 'تم الحذف', confirmDelete: 'تأكيد الحذف؟',
    customer: 'العميل', payment: 'الدفع', product: 'المنتج', date: 'التاريخ', notes: 'ملاحظات',
    totalProducts: 'المنتجات', totalStock: 'المخزون', totalSales: 'المبيعات',
    baseCurrency: 'العملة الأساسية: AUD', exchangeHint: 'كم AUD لكل 1 وحدة من العملة الأجنبية',
    logoSettings: 'شعار البراند', supabaseLocal: 'تخزين محلي', supabaseReady: 'جاهز لـ Supabase',
    forecastNote: 'تقدير شهري بناءً على معدل المبيعات الحالي',
    allExpenses: 'جدول المصاريف', filterCategory: 'كل التصنيفات',
    exportExcel: 'تصدير إلى Excel',
    exportFull: 'تصدير البيانات الكاملة',
    sheetSales: 'المبيعات',
    sheetExpenses: 'المصروفات',
    sheetInventory: 'المخزون',
    sheetSummary: 'ملخص الأداء',
    exportGenerated: 'تاريخ التصدير',
    exportBrand: 'Prestige Abaya',
    categorySubtotal: 'إجمالي التصنيف',
    costOfSales: 'تكلفة البضاعة المباعة',
    daysLeftForecast: 'أيام متبقية (تنبؤ)',
    exported: 'تم التصدير بنجاح',
    fabExpense: 'مصروف جديد',
    fabSale: 'بيع جديد',
    fabProduct: 'منتج جديد',
    fabPos: 'نقطة بيع',
    quickAdd: 'إضافة سريعة',
    smartDashboard: 'لوحة قيادة ذكية',
    inventoryTurnover: 'معدل دوران المخزون',
    turnoverDesc: 'تكلفة المبيعات ÷ قيمة المخزون الحالية',
    turnoverTimes: 'مرة',
    weeklySales: 'اتجاه المبيعات الأسبوعي',
    stockAlerts: 'تنبيهات المخزون',
    stockAlertMsg: 'كمية منخفضة — أقل من 5 قطع',
    noAlerts: 'كل المنتجات ضمن المستوى الآمن',
    unitsSold: 'وحدات مباعة',
    invValue: 'قيمة المخزون',
    smartProfitTracker: 'لوحة الربحية الذكية',
    invSuggestedSalePrice: 'سعر البيع المقترح (AUD)',
    invUnitProfit: 'ربح القطعة',
    invLineProfit: 'إجمالي ربح الصنف',
    invTotalPurchaseValue: 'إجمالي قيمة الشراء للمخزون',
    invTotalExpectedProfit: 'إجمالي الربح المتوقع',
    invExpectedRevenue: 'إيرادات متوقعة (بيع كامل الكمية)',
    invInventoryGrandTotal: 'إجمالي المخزون',
    invProfitMargin: 'هامش الربح',
    invLowMarginHint: 'هامش أقل من {pct}% — أعد التسعير',
    smartSeasonalMode: 'وضع المواسم الذكي',
    seasonNormal: 'الوضع العادي',
    seasonHoliday: 'موسم الأعياد',
    seasonClearance: 'التصفية',
    seasonFactorHoliday: '+15% على سعر البيع',
    seasonFactorClearance: '−20% على سعر البيع',
    seasonBasePrice: 'السعر الأساسي المحفوظ',
    seasonAdjustedPrice: 'سعر السيناريو',
    seasonModeApplied: 'تم تطبيق وضع {mode}',
    authLoginTab: 'تسجيل الدخول',
    authRegisterTab: 'إنشاء حساب',
    authSubtitle: 'نظام مالي ومخزوني آمن',
    authUsername: 'اسم المستخدم',
    authEmail: 'البريد الإلكتروني',
    authPassword: 'كلمة المرور',
    authLoginBtn: 'دخول',
    authRegisterBtn: 'تسجيل',
    authForgotPassword: 'نسيت كلمة المرور؟',
    authForgotHint: 'محاكاة إرسال بريد: تم إرسال تذكير إلى {email}. تحقق من صندوق الوارد (تجريبي).',
    authForgotNoEmail: 'أدخل بريدك الإلكتروني في نموذج الدخول أولاً.',
    authLogout: 'تسجيل خروج',
    authWelcome: 'مرحباً، {name}',
    authRequired: 'يرجى تسجيل الدخول أولاً',
    authInvalidCredentials: 'بيانات الدخول غير صحيحة',
    authUserExists: 'اسم المستخدم أو البريد مستخدم مسبقاً',
    authWeakPassword: 'كلمة المرور 6 أحرف على الأقل',
    authInvalidEmail: 'بريد إلكتروني غير صالح',
    authLoggedOut: 'تم تسجيل الخروج',
    authRegisterSuccess: 'تم إنشاء الحساب — يمكنك الدخول الآن',
    authLoginIdentifier: 'اسم المستخدم أو البريد الإلكتروني',
    authLoginIdentifierPh: 'أدخل اسم المستخدم أو البريد',
    authNoAccount: 'ليس لديك حساب؟',
    authHasAccount: 'لديك حساب بالفعل؟',
    authGoRegister: 'إنشاء حساب',
    authGoLogin: 'تسجيل الدخول',
    authUsernameShort: 'اسم المستخدم حرفان على الأقل',
    authShowPassword: 'إظهار كلمة المرور',
    authHidePassword: 'إخفاء كلمة المرور',
    authForgotNoIdentifier: 'أدخل بريدك الإلكتروني في حقل الدخول أولاً.',
    userCurrent: 'المستخدم الحالي',
    activityFeedTitle: 'سجل النشاط الحي',
    activityFeedEmpty: 'لا توجد عمليات حديثة',
    activityFeedLine: 'تم إدخال {type} من قبل {user} قبل {time} بقيمة {amount}',
    actTypeInvoice: 'فاتورة مورد',
    actTypeProduct: 'منتج جديد',
    actTypeProductUpdate: 'تحديث مخزون',
    actTypeExpense: 'مصروف',
    actTypeSale: 'بيع',
    actTypePos: 'بيع نقطة البيع',
    timeAgoMinutes: '{n} دقيقة',
    timeAgoHours: '{n} ساعة',
    timeAgoDays: '{n} يوم',
    timeAgoNow: 'الآن',
    invTxCreatedBy: 'المسؤول',
    users: 'إدارة المستخدمين',
    userManagement: 'إدارة المستخدمين',
    userManagementDesc: 'أنشئ حسابات لزملائك — كل عملية تُسجَّل باسم المستخدم.',
    addSystemUser: 'إضافة مستخدم',
    usersList: 'قائمة المستخدمين',
    userRoleAdmin: 'مدير',
    userRoleUser: 'مستخدم',
    userCreatedAt: 'تاريخ الإنشاء',
    userCreatedByCol: 'أُنشئ بواسطة',
    userDelete: 'حذف',
    userAdded: 'تم إنشاء المستخدم',
    userExists: 'اسم المستخدم موجود مسبقاً',
    cannotDeleteSelf: 'لا يمكن حذف حسابك الحالي',
    cannotDeleteAdmin: 'لا يمكن حذف حساب المدير الرئيسي',
    confirmDeleteUser: 'حذف هذا المستخدم؟',
    week: 'أسبوع',
    piecesLeft: 'قطعة متبقية',
    reorder: 'إعادة طلب',
    forecastDays: 'بناءً على معدل البيع، مخزونك الحالي يكفي لـ {days} يوماً فقط',
    forecastNoData: 'لا توجد مبيعات كافية في آخر 3 أشهر للتنبؤ',
    forecastOut: 'المخزون نفد — يُنصح بإعادة الطلب فوراً',
    forecastSafe: 'مخزونك يكفي لأكثر من 90 يوماً بناءً على معدل البيع',
    pricingCalculator: 'حاسبة التسعير',
    smartPricing: 'مساعد التسعير الذكي',
    smartPricingDesc: 'أدخل تكاليف القطعة وهامش الربح — يُحسب سعر البيع المقترح فوراً. انسخه يدوياً إلى حقل سعر البيع إذا أعجبك.',
    costFabric: 'تكلفة القماش (AUD)',
    costTailoring: 'تكلفة الخياطة (AUD)',
    costPackaging: 'تكلفة التغليف (AUD)',
    targetMargin: 'هامش الربح المطلوب',
    marginOnSale: 'هامش على سعر البيع',
    suggestedPrice: 'سعر البيع المقترح',
    unitCostTotal: 'إجمالي تكلفة القطعة',
    applySuggestedPrice: 'تطبيق السعر المقترح',
    applyUnitCost: 'تطبيق التكلفة للمنتج',
    priceApplied: 'تم تطبيق السعر',
    costApplied: 'تم تطبيق التكلفة',
    estimateCosts: 'تقدير من المصروفات',
    dynamicPricing: 'مساعد التسعير الديناميكي',
    dynamicPricingDesc: 'اجمع تكلفة القطعة والمصاريف، ثم اعرض ثلاثة أسعار مقترحة حسب مستوى الهامش.',
    dpSelectProduct: 'اختر العباية من المخزون',
    dpSelectProductHint: '— أو أدخل التكاليف يدوياً —',
    dpBaseCost: 'سعر التكلفة الأساسي (AUD)',
    dpIntlShipping: 'الشحن الدولي (AUD)',
    dpPackaging: 'التغليف (AUD)',
    dpLocalShipping: 'الشحن المحلي (AUD)',
    dpTotalCost: 'إجمالي التكلفة للقطعة',
    dpCalculate: 'حساب الأسعار المقترحة',
    dpEstimateExpenses: 'تقدير من المصروفات',
    dpLiquidation: 'سعر التصفية',
    dpLiquidationDesc: 'يغطي التكلفة فقط — دوران سريع للمخزون',
    dpCompetitive: 'سعر منافس',
    dpCompetitiveDesc: 'تكلفة + 20% هامش — توازن بين الربح والطلب',
    dpPremium: 'سعر فاخر',
    dpPremiumDesc: 'تكلفة + 40% هامش — للموديلات المميزة',
    dpPremiumRarity: 'عدّل السعر حسب ندرة الموديل والطلب في السوق',
    dpApplySalePrice: 'تطبيق كسعر للبيع',
    dpMarginLabel: 'هامش {pct}%',
    dpResultsEmpty: 'اضغط «حساب الأسعار المقترحة» لعرض البطاقات',
    editPrice: 'تعديل سعر',
    suggestPricing: 'تعديل سعر',
    liveRates: 'جسر العملات المباشر',
    liveRatesDesc: 'أسعار صرف محدّثة تلقائياً عند فتح النظام (SAR/USD → AUD)',
    ratesUpdated: 'آخر تحديث',
    ratesLive: 'مباشر',
    ratesStale: 'محفوظ محلياً',
    ratesLoading: 'جاري جلب الأسعار...',
    ratesError: 'تعذّر التحديث — يُستخدم آخر سعر محفوظ',
    refreshRates: 'تحديث الأسعار',
    sarToAud: '1 ريال =',
    usdToAud: '1 دولار أمريكي =',
    rateAutoApplied: 'يُطبَّق تلقائياً في حاسبة المصروفات',
    predictiveBuying: 'التوقع الاستباقي للشراء',
    predictiveBuyingDesc: 'تحليل معدل البيع الشهري وتنبيهات إعادة الطلب قبل نفاد المخزون',
    proactiveAlert: 'معدل بيعك ({qty}/شهر) يشير لاحتمالية نفاد مخزون «{name}» خلال {days} يوماً. يوصى بطلب كمية إضافية{shipping}',
    shippingRiseHint: ' قبل زيادة تكاليف الشحن المتوقعة',
    shippingTrendUp: 'تكاليف الشحن الدولي في ارتفاع',
    monthlySales: 'مبيعات الشهر',
    styleInsights: 'تحليل ذوق العميل',
    styleInsightsDesc: 'ألوان وموديلات رائجة وبطيئة الحركة في أستراليا',
    abayaStyle: 'نوع العباية',
    topColor: 'اللون الأكثر طلباً',
    topStyle: 'النوع الأكثر مبيعاً',
    slowMovers: 'موديلات راكدة في المخزون',
    slowMoverHint: 'لا مبيعات منذ {days} يوماً — {qty} قطعة متبقية',
    units: 'قطعة',
    styleClassic: 'كلاسيك',
    styleEmbroidered: 'مطرّز',
    styleCrepe: 'كريب',
    styleLinen: 'كتان',
    styleOpen: 'مفتوح',
    styleKimono: 'كيمونو',
    saleColor: 'اللون',
    smartNotifications: 'تنبيهات ذكية',
    enableNotifications: 'تفعيل إشعارات الجوال',
    notificationsHint: 'إشعارات عند مبيعات قياسية، نفاد مخزون، أو موعد شحن دولي',
    maintenanceMode: 'صيانة النظام',
    maintenanceModeDesc: 'يمسح المخزون والفواتير والمبيعات وحركات المخزون فقط — دون المساس بحسابات المستخدمين أو جلسة الدخول.',
    resetDatabaseBtn: 'حذف جميع العمليات والبدء من جديد',
    resetDbConfirm: 'تحذير: سيتم حذف جميع الفواتير والمبيعات وحركات المخزون، هل أنت متأكد؟',
    resetDbSuccess: 'تم تصفير المخزون والعمليات. حسابات المستخدمين محفوظة.',
    notificationsOn: 'مفعّلة',
    notificationsOff: 'غير مفعّلة',
    notificationsDenied: 'تم رفض الإذن من المتصفح',
    notifyRecordSales: 'مبيعات قياسية اليوم!',
    notifyRecordSalesBody: 'حققت {qty} مبيعة اليوم — أعلى من معدلك اليومي',
    notifyStockLow: 'مخزون منخفض',
    notifyStockLowBody: '{name}: {qty} قطع متبقية — أعد الطلب',
    notifyShippingDue: 'تذكير شحن دولي',
    notifyShippingDueBody: 'مرّ {days} يوماً على آخر شحنة — راجع فاتورة الشحن من السعودية',
    expenseDueDate: 'موعد السداد (اختياري)',
    noProactiveAlerts: 'لا توجد تنبيهات استباقية حالياً',
    saleSource: 'مصدر البيع',
    saleSourceInStore: 'داخل المتجر',
    saleSourceOffStore: 'خارج المتجر',
    posTapHint: 'ابحث عن المنتج، اضغط على السطر لتعديله، ثم إتمام الدفع — المخزون يُخصم عند الدفع فقط',
    posSoldNow: 'تم البيع بنجاح',
    posNoStock: 'لا توجد منتجات متوفرة للبيع',
    posLastSale: 'آخر عملية',
    posSearchPlaceholder: 'ابحث عن منتج — الاسم، الرمز، اللون...',
    posNoResults: 'لا توجد نتائج',
    posCheckout: 'إتمام البيع',
    posQty: 'الكمية',
    posDiscountType: 'نوع الخصم',
    posDiscountNone: 'بدون خصم',
    posDiscountPercent: 'نسبة %',
    posDiscountFixed: 'مبلغ ثابت AUD',
    posDiscountValue: 'قيمة الخصم',
    posSubtotal: 'المجموع الفرعي',
    posDiscount: 'الخصم',
    posTotal: 'الإجمالي',
    posConfirmSale: 'تأكيد البيع',
    posNotes: 'ملاحظات',
    posInStock: 'متوفر',
    posClose: 'إغلاق',
    posTopSellers: 'الأكثر مبيعاً',
    posCart: 'السلة',
    posCartEmpty: 'السلة فارغة — ابحث أو اختر من الأكثر مبيعاً',
    posCompletePayment: 'إتمام الدفع',
    posPay: 'دفع',
    returnPaidAfterDiscount: 'السعر المدفوع بعد الخصم',
    posStockUrgent: 'متبقي {n} فقط!',
    connectionOnline: 'متصل · سحابي',
    connectionLocal: 'محلي',
    paymentMethodCol: 'طريقة الدفع',
    posCartTotal: 'المجموع الكلي',
    posAddedToCart: 'أُضيف إلى السلة',
    posCartCheckoutDone: 'تم تسجيل الدفعة وخصم المخزون',
    posPaymentSuccess: 'تمت العملية بنجاح · رقم الفاتورة {inv}',
    posPriceAfterDisc: 'السعر بعد الخصم',
    posCartTapEdit: 'اضغط على البطاقة لتعديل المقاس أو الشحن',
    posDiscountLine: 'خصم المنتج',
    posRemove: 'حذف',
    posCartDrawer: 'سلة التسوق',
    posOpenCart: 'السلة',
    posCartDiscount: 'خصم على السلة',
    posSelectPayment: 'اختر طريقة الدفع',
    payCash: 'كاش',
    payTransfer: 'تحويل بنكي',
    payCard: 'بطاقة / POS',
    logoPreviewHint: 'يظهر الشعار مصغّراً في الترويسة بعد الرفع',
    returns: 'المرتجعات',
    returnsDesc: 'ابحث برقم الفاتورة، حدّد المنتجات المراد إرجاعها، واختر طريقة الاسترداد',
    returnSale: 'إرجاع',
    returnConfirm: 'تأكيد إرجاع هذه العملية؟',
    returned: 'مُرتجَع',
    returnDone: 'تم تسجيل المرتجع وإعادة المخزون',
    refundAud: 'مبلغ المرتجع',
    totalReturns: 'إجمالي المرتجعات',
    saleNotReturnable: 'لا يمكن إرجاع هذه العملية',
    invoiceNumber: 'رقم الفاتورة',
    searchInvoice: 'ابحث برقم الفاتورة (مثال PA-1001)...',
    invoiceFound: 'تم العثور على الفاتورة',
    invoiceGenerated: 'رقم الفاتورة',
    invoiceDetails: 'تفاصيل الفاتورة',
    selectItemsReturn: 'حدّد المنتجات المراد إرجاعها',
    refundTotal: 'إجمالي الاسترداد',
    confirmReturn: 'تأكيد المرتجع',
    refundMethod: 'طريقة الاسترداد',
    refundCash: 'إرجاع كاش',
    refundCard: 'إرجاع للبطاقة / POS',
    posEditLine: 'تعديل المنتج',
    productImage: 'صورة المنتج',
    uploadProductImage: 'رفع صورة',
    posCartEditHint: 'اضغط زر التعديل لتغيير المقاس أو الكمية',
    posExtraShipping: 'رسوم شحن إضافية',
    posLineDiscount: 'خصم المنتج',
    posAvailableStock: 'متاح للسلة',
    posSaveLine: 'حفظ التعديل',
    invoiceNotFound: 'لم تُعثر على الفاتورة',
    supplierInvoiceProcessor: 'المعالج الذكي للفواتير الدولية',
    supplierInvoiceDesc: 'رفع PDF/JPG — OCR ذكي، حسابات ضريبة 15%، تحويل SAR→AUD، وجدول مراجعة قابل للتعديل قبل الحفظ للمخزون.',
    iipAiBadge: 'معالجة ذكية',
    iipFxHistorySaved: 'تم حفظ سعر الصرف كمرجع تاريخي',
    iipAvgCostUpdated: 'تم تحديث متوسط التكلفة',
    invTxLog: 'سجل حركات المخزون',
    invTxInvoice: 'رقم الفاتورة',
    invTxDate: 'تاريخ المعالجة',
    invTxCostAud: 'التكلفة (AUD)',
    invTxFx: 'سعر الصرف',
    invTxProduct: 'المنتج',
    invTxQtyAdded: 'كمية مضافة',
    invTxCostChange: 'تكلفة (قبل → بعد)',
    invFormReset: 'تم التصفير — جاهز لفاتورة جديدة',
    invCostSaved: 'تم حفظ التكلفة في المخزون',
    invConfirmSaveSuccess: 'تم تأكيد الحفظ بنجاح! تم تحديث المخزون وتوثيق الحركات.',
    invConfirmSaving: 'جاري الترحيل إلى المخزون…',
    invValidateFxMissing: 'أدخل سعر الصرف (SAR → AUD) قبل الحفظ.',
    invValidateEmptyRows: 'أضف صنفاً واحداً على الأقل في جدول المراجعة.',
    invValidateRowName: 'اسم الصنف مطلوب في كل صف.',
    invValidateRowQty: 'الكمية يجب أن تكون 1 أو أكثر.',
    invValidateRowCost: 'تكلفة الوحدة بالـ AUD مطلوبة في كل صف.',
    invInventoryUpdatedSuccess: 'تم تحديث المخزون بنجاح',
    sipExchangeRate: 'سعر الصرف (1 ر.س = ؟ AUD)',
    sipExchangeHint: '1 SAR = {rate} AUD',
    sipTotalAud: 'المجموع (AUD)',
    sipUpdateProductCost: 'تحديث تكلفة المنتج',
    sipCostUpdated: 'تم تحديث تكلفة المنتج في المخزون',
    sipProductNotFound: 'لم يُعثر على منتج بهذا الاسم — أضفه أولاً من نموذج المنتج',
    sipUnitExVat: 'السعر بدون ضريبة (ر.س)',
    iipInvoiceNumber: 'رقم الفاتورة',
    iipItemName: 'اسم الصنف',
    iipUnitExVat: 'سعر الوحدة بدون ضريبة',
    iipLineExVat: 'إجمالي بدون ضريبة',
    iipVat15: 'ضريبة 15%',
    iipLineIncVat: 'إجمالي مع الضريبة',
    iipCurrency: 'العملة',
    iipFxRate: 'سعر الصرف → AUD',
    iipOrigToAud: 'الأصلية → AUD',
    iipUnitAud: 'تكلفة الوحدة AUD',
    iipLineAud: 'إجمالي AUD',
    iipFormats: 'JPG · PNG · PDF — حتى 8 ميجابايت',
    iipPdfLibMissing: 'مكتبة PDF غير محمّلة — أعد تحميل الصفحة',
    iipFormatsOnly: 'الصيغ المدعومة: JPG أو PDF فقط',
    iipVatSaudi: 'ضريبة سعودية 15%',
    iipRefreshRates: 'تحديث أسعار الصرف',
    iipLandCostNote: 'التكلفة النهائية بالـ AUD (شاملة الضريبة بعد التحويل)',
    uploadSupplierInvoice: 'رفع فاتورة',
    sipDropHint: 'اسحب صورة الفاتورة هنا أو انقر للاختيار',
    sipDropFormats: 'JPG · PNG · WebP — حتى 8 ميجابايت',
    sipStartProcess: 'بدء المعالجة',
    sipManualFallback: 'إدخال يدوي سريع',
    sipManualTitle: 'إدخال يدوي — OCR غير متاح',
    sipManualDesc: 'أدخل بنود الفاتورة يدوياً ثم انتقل للمراجعة.',
    sipOpenManual: 'متابعة للإدخال اليدوي',
    sipProcessing: 'جاري المعالجة…',
    sipManualAlert: 'تعذّر قراءة الفاتورة تلقائياً.\n\nيرجى إدخال البيانات يدوياً في الجدول.',
    sipOcrDone: 'اكتملت القراءة — راجع الجدول أدناه',
    sipPurchasePrice: 'سعر الشراء (AUD)',
    sipLineTotal: 'الإجمالي (AUD)',
    sipMapping: 'الربط',
    sipMapped: 'مربوط',
    sipNewProduct: 'منتج جديد',
    sipApproveSave: 'حفظ وتأكيد إلى المخزون',
    sipReviewTitle: 'جدول مراجعة الفاتورة',
    sipReviewHint: 'راجع كل خلية وعدّلها يدوياً قبل الحفظ — ثم اضغط «حفظ وتأكيد إلى المخزون».',
    sipUnitCostAud: 'تكلفة الوحدة (AUD)',
    sipOcrReview: 'تم استخراج البيانات — راجع الدقة قبل التأكيد',
    sipGrandTotal: 'المجموع النهائي',
    sipGrandTotalSar: 'المجموع بالريال (SAR)',
    sipGrandTotalAud: 'المجموع بالدولار الأسترالي (AUD)',
    sipGrandTotalAudHint: 'الرقم المعتمد للمراجعة والحفظ',
    aiInvoiceEntry: 'معالجة فواتير الموردين',
    aiInvoiceDesc: 'ارفع صورة فاتورة المورد — Tesseract أو إدخال يدوي، ثم مراجعة وحفظ.',
    invoiceOcrScanning: 'جاري قراءة الفاتورة...',
    invoiceOcrProgress: 'جاري التحليل {pct}%',
    invoiceOcrFailed: 'تعذّر قراءة الفاتورة — استخدم صورة أوضح (JPG/PNG)',
    invoiceOcrLibMissing: 'مكتبة OCR غير محمّلة — أعد تحميل الصفحة',
    invoicePdfUseImage: 'PDF غير مدعوم حالياً — ارفع صورة للفاتورة (JPG أو PNG)',
    invoiceNoItemsFound: 'لم يُستخرج أي منتج — عدّل البيانات يدوياً أو جرّب صورة أوضح',
    invoiceFileTooLarge: 'حجم الملف كبير جداً (الحد 8 ميجابايت)',
    invoicePreviewTitle: 'جدول مراجعة — فاتورة المورد',
    invoicePreviewHint: 'صحّح الأخطاء بزر «تعديل» ثم اعتمد الحفظ لإضافة المنتجات للمخزون فوراً.',
    invoiceReviewName: 'اسم المنتج',
    invoiceReviewPrice: 'سعر الوحدة (AUD)',
    invoiceConfirmImport: 'اعتماد وحفظ في المخزون',
    invoiceEditRow: 'تعديل',
    invoiceConfirmTitle: 'تأكيد إضافة المنتجات التالية إلى المخزون؟',
    invoiceConfirmHint: 'يمكنك الرجوع وتعديل الجدول قبل التأكيد.',
    invoiceImportDone: 'تمت إضافة المخزون بنجاح',
    invoiceAddRow: 'إضافة سطر',
    invoiceRemoveRow: 'حذف',
  },
  en: {
    subtitle: 'Financial System — Base Currency AUD',
    uploadLogo: 'Upload Logo',
    dashboard: 'Dashboard',
    pos: 'Quick POS',
    inventory: 'Inventory',
    expenses: 'Expenses',
    sales: 'Sales',
    analytics: 'Analytics',
    settings: 'Settings',
    save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit', search: 'Search...',
    code: 'Code', name: 'Name', size: 'Size', color: 'Color',
    costAud: 'Cost (AUD)', priceAud: 'Sale Price (AUD)', qty: 'Qty', status: 'Status', actions: 'Actions',
    available: 'In Stock', low: 'Low', out: 'Out',
    addProduct: 'Add Product', recordSale: 'Record Sale', addExpense: 'Add Expense',
    expenseName: 'Expense Name', category: 'Category', currency: 'Currency',
    originalAmount: 'Original Amount', exchangeRate: 'Exchange Rate → AUD',
    audValue: 'AUD Value', vat: 'VAT', totalAud: 'Total AUD',
    catImport: 'Abaya Import', catIntl: 'International Shipping', catPack: 'Packaging/Stickers', catLocal: 'Local Shipping',
    aud: 'Australian Dollar', sar: 'Saudi Riyal', usd: 'US Dollar',
    profitAud: 'Net Profit (AUD)', revenueAud: 'Revenue (AUD)', expensesAud: 'Expenses (AUD)',
    costDist: 'Cost Distribution', profitForecast: 'Profit Forecast', topProducts: 'Top Products',
    shippingShare: 'Shipping %', abayaShare: 'Abayas %', aiInsights: 'AI Insights',
    noData: 'No data', saved: 'Saved', deleted: 'Deleted', confirmDelete: 'Confirm delete?',
    customer: 'Customer', payment: 'Payment', product: 'Product', date: 'Date', notes: 'Notes',
    totalProducts: 'Products', totalStock: 'Stock', totalSales: 'Sales',
    baseCurrency: 'Base currency: AUD', exchangeHint: 'AUD per 1 unit of foreign currency',
    logoSettings: 'Brand Logo', supabaseLocal: 'Local storage', supabaseReady: 'Supabase ready',
    forecastNote: 'Monthly estimate from current sales rate',
    allExpenses: 'Expenses Table', filterCategory: 'All categories',
    exportExcel: 'Export to Excel',
    exportFull: 'Export Full Data',
    sheetSales: 'Sales',
    sheetExpenses: 'Expenses',
    sheetInventory: 'Inventory',
    sheetSummary: 'Performance Summary',
    exportGenerated: 'Export date',
    exportBrand: 'Prestige Abaya',
    categorySubtotal: 'Category subtotal',
    costOfSales: 'Cost of goods sold',
    daysLeftForecast: 'Days left (forecast)',
    exported: 'Exported successfully',
    fabExpense: 'New expense',
    fabSale: 'New sale',
    fabProduct: 'New product',
    fabPos: 'Quick POS',
    quickAdd: 'Quick add',
    smartDashboard: 'Smart Dashboard',
    inventoryTurnover: 'Inventory Turnover Rate',
    turnoverDesc: 'COGS ÷ current inventory value',
    turnoverTimes: 'x',
    weeklySales: 'Weekly Sales Trend',
    stockAlerts: 'Stock Alerts',
    stockAlertMsg: 'Low stock — below 5 units',
    noAlerts: 'All products above safe level',
    unitsSold: 'Units sold',
    invValue: 'Inventory value',
    smartProfitTracker: 'Smart Profitability Tracker',
    invSuggestedSalePrice: 'Suggested sale price (AUD)',
    invUnitProfit: 'Unit profit',
    invLineProfit: 'Line profit (stock)',
    invTotalPurchaseValue: 'Total inventory purchase value',
    invTotalExpectedProfit: 'Total expected profit',
    invExpectedRevenue: 'Expected revenue (if all sold)',
    invInventoryGrandTotal: 'Inventory totals',
    invProfitMargin: 'Profit margin',
    invLowMarginHint: 'Margin below {pct}% — repricing recommended',
    smartSeasonalMode: 'Smart Seasonal Mode',
    seasonNormal: 'Normal',
    seasonHoliday: 'Holiday season',
    seasonClearance: 'Clearance',
    seasonFactorHoliday: '+15% on sale price',
    seasonFactorClearance: '−20% on sale price',
    seasonBasePrice: 'Saved base price',
    seasonAdjustedPrice: 'Scenario price',
    seasonModeApplied: '{mode} mode applied',
    authLoginTab: 'Sign in',
    authRegisterTab: 'Register',
    authSubtitle: 'Secure financial & inventory system',
    authUsername: 'Username',
    authEmail: 'Email',
    authPassword: 'Password',
    authLoginBtn: 'Sign in',
    authRegisterBtn: 'Create account',
    authForgotPassword: 'Forgot password?',
    authForgotHint: 'Email simulation: reminder sent to {email}. Check your inbox (demo).',
    authForgotNoEmail: 'Enter your email in the sign-in form first.',
    authLogout: 'Sign out',
    authWelcome: 'Welcome, {name}',
    authRequired: 'Please sign in first',
    authInvalidCredentials: 'Invalid username/email or password',
    authUserExists: 'Username or email already registered',
    authWeakPassword: 'Password must be at least 6 characters',
    authInvalidEmail: 'Invalid email address',
    authLoggedOut: 'Signed out',
    authRegisterSuccess: 'Account created — you can sign in now',
    authLoginIdentifier: 'Username or email',
    authLoginIdentifierPh: 'Enter username or email',
    authNoAccount: "Don't have an account?",
    authHasAccount: 'Already have an account?',
    authGoRegister: 'Create account',
    authGoLogin: 'Sign in',
    authUsernameShort: 'Username must be at least 2 characters',
    authShowPassword: 'Show password',
    authHidePassword: 'Hide password',
    authForgotNoIdentifier: 'Enter your email in the sign-in field first.',
    userCurrent: 'Current user',
    activityFeedTitle: 'Live activity feed',
    activityFeedEmpty: 'No recent activity',
    activityFeedLine: '{type} entered by {user} {time} ago · {amount}',
    actTypeInvoice: 'supplier invoice',
    actTypeProduct: 'new product',
    actTypeProductUpdate: 'inventory update',
    actTypeExpense: 'expense',
    actTypeSale: 'sale',
    actTypePos: 'POS sale',
    timeAgoMinutes: '{n} min',
    timeAgoHours: '{n} hr',
    timeAgoDays: '{n} days',
    timeAgoNow: 'just now',
    invTxCreatedBy: 'Responsible',
    users: 'User management',
    userManagement: 'User management',
    userManagementDesc: 'Create accounts for your team — every action is tagged with the username.',
    addSystemUser: 'Add user',
    usersList: 'User list',
    userRoleAdmin: 'Admin',
    userRoleUser: 'User',
    userCreatedAt: 'Created',
    userCreatedByCol: 'Created by',
    userDelete: 'Delete',
    userAdded: 'User created',
    userExists: 'Username already exists',
    cannotDeleteSelf: 'You cannot delete your own account',
    cannotDeleteAdmin: 'Cannot delete the primary admin account',
    confirmDeleteUser: 'Delete this user?',
    week: 'Week',
    piecesLeft: 'units left',
    reorder: 'Reorder',
    forecastDays: 'Based on sales rate, current stock lasts ~{days} days only',
    forecastNoData: 'Not enough sales in last 3 months to forecast',
    forecastOut: 'Out of stock — reorder immediately',
    forecastSafe: 'Stock lasts 90+ days at current sales rate',
    pricingCalculator: 'Pricing Calculator',
    smartPricing: 'Smart Pricing Assistant',
    smartPricingDesc: 'Enter unit costs and margin — suggested sale price updates live. Copy it into the sale price field if you like it.',
    costFabric: 'Fabric cost (AUD)',
    costTailoring: 'Tailoring cost (AUD)',
    costPackaging: 'Packaging cost (AUD)',
    targetMargin: 'Target profit margin',
    marginOnSale: 'Margin on sale price',
    suggestedPrice: 'Suggested sale price',
    unitCostTotal: 'Total unit cost',
    applySuggestedPrice: 'Apply suggested price',
    applyUnitCost: 'Apply cost to product',
    priceApplied: 'Price applied',
    costApplied: 'Cost applied',
    estimateCosts: 'Estimate from expenses',
    dynamicPricing: 'Dynamic Pricing Assistant',
    dynamicPricingDesc: 'Sum unit cost and expenses, then view three suggested price tiers by margin level.',
    dpSelectProduct: 'Select abaya from inventory',
    dpSelectProductHint: '— or enter costs manually —',
    dpBaseCost: 'Base unit cost (AUD)',
    dpIntlShipping: 'International shipping (AUD)',
    dpPackaging: 'Packaging (AUD)',
    dpLocalShipping: 'Local shipping (AUD)',
    dpTotalCost: 'Total unit cost',
    dpCalculate: 'Calculate suggested prices',
    dpEstimateExpenses: 'Estimate from expenses',
    dpLiquidation: 'Liquidation',
    dpLiquidationDesc: 'Covers cost only — fast inventory turnover',
    dpCompetitive: 'Competitive',
    dpCompetitiveDesc: 'Cost + 20% margin — balanced profit and demand',
    dpPremium: 'Premium',
    dpPremiumDesc: 'Cost + 40% margin — for standout models',
    dpPremiumRarity: 'Adjust for model rarity and market demand',
    dpApplySalePrice: 'Apply as sale price',
    dpMarginLabel: '{pct}% margin',
    dpResultsEmpty: 'Click «Calculate suggested prices» to show cards',
    editPrice: 'Edit price',
    suggestPricing: 'Edit price',
    liveRates: 'Live Currency Bridge',
    liveRatesDesc: 'Auto-updated FX on open (SAR/USD → AUD)',
    ratesUpdated: 'Last updated',
    ratesLive: 'Live',
    ratesStale: 'Cached locally',
    ratesLoading: 'Fetching rates...',
    ratesError: 'Update failed — using last saved rate',
    refreshRates: 'Refresh rates',
    sarToAud: '1 SAR =',
    usdToAud: '1 USD =',
    rateAutoApplied: 'Auto-applied in expense calculator',
    predictiveBuying: 'Predictive Buying',
    predictiveBuyingDesc: 'Monthly sales rate & reorder alerts before stockout',
    proactiveAlert: 'Your rate ({qty}/mo) suggests «{name}» may stock out in {days} days. Reorder soon{shipping}',
    shippingRiseHint: ' before expected intl. shipping cost increases',
    shippingTrendUp: 'International shipping costs rising',
    monthlySales: 'Monthly sales',
    styleInsights: 'Customer Style Analytics',
    styleInsightsDesc: 'Trending colors & slow-moving models in Australia',
    abayaStyle: 'Abaya style',
    topColor: 'Most requested color',
    topStyle: 'Best-selling style',
    slowMovers: 'Slow-moving inventory',
    slowMoverHint: 'No sales for {days} days — {qty} units left',
    units: 'units',
    styleClassic: 'Classic',
    styleEmbroidered: 'Embroidered',
    styleCrepe: 'Crepe',
    styleLinen: 'Linen',
    styleOpen: 'Open front',
    styleKimono: 'Kimono',
    saleColor: 'Color',
    smartNotifications: 'Smart Notifications',
    enableNotifications: 'Enable mobile notifications',
    notificationsHint: 'Alerts for record sales, low stock, intl. shipping due',
    maintenanceMode: 'System maintenance',
    maintenanceModeDesc: 'Clears inventory, invoices, sales, and stock movements only — user accounts and login stay intact.',
    resetDatabaseBtn: 'Delete all operations and start fresh',
    resetDbConfirm: 'Warning: All invoices, sales, and inventory movements will be deleted. Are you sure?',
    resetDbSuccess: 'Inventory and operations cleared. User accounts were kept.',
    notificationsOn: 'Enabled',
    notificationsOff: 'Disabled',
    notificationsDenied: 'Permission denied by browser',
    notifyRecordSales: 'Record sales day!',
    notifyRecordSalesBody: '{qty} sales today — above your daily average',
    notifyStockLow: 'Low stock',
    notifyStockLowBody: '{name}: {qty} units left — reorder',
    notifyShippingDue: 'Intl. shipping reminder',
    notifyShippingDueBody: '{days} days since last shipment — review Saudi shipping invoice',
    expenseDueDate: 'Due date (optional)',
    noProactiveAlerts: 'No proactive alerts right now',
    saleSource: 'Sale source',
    saleSourceInStore: 'In-store',
    saleSourceOffStore: 'Off-store',
    posTapHint: 'Search products, tap a cart line to edit, then pay — stock deducts on payment only',
    posSoldNow: 'Sale completed',
    posNoStock: 'No products available to sell',
    posLastSale: 'Last sale',
    posSearchPlaceholder: 'Search product — name, code, color...',
    posNoResults: 'No matches',
    posCheckout: 'Checkout',
    posQty: 'Quantity',
    posDiscountType: 'Discount type',
    posDiscountNone: 'No discount',
    posDiscountPercent: 'Percentage %',
    posDiscountFixed: 'Fixed amount AUD',
    posDiscountValue: 'Discount value',
    posSubtotal: 'Subtotal',
    posDiscount: 'Discount',
    posTotal: 'Total',
    posConfirmSale: 'Confirm sale',
    posNotes: 'Notes',
    posInStock: 'in stock',
    posClose: 'Close',
    posTopSellers: 'Top sellers',
    posCart: 'Cart',
    posCartEmpty: 'Cart is empty — search or pick a top seller',
    posCompletePayment: 'Complete payment',
    posPay: 'Pay',
    returnPaidAfterDiscount: 'Price paid after discount',
    posStockUrgent: 'Only {n} left!',
    connectionOnline: 'Online · Cloud',
    connectionLocal: 'Local',
    paymentMethodCol: 'Payment method',
    posCartTotal: 'Grand total',
    posAddedToCart: 'Added to cart',
    posCartCheckoutDone: 'Batch recorded & stock updated',
    posPaymentSuccess: 'Payment complete · Invoice {inv}',
    posPriceAfterDisc: 'Price after discount',
    posCartTapEdit: 'Tap the card to edit size or shipping',
    posDiscountLine: 'Line discount',
    posRemove: 'Remove',
    posCartDrawer: 'Shopping cart',
    posOpenCart: 'Cart',
    posCartDiscount: 'Cart discount',
    posSelectPayment: 'Select payment method',
    payCash: 'Cash',
    payTransfer: 'Bank transfer',
    payCard: 'Card / POS',
    logoPreviewHint: 'Logo appears small in the header after upload',
    returns: 'Returns',
    returnsDesc: 'Search by invoice, select items to return, then choose refund method',
    returnSale: 'Return',
    returnConfirm: 'Confirm return for this sale?',
    returned: 'Returned',
    returnDone: 'Return recorded & stock restored',
    refundAud: 'Refund amount',
    totalReturns: 'Total returns',
    saleNotReturnable: 'This sale cannot be returned',
    invoiceNumber: 'Invoice #',
    searchInvoice: 'Search invoice (e.g. PA-1001)...',
    invoiceFound: 'Invoice found',
    invoiceGenerated: 'Invoice #',
    invoiceDetails: 'Invoice details',
    selectItemsReturn: 'Select items to return',
    refundTotal: 'Refund total',
    confirmReturn: 'Confirm return',
    refundMethod: 'Refund method',
    refundCash: 'Cash refund',
    refundCard: 'Card / POS refund',
    posEditLine: 'Edit item',
    productImage: 'Product image',
    uploadProductImage: 'Upload image',
    posCartEditHint: 'Tap edit to change size or quantity',
    posExtraShipping: 'Extra shipping fee',
    posLineDiscount: 'Item discount',
    posAvailableStock: 'Available for cart',
    posSaveLine: 'Save changes',
    invoiceNotFound: 'Invoice not found',
    supplierInvoiceProcessor: 'International AI Invoice Processor',
    supplierInvoiceDesc: 'Upload PDF/JPG — smart OCR, 15% VAT, SAR→AUD conversion, editable review table, then save to inventory.',
    iipAiBadge: 'AI processing',
    iipFxHistorySaved: 'Exchange rate saved as historical reference',
    iipAvgCostUpdated: 'Weighted average cost updated',
    invTxLog: 'Inventory transaction log',
    invTxInvoice: 'Invoice #',
    invTxDate: 'Processed',
    invTxCostAud: 'Cost (AUD)',
    invTxFx: 'Exchange rate',
    invTxProduct: 'Product',
    invTxQtyAdded: 'Qty added',
    invTxCostChange: 'Cost (before → after)',
    invFormReset: 'Form reset — ready for a new invoice',
    invCostSaved: 'Cost saved to inventory',
    invConfirmSaveSuccess: 'Confirmed & saved! Inventory updated and movements logged.',
    invConfirmSaving: 'Saving to inventory…',
    invValidateFxMissing: 'Enter the exchange rate (SAR → AUD) before saving.',
    invValidateEmptyRows: 'Add at least one line item in the review table.',
    invValidateRowName: 'Item name is required on every row.',
    invValidateRowQty: 'Quantity must be at least 1.',
    invValidateRowCost: 'Unit cost in AUD is required on every row.',
    invInventoryUpdatedSuccess: 'Inventory updated successfully',
    sipExchangeRate: 'Exchange rate (1 SAR = ? AUD)',
    sipExchangeHint: '1 SAR = {rate} AUD',
    sipTotalAud: 'Total (AUD)',
    sipUpdateProductCost: 'Update product cost',
    sipCostUpdated: 'Product cost updated in inventory',
    sipProductNotFound: 'No product found with this name — add it in the product form first',
    sipUnitExVat: 'Unit price ex-VAT (SAR)',
    iipInvoiceNumber: 'Invoice number',
    iipItemName: 'Item name',
    iipUnitExVat: 'Unit price ex-VAT',
    iipLineExVat: 'Line total ex-VAT',
    iipVat15: 'VAT 15%',
    iipLineIncVat: 'Total inc-VAT',
    iipCurrency: 'Currency',
    iipFxRate: 'FX rate → AUD',
    iipOrigToAud: 'Original → AUD',
    iipUnitAud: 'Unit cost AUD',
    iipLineAud: 'Line total AUD',
    iipFormats: 'JPG · PNG · PDF — max 8 MB',
    iipPdfLibMissing: 'PDF library not loaded — refresh the page',
    iipFormatsOnly: 'Supported formats: JPG or PDF only',
    iipVatSaudi: 'Saudi VAT 15%',
    iipRefreshRates: 'Refresh exchange rates',
    iipLandCostNote: 'Final landed cost in AUD (incl. VAT after conversion)',
    uploadSupplierInvoice: 'Upload invoice',
    sipDropHint: 'Drag invoice image here or click to browse',
    sipDropFormats: 'JPG · PNG · WebP — max 8 MB',
    sipStartProcess: 'Start processing',
    sipManualFallback: 'Quick manual entry',
    sipManualTitle: 'Manual entry — OCR unavailable',
    sipManualDesc: 'Enter invoice lines manually, then continue to review.',
    sipOpenManual: 'Continue to manual entry',
    sipProcessing: 'Processing…',
    sipManualAlert: 'Could not read the invoice automatically.\n\nPlease enter the data manually in the table.',
    sipOcrDone: 'Scan complete — review the table below',
    sipPurchasePrice: 'Purchase price (AUD)',
    sipLineTotal: 'Line total (AUD)',
    sipMapping: 'Mapping',
    sipMapped: 'Linked',
    sipNewProduct: 'New product',
    sipApproveSave: 'Save & confirm to inventory',
    sipReviewTitle: 'Invoice review table',
    sipReviewHint: 'Review and edit every cell manually before saving — then click «Save & confirm to inventory».',
    sipUnitCostAud: 'Unit cost (AUD)',
    sipOcrReview: 'Data extracted — verify accuracy before confirming',
    sipGrandTotal: 'Grand total',
    sipGrandTotalSar: 'Total (SAR)',
    sipGrandTotalAud: 'Total (AUD)',
    sipGrandTotalAudHint: 'Approved amount for review & save',
    aiInvoiceEntry: 'Supplier Invoice Processor',
    aiInvoiceDesc: 'Upload supplier invoice — Tesseract or manual fallback, then review and save.',
    invoiceOcrScanning: 'Reading invoice...',
    invoiceOcrProgress: 'Analyzing {pct}%',
    invoiceOcrFailed: 'Could not read invoice — use a clearer JPG/PNG photo',
    invoiceOcrLibMissing: 'OCR library not loaded — refresh the page',
    invoicePdfUseImage: 'PDF not supported yet — upload a JPG or PNG image',
    invoiceNoItemsFound: 'No line items found — edit manually or try a clearer image',
    invoiceFileTooLarge: 'File too large (max 8 MB)',
    invoicePreviewTitle: 'Review table — supplier invoice',
    invoicePreviewHint: 'Fix mistakes with Edit, then Approve & save to add stock immediately.',
    invoiceReviewName: 'Product name',
    invoiceReviewPrice: 'Unit price (AUD)',
    invoiceConfirmImport: 'Approve & save to inventory',
    invoiceEditRow: 'Edit',
    invoiceConfirmTitle: 'Add these products to inventory?',
    invoiceConfirmHint: 'You can go back and edit the table first.',
    invoiceImportDone: 'Stock imported successfully',
    invoiceAddRow: 'Add row',
    invoiceRemoveRow: 'Remove',
  },
};

let currentLang = APP_CONFIG.defaultLang;
let charts = {};
let eventsBound = false;

const state = {
  products: [],
  expenses: [],
  sales: [],
  returns: [],
  inventoryTransactions: [],
  activityLog: [],
  systemUsers: [],
  settings: {
    vatRate: APP_CONFIG.vatRate,
    logo: null,
    lang: 'ar',
    exchangeRates: null,
    notificationsEnabled: false,
    notifiedKeys: {},
    ocrApiKey: '',
    nextInvoiceSeq: 1001,
    /** آخر سعر صرف SAR→AUD لمعالج فواتير الموردين */
    sarToAudRate: null,
    /** سجل أسعار الصرف عند اعتماد الفواتير */
    invoiceFxHistory: [],
    /** وضع المواسم في لوحة الربحية: normal | holiday | clearance */
    inventorySeasonalMode: 'normal',
    currentUser: '',
  },
};

// ═══════════════════════════════════════════════════════════════
//  Auth — multi-user · session · activity feed
// ═══════════════════════════════════════════════════════════════

const AuthStore = {
  loadUsers() {
    return Array.isArray(state.systemUsers) ? state.systemUsers : [];
  },

  async saveUsers(users) {
    state.systemUsers = users;
    await DataStore.save();
  },

  loadSession() {
    try {
      const raw = localStorage.getItem(AUTH_SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  saveSession(session) {
    if (!session) localStorage.removeItem(AUTH_SESSION_KEY);
    else localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  },

  async hashPassword(password, salt) {
    const data = new TextEncoder().encode(`${salt}:${password}`);
    const buf = await crypto.subtle.digest('SHA-256', data);
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  },

  async seedBootstrapAdmin() {
    if (this.loadUsers().length) return;
    const salt = uid();
    const passwordHash = await this.hashPassword(AUTH_BOOTSTRAP.password, salt);
    await this.saveUsers([{
      id: uid(),
      username: AUTH_BOOTSTRAP.username,
      salt,
      passwordHash,
      role: 'admin',
      createdAt: new Date().toISOString(),
      createdBy: 'system',
    }]);
  },
};

const AuthSystem = {
  session: null,

  syncSession() {
    if (AUTH_SKIP_LOGIN) {
      this.session = {
        userId: 'guest',
        username: AUTH_GUEST_NAME,
        role: 'admin',
        loggedIn: true,
      };
      state.settings.currentUser = AUTH_GUEST_NAME;
      return;
    }
    this.session = AuthStore.loadSession();
    if (this.session?.userId && this.session?.username) {
      const user = AuthStore.loadUsers().find((u) => u.id === this.session.userId);
      if (!user) {
        this.session = null;
        AuthStore.saveSession(null);
        return;
      }
      this.session.role = user.role;
      this.session.username = user.username;
      state.settings.currentUser = user.username;
    }
  },

  isLoggedIn() {
    if (AUTH_SKIP_LOGIN) return true;
    if (typeof SupabaseBridge !== 'undefined' && SupabaseBridge.isConfigured() && SupabaseBridge.user) {
      return true;
    }
    return localStorage.getItem(SIMPLE_AUTH_KEY) === 'true';
  },

  isAdmin() {
    if (AUTH_SKIP_LOGIN) return true;
    return this.isLoggedIn();
  },

  current() {
    if (AUTH_SKIP_LOGIN) return AUTH_GUEST_NAME;
    if (this.isLoggedIn()) return AUTH_BOOTSTRAP.username;
    return (state.settings?.currentUser || '').trim();
  },

  createdBy() {
    return this.current() || '—';
  },

  /** Tenant UUID for multi-tenant RLS (profile, settings, or SUPABASE_CONFIG.defaultTenantId) */
  tenantId() {
    if (typeof SupabaseBridge !== 'undefined' && SupabaseBridge.isConfigured()) {
      const fromAuth = SupabaseBridge.tenantId();
      if (fromAuth) return fromAuth;
    }
    if (this.session?.tenantId) return this.session.tenantId;
    const user = AuthStore.loadUsers().find((u) => u.id === this.session?.userId);
    if (user?.tenantId) return user.tenantId;
    if (state.settings?.tenantId) return state.settings.tenantId;
    const cfg = window.SUPABASE_CONFIG || {};
    return cfg.defaultTenantId || null;
  },

  getStoredTenantId() {
    try {
      const tid = localStorage.getItem(CURRENT_TENANT_KEY);
      return tid && String(tid).trim() ? String(tid).trim() : null;
    } catch {
      return null;
    }
  },

  setStoredTenantId(tenantId) {
    if (!tenantId) {
      localStorage.removeItem(CURRENT_TENANT_KEY);
      return;
    }
    const tid = String(tenantId).trim();
    localStorage.setItem(CURRENT_TENANT_KEY, tid);
    if (this.session) this.session.tenantId = tid;
    state.settings.tenantId = tid;
  },

  clearStoredTenantId() {
    localStorage.removeItem(CURRENT_TENANT_KEY);
  },

  /**
   * Load tenant_id from Supabase profiles for the signed-in user → localStorage.
   * @returns {Promise<{ ok: boolean, tenantId?: string, error?: string }>}
   */
  async loadTenantFromProfile() {
    if (typeof SupabaseBridge === 'undefined' || !SupabaseBridge.isConfigured()) {
      return { ok: false, error: 'Supabase not configured' };
    }
    const auth = await SupabaseBridge.ensureAuth();
    if (!auth.ok) return { ok: false, error: auth.error || 'Not authenticated' };

    const profile = await SupabaseBridge.fetchProfileTenantId();
    if (!profile.ok || !profile.tenantId) {
      return { ok: false, error: profile.error || 'No tenant_id on user profile' };
    }

    this.setStoredTenantId(profile.tenantId);
    return { ok: true, tenantId: profile.tenantId };
  },

  /** Tenant id from localStorage (set at login from profiles) */
  sessionTenantId() {
    const stored = this.getStoredTenantId();
    if (stored) return stored;
    if (this.session?.tenantId) return String(this.session.tenantId);
    const tid = this.ensureTenantId();
    if (tid && this.session) this.session.tenantId = tid;
    return tid ? String(tid) : null;
  },

  ensureTenantId() {
    let tid = this.tenantId();
    if (!tid && typeof crypto !== 'undefined' && crypto.randomUUID) {
      tid = crypto.randomUUID();
      state.settings.tenantId = tid;
    }
    if (tid && this.session) this.session.tenantId = tid;
    return tid;
  },

  auditFields() {
    const fields = {
      createdBy: this.createdBy(),
      createdByUserId: AUTH_SKIP_LOGIN ? 'guest' : (this.isLoggedIn() ? 'louay' : null),
    };
    const tid = this.tenantId();
    if (tid) fields.tenantId = tid;
    return fields;
  },

  findUser(login) {
    const q = (login || '').trim().toLowerCase();
    return AuthStore.loadUsers().find((u) => u.username.toLowerCase() === q);
  },

  trySimpleLogin(username, password) {
    const user = (username || '').trim();
    const pass = password || '';
    return user === AUTH_BOOTSTRAP.username && pass === AUTH_BOOTSTRAP.password;
  },

  completeLogin() {
    localStorage.setItem(SIMPLE_AUTH_KEY, 'true');
    state.settings.currentUser = AUTH_BOOTSTRAP.username;
    DataStore.save();
  },

  /** تسجيل دخول عبر Supabase Auth (بريد + كلمة مرور) */
  async loginWithSupabase(email, password) {
    if (typeof SupabaseBridge === 'undefined' || !SupabaseBridge.getClient()) {
      return { ok: false, error: 'Supabase not configured' };
    }
    const res = await SupabaseBridge.signIn(email, password);
    if (!res.ok) return { ok: false, error: res.error };

    const tenantRes = await this.loadTenantFromProfile();
    if (!tenantRes.ok) {
      return {
        ok: false,
        error: tenantRes.error || 'Could not load tenant_id from profiles table',
      };
    }

    localStorage.setItem(SIMPLE_AUTH_KEY, 'true');
    const name = res.user?.user_metadata?.username
      || res.user?.email?.split('@')[0]
      || 'user';
    state.settings.currentUser = name;
    await DataStore.save();
    this.updateHeaderUI();
    return { ok: true, user: res.user };
  },

  async logoutSupabase() {
    if (typeof SupabaseBridge !== 'undefined' && SupabaseBridge.getClient()) {
      await SupabaseBridge.signOut();
    }
    this.clearStoredTenantId();
    localStorage.removeItem(SIMPLE_AUTH_KEY);
    location.reload();
  },

  usesSupabase() {
    return typeof SupabaseBridge !== 'undefined'
      && SupabaseBridge.isConfigured()
      && DataStore.provider === 'supabase';
  },

  logout() {
    if (this.usesSupabase()) {
      this.logoutSupabase();
      return;
    }
    this.clearStoredTenantId();
    localStorage.removeItem(SIMPLE_AUTH_KEY);
    location.reload();
  },

  showOverlay() {
    const overlay = document.getElementById('auth-overlay');
    if (!overlay) return;
    overlay.hidden = false;
    overlay.removeAttribute('aria-hidden');
    document.body.classList.add('auth-locked');
  },

  hideOverlay() {
    const overlay = document.getElementById('auth-overlay');
    if (!overlay) return;
    overlay.hidden = true;
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('auth-locked');
  },

  /** Open app without login; Supabase uses anonymous auth when configured */
  async enterAsGuest() {
    localStorage.setItem(SIMPLE_AUTH_KEY, 'true');
    state.settings.currentUser = AUTH_GUEST_NAME;
    this.session = {
      userId: 'guest',
      username: AUTH_GUEST_NAME,
      role: 'admin',
      loggedIn: true,
      issuedAt: new Date().toISOString(),
    };
    this.hideOverlay();
    document.body.classList.remove('auth-locked');
    const loginSection = document.getElementById('auth-login');
    if (loginSection) loginSection.hidden = true;

    if (typeof SupabaseBridge !== 'undefined' && SupabaseBridge.isConfigured()) {
      const auth = await SupabaseBridge.ensureAuth();
      if (!auth.ok) {
        console.warn('[Supabase] Guest auth:', auth.error);
      } else {
        let tenantRes = await this.loadTenantFromProfile();
        if (!tenantRes.ok) {
          const fallback = this.ensureTenantId();
          if (fallback) {
            const synced = await SupabaseBridge.syncTenantProfile(fallback);
            if (!synced.ok) console.warn('[Supabase] Tenant profile sync:', synced.error);
            tenantRes = await this.loadTenantFromProfile();
          }
        }
        if (!tenantRes.ok) {
          console.warn('[Supabase] Guest tenant:', tenantRes.error);
        }
      }
    }

    this.updateHeaderUI();
  },

  enterApp() {
    this.hideOverlay();
    if (typeof renderApp === 'function') renderApp();
    navigateToTab('dashboard');
    if (typeof renderAll === 'function') renderAll();
    ActivityFeed.render();
  },

  async ensure() {
    if (typeof SupabaseBridge !== 'undefined' && SupabaseBridge.isConfigured()) {
      const auth = await SupabaseBridge.ensureAuth();
      if (auth.ok) localStorage.setItem(SIMPLE_AUTH_KEY, 'true');
    }
    resetAuthLoginFields();
    this.updateHeaderUI();
    if (!this.isLoggedIn()) {
      this.showLogin();
      if (typeof renderApp === 'function') renderApp();
    } else {
      state.settings.currentUser = AUTH_BOOTSTRAP.username;
      this.hideOverlay();
      if (typeof renderApp === 'function') renderApp();
      if (typeof renderAll === 'function') renderAll();
      navigateToTab('dashboard');
    }
  },

  requireUser() {
    if (AUTH_SKIP_LOGIN) return true;
    if (this.isLoggedIn()) return true;
    this.showLogin();
    this.showAuthError('authRequired');
    return false;
  },

  showLogin() {
    if (AUTH_SKIP_LOGIN) return;
    this.closeUserMenu();
    dismissAppOverlays();
    purgeStorageForLoginPage();
    this.showOverlay();
    this.clearAuthErrors();
    resetAuthLoginFields();
    setTimeout(() => document.getElementById('auth-login-username')?.focus(), 50);
  },

  clearAuthErrors() {
    const el = document.getElementById('auth-login-error');
    if (!el) return;
    el.textContent = '';
    el.hidden = true;
  },

  showAuthError(messageKey) {
    const el = document.getElementById('auth-login-error');
    if (!el) return;
    el.textContent = t(messageKey);
    el.hidden = false;
  },

  togglePassword(btn) {
    const input = document.getElementById(btn?.dataset?.authTogglePwd);
    if (!input) return;
    const visible = input.type === 'password';
    input.type = visible ? 'text' : 'password';
    btn.setAttribute('aria-pressed', visible ? 'true' : 'false');
    btn.setAttribute('aria-label', t(visible ? 'authHidePassword' : 'authShowPassword'));
    btn.classList.toggle('auth-password-toggle--visible', visible);
  },

  toggleUserMenu() {
    const wrap = document.getElementById('user-menu-wrap');
    const dd = document.getElementById('user-menu-dropdown');
    const btn = document.getElementById('user-menu-btn');
    if (!wrap || !dd) return;
    const open = dd.hidden;
    dd.hidden = !open;
    wrap.classList.toggle('user-menu--open', open);
    btn?.setAttribute('aria-expanded', open ? 'true' : 'false');
  },

  closeUserMenu() {
    const wrap = document.getElementById('user-menu-wrap');
    const dd = document.getElementById('user-menu-dropdown');
    const btn = document.getElementById('user-menu-btn');
    if (dd) dd.hidden = true;
    wrap?.classList.remove('user-menu--open');
    btn?.setAttribute('aria-expanded', 'false');
  },

  updateHeaderUI() {
    const user = this.current();
    ['user-current-name', 'user-menu-display-name'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.textContent = user || '—';
    });
    const btn = document.getElementById('user-menu-btn');
    if (btn) {
      btn.title = user ? `${t('userCurrent')}: ${user}` : t('authLoginTab');
      btn.setAttribute('aria-label', btn.title);
    }
    document.getElementById('user-menu-wrap')?.classList.toggle(
      'user-menu--signed-in',
      !!user
    );
  },

  refreshAuthI18n() {
    const lang = currentLang;
    document.querySelectorAll('#auth-overlay [data-i18n], #user-menu-dropdown [data-i18n]').forEach((el) => {
      const k = el.dataset.i18n;
      if (TRANSLATIONS[lang]?.[k]) el.textContent = TRANSLATIONS[lang][k];
    });
    document.querySelectorAll('[data-auth-toggle-pwd]').forEach((btn) => {
      const visible = btn.getAttribute('aria-pressed') === 'true';
      btn.setAttribute('aria-label', t(visible ? 'authHidePassword' : 'authShowPassword'));
    });
    this.updateHeaderUI();
  },

  bindEvents() {
    document.addEventListener('click', (e) => {
      const toggle = e.target.closest('[data-auth-toggle-pwd]');
      if (toggle) {
        e.preventDefault();
        this.togglePassword(toggle);
      }
    });

    document.getElementById('auth-login-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      this.clearAuthErrors();
      const username = document.getElementById('auth-login-username')?.value;
      const password = document.getElementById('auth-login-password')?.value;

      if (typeof SupabaseBridge !== 'undefined' && SupabaseBridge.isConfigured()) {
        const email = username.includes('@') ? username : `${username.trim()}@prestige-abaya.local`;
        const res = await this.loginWithSupabase(email, password);
        if (res.ok) {
          window.location.href = 'index.html';
          return;
        }
        this.showAuthError('authInvalidCredentials');
        const errEl = document.getElementById('auth-login-error');
        if (errEl && res.error) errEl.textContent = String(res.error);
        return;
      }

      if (this.trySimpleLogin(username, password)) {
        this.completeLogin();
        window.location.href = 'index.html';
        return;
      }
      this.showAuthError('authInvalidCredentials');
    });

    document.getElementById('user-menu-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!this.isLoggedIn()) {
        this.showLogin();
        return;
      }
      this.toggleUserMenu();
    });

    document.getElementById('user-logout-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.logout();
    });

    document.addEventListener('click', (e) => {
      const wrap = document.getElementById('user-menu-wrap');
      if (wrap && !wrap.contains(e.target)) this.closeUserMenu();
    });
  },
};

const UserAdmin = {
  async createUser({ username, password }) {
    if (!AuthSystem.isAdmin()) return { ok: false, error: 'authRequired' };
    const uname = (username || '').trim();
    const pw = password || '';
    if (uname.length < 2) return { ok: false, error: 'authUsernameShort' };
    if (pw.length < 6) return { ok: false, error: 'authWeakPassword' };

    const users = AuthStore.loadUsers();
    if (users.some((u) => u.username.toLowerCase() === uname.toLowerCase())) {
      return { ok: false, error: 'userExists' };
    }

    const salt = uid();
    const passwordHash = await AuthStore.hashPassword(pw, salt);
    users.push({
      id: uid(),
      username: uname,
      salt,
      passwordHash,
      role: 'user',
      createdAt: new Date().toISOString(),
      createdBy: AuthSystem.createdBy(),
    });
    await AuthStore.saveUsers(users);
    return { ok: true };
  },

  async deleteUser(userId) {
    if (!AuthSystem.isAdmin()) return { ok: false, error: 'authRequired' };
    const users = AuthStore.loadUsers();
    const target = users.find((u) => u.id === userId);
    if (!target) return { ok: false, error: 'authInvalidCredentials' };
    if (target.id === AuthSystem.session?.userId) return { ok: false, error: 'cannotDeleteSelf' };
    if (target.username === AUTH_BOOTSTRAP.username) return { ok: false, error: 'cannotDeleteAdmin' };

    await AuthStore.saveUsers(users.filter((u) => u.id !== userId));
    return { ok: true };
  },

  renderPanel() {
    const tbody = document.getElementById('users-tbody');
    if (!tbody) return;

    const users = AuthStore.loadUsers();
    if (!users.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="empty">${t('noData')}</td></tr>`;
      return;
    }

    tbody.innerHTML = users.map((u) => `
      <tr>
        <td><strong>${escapeHtml(u.username)}</strong></td>
        <td><span class="badge ${u.role === 'admin' ? 'badge--ok' : ''}">${u.role === 'admin' ? t('userRoleAdmin') : t('userRoleUser')}</span></td>
        <td>${formatDate(u.createdAt)}</td>
        <td>${escapeHtml(u.createdBy || '—')}</td>
        <td class="actions">
          ${u.username === AUTH_BOOTSTRAP.username || u.id === AuthSystem.session?.userId
    ? '—'
    : `<button type="button" class="btn btn--sm btn--danger" data-del-user="${u.id}">${t('userDelete')}</button>`}
        </td>
      </tr>`).join('');
  },
};

/** @deprecated alias */
const UserSession = AuthSystem;

function formatRelativeTime(iso) {
  const normalized = parseAppTimestamp(iso);
  if (!normalized) return t('timeAgoNow');
  const diff = Date.now() - new Date(normalized).getTime();
  if (diff < 45000) return t('timeAgoNow');
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return t('timeAgoMinutes').replace('{n}', String(mins));
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t('timeAgoHours').replace('{n}', String(hours));
  return t('timeAgoDays').replace('{n}', String(Math.floor(hours / 24)));
}

const ActivityFeed = {
  typeKeys: {
    invoice_import: 'actTypeInvoice',
    product_add: 'actTypeProduct',
    product_update: 'actTypeProductUpdate',
    expense: 'actTypeExpense',
    sale: 'actTypeSale',
    pos_sale: 'actTypePos',
  },

  log({ type, amountAud = 0, label = '' }) {
    if (!AuthSystem.isLoggedIn()) return;
    const entry = {
      id: uid(),
      type,
      username: AuthSystem.createdBy(),
      userId: AuthSystem.session?.userId || null,
      amountAud: CurrencyEngine.round(amountAud),
      label: label || '',
      createdAt: new Date().toISOString(),
    };
    if (!state.activityLog) state.activityLog = [];
    state.activityLog.unshift(entry);
    state.activityLog = state.activityLog.slice(0, 200);
    DataStore.save();
    this.render(true);
  },

  formatLine(entry) {
    const typeKey = this.typeKeys[entry.type] || 'actTypeProduct';
    const typeLabel = t(typeKey);
    const time = formatRelativeTime(entry.createdAt);
    const amount = formatAUD(entry.amountAud || 0);
    if (currentLang === 'ar') {
      return t('activityFeedLine')
        .replace('{type}', typeLabel + (entry.label ? ` (${entry.label})` : ''))
        .replace('{user}', entry.username || '—')
        .replace('{time}', time)
        .replace('{amount}', amount);
    }
    return t('activityFeedLine')
      .replace('{type}', typeLabel + (entry.label ? ` (${entry.label})` : ''))
      .replace('{user}', entry.username || '—')
      .replace('{time}', time)
      .replace('{amount}', amount);
  },

  render(animate = false) {
    const list = document.getElementById('activity-feed-list');
    if (!list) return;
    const items = (state.activityLog || []).slice(0, 5);
    if (!items.length) {
      list.innerHTML = `<li class="activity-feed__empty">${t('activityFeedEmpty')}</li>`;
      return;
    }
    list.innerHTML = items.map((entry) => `
      <li class="activity-feed__item${animate ? ' activity-feed__item--new' : ''}">
        <span class="activity-feed__dot" aria-hidden="true"></span>
        <span class="activity-feed__text">${escapeHtml(this.formatLine(entry))}</span>
      </li>`).join('');
    if (animate) {
      list.querySelectorAll('.activity-feed__item--new').forEach((el) => {
        el.addEventListener('animationend', () => el.classList.remove('activity-feed__item--new'), { once: true });
      });
    }
  },
};

// ═══════════════════════════════════════════════════════════════
//  Currency Engine — AUD Base
// ═══════════════════════════════════════════════════════════════

const CurrencyEngine = {
  round(n) {
    return Math.round(n * 100) / 100;
  },

  /** Convert any currency to AUD */
  toAUD(amount, currency, exchangeRate = 1) {
    const amt = parseFloat(amount) || 0;
    if (currency === BASE_CURRENCY) return this.round(amt);
    const rate = parseFloat(exchangeRate) || 0;
    if (rate <= 0) return 0;
    return this.round(amt * rate);
  },

  needsExchangeRate(currency) {
    return currency !== BASE_CURRENCY;
  },

  calcExpense({ amountOriginal, currency, exchangeRate, vatRate }) {
    const rate = currency === BASE_CURRENCY ? 1 : parseFloat(exchangeRate) || 0;
    const audBeforeVat = this.toAUD(amountOriginal, currency, rate);
    const vat = this.round(audBeforeVat * (vatRate ?? APP_CONFIG.vatRate));
    const audTotal = this.round(audBeforeVat + vat);
    return {
      exchangeRate: rate,
      audBeforeVat,
      vat,
      audTotal,
      amountOriginal: this.round(parseFloat(amountOriginal) || 0),
    };
  },

  calcSale({ unitPriceAud, quantity, unitCostAud }) {
    const revenue = this.round(unitPriceAud * quantity);
    const cost = this.round(unitCostAud * quantity);
    const profit = this.round(revenue - cost);
    const margin = revenue > 0 ? this.round((profit / revenue) * 100) : 0;
    return { revenue, cost, profit, margin };
  },
};

// ═══════════════════════════════════════════════════════════════
//  Analytics Engine
// ═══════════════════════════════════════════════════════════════

const AnalyticsEngine = {
  totalExpensesAUD() {
    return CurrencyEngine.round(
      state.expenses.reduce((s, e) => s + (e.financials?.audTotal ?? 0), 0)
    );
  },

  activeSales() {
    return state.sales.filter((s) => !s.returned);
  },

  totalRevenueAUD() {
    return CurrencyEngine.round(
      this.activeSales().reduce((s, sale) => s + CurrencyEngine.calcSale(sale).revenue, 0)
    );
  },

  totalReturnsAUD() {
    return CurrencyEngine.round(
      (state.returns || []).reduce((s, r) => s + (r.refundAud || 0), 0)
    );
  },

  totalCostOfSalesAUD() {
    return CurrencyEngine.round(
      this.activeSales().reduce((s, sale) => s + CurrencyEngine.calcSale(sale).cost, 0)
    );
  },

  netProfitAUD() {
    const gross = CurrencyEngine.round(this.totalRevenueAUD() - this.totalCostOfSalesAUD());
    return CurrencyEngine.round(gross - this.totalExpensesAUD());
  },

  costDistribution() {
    let abayas = 0;
    let shipping = 0;
    let other = 0;

    state.expenses.forEach((e) => {
      const v = e.financials?.audTotal ?? 0;
      if (e.category === 'import') abayas += v;
      else if (e.category === 'intl_shipping' || e.category === 'local_shipping') shipping += v;
      else other += v;
    });

    const total = abayas + shipping + other || 1;
    return {
      abayas: CurrencyEngine.round(abayas),
      shipping: CurrencyEngine.round(shipping),
      other: CurrencyEngine.round(other),
      abayasPct: CurrencyEngine.round((abayas / total) * 100),
      shippingPct: CurrencyEngine.round((shipping / total) * 100),
      otherPct: CurrencyEngine.round((other / total) * 100),
    };
  },

  profitForecast() {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    let monthProfit = 0;
    let monthCount = 0;

    state.sales.forEach((s) => {
      if (s.createdAt?.startsWith(monthKey)) {
        monthProfit += CurrencyEngine.calcSale(s).profit;
        monthCount++;
      }
    });

    const avgPerSale = monthCount > 0 ? monthProfit / monthCount : 0;
    const projectedMonthly = CurrencyEngine.round(monthProfit || avgPerSale * 4);
    const projectedQuarter = CurrencyEngine.round(projectedMonthly * 3);
    const netAfterExpenses = CurrencyEngine.round(projectedMonthly - this.totalExpensesAUD() / 3);

    return { monthProfit: CurrencyEngine.round(monthProfit), projectedMonthly, projectedQuarter, netAfterExpenses };
  },

  topProducts(limit = 5) {
    const map = {};
    this.activeSales().forEach((s) => {
      map[s.productId] = (map[s.productId] || 0) + s.quantity;
    });
    return Object.entries(map)
      .map(([id, qty]) => ({ id, name: getProduct(id)?.name || id, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, limit);
  },

  /** معدل دوران المخزون = تكلفة المبيعات / قيمة المخزون (تكلفة) */
  inventoryTurnover() {
    const cogs = this.totalCostOfSalesAUD();
    const invValue = CurrencyEngine.round(
      state.products.reduce((s, p) => s + p.cost * p.quantity, 0)
    );
    const unitsSold = state.sales.reduce((s, sale) => s + sale.quantity, 0);
    const rate = invValue > 0 ? CurrencyEngine.round(cogs / invValue) : 0;
    const rating = rate >= 2 ? 'good' : rate >= 1 ? 'ok' : 'low';
    return { rate, cogs, invValue, unitsSold, rating };
  },

  /** آخر 8 أسابيع — عدد القطع المباعة */
  weeklySalesTrend(weeks = 8) {
    const now = new Date();
    const buckets = [];

    for (let i = weeks - 1; i >= 0; i--) {
      const end = new Date(now);
      end.setDate(end.getDate() - i * 7);
      end.setHours(23, 59, 59, 999);
      const start = new Date(end);
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);

      let qty = 0;
      let revenue = 0;
      this.activeSales().forEach((s) => {
        const d = new Date(s.createdAt);
        if (d >= start && d <= end) {
          qty += s.quantity;
          revenue += CurrencyEngine.calcSale(s).revenue;
        }
      });

      const label = `${t('week')} ${start.getDate()}/${start.getMonth() + 1}`;
      buckets.push({ label, qty, revenue: CurrencyEngine.round(revenue), start, end });
    }

    return buckets;
  },

  /** منتجات بكمية أقل من 5 */
  lowStockAlerts(threshold = APP_CONFIG.stockAlertThreshold) {
    return state.products
      .filter((p) => p.quantity < threshold)
      .map((p) => ({
        ...p,
        severity: p.quantity <= 0 ? 'critical' : p.quantity <= 2 ? 'urgent' : 'warning',
      }))
      .sort((a, b) => a.quantity - b.quantity);
  },
};

// ═══════════════════════════════════════════════════════════════
//  Demand Forecast Engine — آخر 3 أشهر
// ═══════════════════════════════════════════════════════════════

const DemandForecastEngine = {
  periodMonths: 3,

  periodStart() {
    const start = new Date();
    start.setMonth(start.getMonth() - this.periodMonths);
    start.setHours(0, 0, 0, 0);
    return start;
  },

  periodDays() {
    const start = this.periodStart();
    const now = new Date();
    return Math.max(1, Math.ceil((now - start) / (1000 * 60 * 60 * 24)));
  },

  /** مبيعات آخر 3 أشهر (كل المنتجات أو منتج محدد) */
  salesInPeriod(productId = null) {
    const start = this.periodStart();
    return state.sales.filter((s) => {
      const d = new Date(s.createdAt);
      if (d < start) return false;
      if (productId && s.productId !== productId) return false;
      return true;
    });
  },

  /** متوسط المبيعات اليومي (قطع/يوم) */
  avgDailySales(productId = null) {
    const sales = this.salesInPeriod(productId);
    const totalQty = sales.reduce((sum, s) => sum + s.quantity, 0);
    const days = this.periodDays();
    return CurrencyEngine.round(totalQty / days);
  },

  /** تنبؤ مدة كفاية المخزون لمنتج واحد */
  productForecast(product) {
    const sales = this.salesInPeriod(product.id);
    const totalSold = sales.reduce((sum, s) => sum + s.quantity, 0);
    const avgDaily = this.avgDailySales(product.id);
    const days = this.periodDays();

    if (totalSold === 0 || avgDaily <= 0) {
      return { avgDaily: 0, daysLeft: null, totalSold, periodDays: days, hasData: false };
    }

    const daysLeft = Math.max(0, Math.floor(product.quantity / avgDaily));
    return {
      avgDaily,
      daysLeft,
      totalSold,
      periodDays: days,
      hasData: true,
      urgency: daysLeft <= 7 ? 'critical' : daysLeft <= 15 ? 'warning' : 'ok',
    };
  },

  /** نص التنبيه للعرض في بطاقة المخزون */
  forecastMessage(forecast) {
    if (!forecast.hasData) return t('forecastNoData');
    if (forecast.daysLeft === 0) return t('forecastOut');
    if (forecast.daysLeft > 90) return t('forecastSafe');
    return t('forecastDays').replace('{days}', String(forecast.daysLeft));
  },
};

// ═══════════════════════════════════════════════════════════════
//  Smart Pricing Engine — unit cost + margin → suggested price
// ═══════════════════════════════════════════════════════════════

const SmartPricingEngine = {
  defaultMarginPct: 35,

  calcUnitCost(breakdown) {
    const fabric = parseFloat(breakdown.fabric) || 0;
    const tailoring = parseFloat(breakdown.tailoring) || 0;
    const packaging = parseFloat(breakdown.packaging) || 0;
    return CurrencyEngine.round(fabric + tailoring + packaging);
  },

  priceFromMarginPct(unitCost, marginPct) {
    const m = Math.min(99, Math.max(0, parseFloat(marginPct) || 0)) / 100;
    if (unitCost <= 0) return 0;
    if (m <= 0) return CurrencyEngine.round(unitCost);
    if (m >= 1) return 0;
    return CurrencyEngine.round(unitCost / (1 - m));
  },

  marginOnPrice(unitCost, price) {
    if (price <= 0) return 0;
    return CurrencyEngine.round(((price - unitCost) / price) * 100);
  },

  calculate(breakdown) {
    const unitCost = this.calcUnitCost(breakdown);
    const marginPct = parseFloat(breakdown.marginPct);
    const safeMargin = Number.isNaN(marginPct) ? this.defaultMarginPct : marginPct;
    const suggestedPrice = this.priceFromMarginPct(unitCost, safeMargin);
    return {
      unitCost,
      marginPct: safeMargin,
      suggestedPrice,
      effectiveMarginPct: this.marginOnPrice(unitCost, suggestedPrice),
    };
  },

  estimateFromExpenses() {
    const totals = { import: 0, intl_shipping: 0, packaging: 0, local_shipping: 0 };
    state.expenses.forEach((e) => {
      const v = e.financials?.audTotal ?? CurrencyEngine.calcExpense({
        amountOriginal: e.amountOriginal,
        currency: e.currency,
        exchangeRate: e.exchangeRate,
        vatRate: state.settings.vatRate,
      }).audTotal;
      if (Object.prototype.hasOwnProperty.call(totals, e.category)) totals[e.category] += v;
    });
    const units = state.products.reduce((s, p) => s + (p.quantity || 0), 0) || 1;
    const fabric = CurrencyEngine.round(totals.import / units);
    const overhead = CurrencyEngine.round((totals.intl_shipping + totals.local_shipping) / units);
    const packaging = CurrencyEngine.round(totals.packaging / units);
    return {
      fabric,
      tailoring: CurrencyEngine.round(fabric * 0.35),
      packaging: CurrencyEngine.round(packaging + overhead),
    };
  },

  breakdownFromProduct(p) {
    if (!p) return { fabric: 0, tailoring: 0, packaging: 0, marginPct: this.defaultMarginPct };
    if (p.pricingFabric != null || p.pricingTailoring != null || p.pricingPackaging != null) {
      return {
        fabric: p.pricingFabric ?? 0,
        tailoring: p.pricingTailoring ?? 0,
        packaging: p.pricingPackaging ?? 0,
        marginPct: p.targetMarginPct ?? this.defaultMarginPct,
      };
    }
    const cost = p.cost || 0;
    return {
      fabric: CurrencyEngine.round(cost * 0.55),
      tailoring: CurrencyEngine.round(cost * 0.3),
      packaging: CurrencyEngine.round(cost * 0.15),
      marginPct: p.targetMarginPct ?? (this.marginOnPrice(cost, p.price) || this.defaultMarginPct),
    };
  },
};

// ═══════════════════════════════════════════════════════════════
//  Dynamic Pricing Assistant — 3-tier margin cards
// ═══════════════════════════════════════════════════════════════

const DynamicPricingEngine = {
  tiers: [
    { id: 'liquidation', marginPct: 0, titleKey: 'dpLiquidation', descKey: 'dpLiquidationDesc', icon: '⚡', theme: 'liquidation' },
    { id: 'competitive', marginPct: 20, titleKey: 'dpCompetitive', descKey: 'dpCompetitiveDesc', icon: '◎', theme: 'competitive' },
    { id: 'premium', marginPct: 40, titleKey: 'dpPremium', descKey: 'dpPremiumDesc', icon: '✦', theme: 'premium', rarityKey: 'dpPremiumRarity' },
  ],

  calcTotalCost(inputs) {
    return CurrencyEngine.round(
      (parseFloat(inputs.baseCost) || 0)
      + (parseFloat(inputs.intlShipping) || 0)
      + (parseFloat(inputs.packaging) || 0)
      + (parseFloat(inputs.localShipping) || 0)
    );
  },

  priceWithMargin(totalCost, marginPct) {
    const m = Math.max(0, parseFloat(marginPct) || 0) / 100;
    if (totalCost <= 0) return 0;
    return CurrencyEngine.round(totalCost * (1 + m));
  },

  calculate(inputs) {
    const totalCost = this.calcTotalCost(inputs);
    return {
      totalCost,
      tiers: this.tiers.map((tier) => ({
        ...tier,
        price: this.priceWithMargin(totalCost, tier.marginPct),
      })),
    };
  },

  expenseTotalsPerUnit() {
    const totals = { import: 0, intl_shipping: 0, packaging: 0, local_shipping: 0 };
    state.expenses.forEach((e) => {
      const v = e.financials?.audTotal ?? CurrencyEngine.calcExpense({
        amountOriginal: e.amountOriginal,
        currency: e.currency,
        exchangeRate: e.exchangeRate,
        vatRate: state.settings.vatRate,
      }).audTotal;
      if (Object.prototype.hasOwnProperty.call(totals, e.category)) totals[e.category] += v;
    });
    const units = state.products.reduce((s, p) => s + (p.quantity || 0), 0) || 1;
    return {
      baseCost: CurrencyEngine.round(totals.import / units),
      intlShipping: CurrencyEngine.round(totals.intl_shipping / units),
      packaging: CurrencyEngine.round(totals.packaging / units),
      localShipping: CurrencyEngine.round(totals.local_shipping / units),
    };
  },

  estimateFromExpenses(product = null) {
    const perUnit = this.expenseTotalsPerUnit();
    return {
      baseCost: product?.cost ?? perUnit.baseCost,
      intlShipping: perUnit.intlShipping,
      packaging: perUnit.packaging,
      localShipping: perUnit.localShipping,
    };
  },

  inputsFromProduct(p) {
    if (!p) return { baseCost: 0, intlShipping: 0, packaging: 0, localShipping: 0 };
    const est = this.estimateFromExpenses(p);
    return {
      baseCost: p.cost ?? 0,
      intlShipping: est.intlShipping,
      packaging: est.packaging,
      localShipping: est.localShipping,
    };
  },
};

const DynamicPricingUI = {
  lastResult: null,

  getInputs() {
    return {
      baseCost: document.getElementById('dp-base-cost')?.value,
      intlShipping: document.getElementById('dp-intl-shipping')?.value,
      packaging: document.getElementById('dp-packaging')?.value,
      localShipping: document.getElementById('dp-local-shipping')?.value,
    };
  },

  setInputs(inputs) {
    const map = [
      ['dp-base-cost', inputs.baseCost],
      ['dp-intl-shipping', inputs.intlShipping],
      ['dp-packaging', inputs.packaging],
      ['dp-local-shipping', inputs.localShipping],
    ];
    map.forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) el.value = val ?? 0;
    });
  },

  populateProductSelect() {
    const sel = document.getElementById('dp-product-select');
    if (!sel) return;
    const prev = sel.value;
    const options = [
      `<option value="">${t('dpSelectProductHint')}</option>`,
      ...state.products.map((p) => {
        const label = `${p.code} · ${p.name} · ${p.size} · ${formatAUD(p.cost)}`;
        return `<option value="${p.id}">${escapeHtml(label)}</option>`;
      }),
    ];
    sel.innerHTML = options.join('');
    if (prev && state.products.some((p) => p.id === prev)) sel.value = prev;
  },

  onProductSelect(productId) {
    if (!productId) return;
    const p = getProduct(productId);
    if (!p) return;
    this.setInputs(DynamicPricingEngine.inputsFromProduct(p));
    if (document.getElementById('product-id')?.value !== p.id) {
      document.getElementById('product-id').value = p.id;
      document.getElementById('product-code').value = p.code;
      document.getElementById('product-name').value = p.name;
      document.getElementById('product-size').value = p.size;
      document.getElementById('product-color').value = p.color;
      const styleEl = document.getElementById('product-style');
      if (styleEl) styleEl.value = p.style || 'classic';
      document.getElementById('product-cost').value = p.cost;
      document.getElementById('product-price').value = p.price;
      document.getElementById('product-qty').value = p.quantity;
      updateProductImagePreview(p.image || null);
    }
    this.renderTotalPreview();
  },

  renderTotalPreview() {
    const el = document.getElementById('dp-total-cost');
    if (!el) return;
    const total = DynamicPricingEngine.calcTotalCost(this.getInputs());
    el.textContent = formatAUD(total);
  },

  calculate() {
    const inputs = this.getInputs();
    const total = DynamicPricingEngine.calcTotalCost(inputs);
    if (total <= 0) return showToast(t('dpResultsEmpty'), 'error');
    this.lastResult = DynamicPricingEngine.calculate(inputs);
    this.renderTierCards();
    const wrap = document.getElementById('dp-tier-cards');
    if (wrap) wrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  },

  estimateFromExpenses() {
    const productId = document.getElementById('dp-product-select')?.value;
    const p = productId ? getProduct(productId) : null;
    this.setInputs(DynamicPricingEngine.estimateFromExpenses(p));
    this.renderTotalPreview();
    showToast(t('estimateCosts'));
  },

  renderTierCards() {
    const wrap = document.getElementById('dp-tier-cards');
    const empty = document.getElementById('dp-results-empty');
    if (!wrap) return;

    if (!this.lastResult?.tiers?.length) {
      wrap.innerHTML = '';
      if (empty) empty.hidden = false;
      return;
    }

    if (empty) empty.hidden = true;
    const totalEl = document.getElementById('dp-total-cost');
    if (totalEl) totalEl.textContent = formatAUD(this.lastResult.totalCost);

    wrap.innerHTML = this.lastResult.tiers.map((tier) => `
      <article class="dp-tier-card dp-tier-card--${tier.theme}">
        <div class="dp-tier-card__icon" aria-hidden="true">${tier.icon}</div>
        <h4 class="dp-tier-card__title">${t(tier.titleKey)}</h4>
        <p class="dp-tier-card__margin">${t('dpMarginLabel').replace('{pct}', String(tier.marginPct))}</p>
        <p class="dp-tier-card__price">${formatAUD(tier.price)}</p>
        <p class="dp-tier-card__desc">${t(tier.descKey)}</p>
        ${tier.rarityKey ? `<p class="dp-tier-card__rarity">${t(tier.rarityKey)}</p>` : ''}
        <button type="button" class="btn btn--primary btn--sm dp-tier-card__apply" data-dp-apply="${tier.id}">${t('dpApplySalePrice')}</button>
      </article>`).join('');
  },

  applyTier(tierId) {
    const tier = this.lastResult?.tiers?.find((x) => x.id === tierId);
    if (!tier?.price) return showToast(t('dpResultsEmpty'), 'error');

    const productId = document.getElementById('dp-product-select')?.value
      || document.getElementById('product-id')?.value;
    const priceField = document.getElementById('product-price');
    const costField = document.getElementById('product-cost');

    if (productId) {
      const p = getProduct(productId);
      if (p) {
        document.getElementById('product-id').value = p.id;
        document.getElementById('product-code').value = p.code;
        document.getElementById('product-name').value = p.name;
        document.getElementById('product-size').value = p.size;
        document.getElementById('product-color').value = p.color;
        const styleEl = document.getElementById('product-style');
        if (styleEl) styleEl.value = p.style || 'classic';
        if (costField) costField.value = this.lastResult.totalCost;
        document.getElementById('product-qty').value = p.quantity;
        updateProductImagePreview(p.image || null);
      }
    } else if (costField && this.lastResult) {
      costField.value = this.lastResult.totalCost;
    }

    if (priceField) priceField.value = tier.price;
    navigateToTab('inventory');
    scrollToForm('product-form');
    showToast(`${t('priceApplied')} · ${t(tier.titleKey)}: ${formatAUD(tier.price)}`);
  },
};

function renderDynamicPricingWidgetHTML() {
  return `
    <div class="card card--dynamic-pricing" id="dynamic-pricing-widget">
      <div class="dp-widget__head">
        <span class="dp-widget__badge" aria-hidden="true">◈</span>
        <div>
          <h2 class="card__title dp-widget__title">${t('dynamicPricing')}</h2>
          <p class="dp-widget__desc">${t('dynamicPricingDesc')}</p>
        </div>
      </div>
      <div class="form-field dp-widget__product-field">
        <label for="dp-product-select">${t('dpSelectProduct')}</label>
        <select id="dp-product-select" class="dp-product-select">
          <option value="">${t('dpSelectProductHint')}</option>
        </select>
      </div>
      <div class="form-grid form-grid--dynamic-pricing">
        <div class="form-field">
          <label for="dp-base-cost">${t('dpBaseCost')}</label>
          <input type="number" id="dp-base-cost" class="dp-input" min="0" step="0.01" value="0">
        </div>
        <div class="form-field">
          <label for="dp-intl-shipping">${t('dpIntlShipping')}</label>
          <input type="number" id="dp-intl-shipping" class="dp-input" min="0" step="0.01" value="0">
        </div>
        <div class="form-field">
          <label for="dp-packaging">${t('dpPackaging')}</label>
          <input type="number" id="dp-packaging" class="dp-input" min="0" step="0.01" value="0">
        </div>
        <div class="form-field">
          <label for="dp-local-shipping">${t('dpLocalShipping')}</label>
          <input type="number" id="dp-local-shipping" class="dp-input" min="0" step="0.01" value="0">
        </div>
      </div>
      <div class="dp-widget__total">
        <span>${t('dpTotalCost')}</span>
        <strong id="dp-total-cost">${formatAUD(0)}</strong>
      </div>
      <div class="dp-widget__actions">
        <button type="button" class="btn btn--primary" id="dp-calculate">${t('dpCalculate')}</button>
        <button type="button" class="btn btn--outline" id="dp-estimate-expenses">${t('dpEstimateExpenses')}</button>
      </div>
      <p class="dp-results-empty" id="dp-results-empty">${t('dpResultsEmpty')}</p>
      <div class="dp-tier-cards" id="dp-tier-cards" role="list"></div>
    </div>`;
}

// ═══════════════════════════════════════════════════════════════
//  Live Currency Bridge — ExchangeRate-API
// ═══════════════════════════════════════════════════════════════

const LiveCurrencyBridge = {
  async fetchRates(force = false) {
    const cached = state.settings.exchangeRates;
    if (!force && cached?.fetchedAt) {
      const ageH = (Date.now() - new Date(cached.fetchedAt).getTime()) / 3600000;
      if (ageH < APP_CONFIG.exchangeCacheHours) return cached;
    }

    try {
      const res = await fetch(APP_CONFIG.exchangeApiUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const rates = data.rates || {};
      const audPerSar = rates.SAR > 0 ? CurrencyEngine.round(1 / rates.SAR) : null;
      const audPerUsd = rates.USD > 0 ? CurrencyEngine.round(1 / rates.USD) : null;

      const payload = {
        base: 'AUD',
        audPerSar,
        audPerUsd,
        raw: { SAR: rates.SAR, USD: rates.USD },
        fetchedAt: new Date().toISOString(),
        live: true,
      };
      state.settings.exchangeRates = payload;
      await DataStore.save();
      return payload;
    } catch (err) {
      console.warn('[FX]', err);
      if (cached) return { ...cached, live: false, error: true };
      return { audPerSar: 0.41, audPerUsd: 1.52, fetchedAt: null, live: false, error: true };
    }
  },

  rateFor(currency) {
    if (currency === 'AUD') return 1;
    const fx = state.settings.exchangeRates;
    if (!fx) return null;
    if (currency === 'SAR') return fx.audPerSar;
    if (currency === 'USD') return fx.audPerUsd;
    return null;
  },

  applyToExpenseForm() {
    const cur = document.getElementById('expense-currency')?.value;
    const rateEl = document.getElementById('expense-rate');
    if (!rateEl || !cur || cur === 'AUD') return;
    const live = this.rateFor(cur);
    if (live > 0) {
      rateEl.value = live;
      rateEl.dataset.liveRate = '1';
    }
    renderLiveRatesPanel();
    renderExpensePreview();
  },
};

// ═══════════════════════════════════════════════════════════════
//  Predictive Buying — proactive reorder alerts
// ═══════════════════════════════════════════════════════════════

const PredictiveBuyingEngine = {
  lastMonthStart() {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    d.setHours(0, 0, 0, 0);
    return d;
  },

  monthlyQty(productId) {
    const start = this.lastMonthStart();
    return state.sales
      .filter((s) => s.productId === productId && new Date(s.createdAt) >= start)
      .reduce((sum, s) => sum + s.quantity, 0);
  },

  shippingTrend() {
    const now = Date.now();
    const d30 = now - 30 * 86400000;
    const d60 = now - 60 * 86400000;
    let recent = 0;
    let prior = 0;

    state.expenses.forEach((e) => {
      if (e.category !== 'intl_shipping') return;
      const t = new Date(e.createdAt).getTime();
      const v = e.financials?.audTotal ?? 0;
      if (t >= d30) recent += v;
      else if (t >= d60 && t < d30) prior += v;
    });

    const rising = prior > 0 && recent > prior * 1.08;
    const pct = prior > 0 ? CurrencyEngine.round(((recent - prior) / prior) * 100) : 0;
    return { rising, recent, prior, pct };
  },

  proactiveAlerts() {
    const shipping = this.shippingTrend();
    const alerts = [];

    state.products.forEach((p) => {
      if (p.quantity <= 0) return;
      const fc = DemandForecastEngine.productForecast(p);
      const monthly = this.monthlyQty(p.id);
      const daysLeft = fc.hasData ? fc.daysLeft : null;

      if (daysLeft !== null && daysLeft <= APP_CONFIG.predictiveStockDays && monthly >= 2) {
        alerts.push({
          product: p,
          daysLeft,
          monthly,
          shippingRising: shipping.rising,
          severity: daysLeft <= 7 ? 'critical' : 'warning',
        });
      } else if (monthly >= 8 && p.quantity < monthly * 0.5) {
        const estDays = Math.floor(p.quantity / (monthly / 30));
        if (estDays <= APP_CONFIG.predictiveStockDays) {
          alerts.push({
            product: p,
            daysLeft: estDays,
            monthly,
            shippingRising: shipping.rising,
            severity: 'warning',
          });
        }
      }
    });

    return alerts.sort((a, b) => a.daysLeft - b.daysLeft);
  },

  alertMessage(alert) {
    const shipping = alert.shippingRising ? t('shippingRiseHint') : '';
    return t('proactiveAlert')
      .replace('{qty}', String(alert.monthly))
      .replace('{name}', alert.product.name)
      .replace('{days}', String(alert.daysLeft))
      .replace('{shipping}', shipping);
  },
};

// ═══════════════════════════════════════════════════════════════
//  Style Analytics — colors & slow movers
// ═══════════════════════════════════════════════════════════════

const StyleAnalyticsEngine = {
  styleLabel(id) {
    const s = ABAYA_STYLES.find((x) => x.id === id);
    return s ? t(s.key) : id || '—';
  },

  colorDemand(limit = 8) {
    const map = {};
    state.sales.forEach((s) => {
      const color = s.productColor || getProduct(s.productId)?.color;
      if (!color) return;
      map[color] = (map[color] || 0) + s.quantity;
    });
    return Object.entries(map)
      .map(([color, qty]) => ({ color, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, limit);
  },

  styleDemand(limit = 8) {
    const map = {};
    state.sales.forEach((s) => {
      const style = s.productStyle || getProduct(s.productId)?.style;
      if (!style) return;
      map[style] = (map[style] || 0) + s.quantity;
    });
    return Object.entries(map)
      .map(([style, qty]) => ({ style, label: this.styleLabel(style), qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, limit);
  },

  slowMovers() {
    const cutoff = Date.now() - APP_CONFIG.slowMoverDays * 86400000;
    return state.products
      .filter((p) => p.quantity > 0)
      .map((p) => {
        const lastSale = state.sales
          .filter((s) => s.productId === p.id)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
        const lastAt = lastSale ? new Date(lastSale.createdAt).getTime() : 0;
        const daysSince = lastAt ? Math.floor((Date.now() - lastAt) / 86400000) : 999;
        return { product: p, daysSince, lastAt };
      })
      .filter((x) => !x.lastAt || x.lastAt < cutoff)
      .sort((a, b) => b.daysSince - a.daysSince)
      .slice(0, 8);
  },
};

// ═══════════════════════════════════════════════════════════════
//  Smart Notifications — Web Push / Notification API
// ═══════════════════════════════════════════════════════════════

const NotificationEngine = {
  swRegistration: null,

  async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return null;
    try {
      this.swRegistration = await navigator.serviceWorker.register('./sw.js');
      return this.swRegistration;
    } catch (e) {
      console.warn('[SW]', e);
      return null;
    }
  },

  async requestPermission() {
    if (!('Notification' in window)) return 'unsupported';
    const perm = await Notification.requestPermission();
    state.settings.notificationsEnabled = perm === 'granted';
    await DataStore.save();
    return perm;
  },

  wasSent(key) {
    const today = new Date().toISOString().slice(0, 10);
    return state.settings.notifiedKeys?.[`${key}:${today}`];
  },

  async markSent(key) {
    if (!state.settings.notifiedKeys) state.settings.notifiedKeys = {};
    const today = new Date().toISOString().slice(0, 10);
    state.settings.notifiedKeys[`${key}:${today}`] = true;
    await DataStore.save();
  },

  async show(title, body, tag = 'prestige') {
    if (!state.settings.notificationsEnabled || Notification.permission !== 'granted') return;
    const options = {
      body,
      tag,
      icon: state.settings.logo || undefined,
      badge: state.settings.logo || undefined,
      vibrate: [120, 60, 120],
      data: { url: './index.html' },
    };

    if (this.swRegistration?.active) {
      this.swRegistration.active.postMessage({ type: 'SHOW_NOTIFICATION', title, options });
      return;
    }
    if ('Notification' in window) new Notification(title, options);
  },

  async evaluate() {
    if (!state.settings.notificationsEnabled || Notification.permission !== 'granted') return;

    const today = new Date().toISOString().slice(0, 10);
    const todaySales = state.sales.filter((s) => s.createdAt?.startsWith(today));
    const todayQty = todaySales.reduce((s, x) => s + x.quantity, 0);
    const avgDaily = DemandForecastEngine.avgDailySales();
    const threshold = Math.max(3, Math.ceil(avgDaily * APP_CONFIG.recordSaleMultiplier));

    if (todayQty >= threshold && !this.wasSent('record-sales')) {
      await this.show(
        t('notifyRecordSales'),
        t('notifyRecordSalesBody').replace('{qty}', String(todayQty)),
        'record-sales'
      );
      await this.markSent('record-sales');
    }

    AnalyticsEngine.lowStockAlerts(3).forEach(async (p) => {
      const key = `stock-${p.id}`;
      if (this.wasSent(key)) return;
      await this.show(
        t('notifyStockLow'),
        t('notifyStockLowBody').replace('{name}', p.name).replace('{qty}', String(p.quantity)),
        key
      );
      await this.markSent(key);
    });

    const intl = state.expenses
      .filter((e) => e.category === 'intl_shipping')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

    if (intl) {
      const days = Math.floor((Date.now() - new Date(intl.createdAt).getTime()) / 86400000);
      if (days >= APP_CONFIG.shippingReminderDays && !this.wasSent('shipping-due')) {
        await this.show(
          t('notifyShippingDue'),
          t('notifyShippingDueBody').replace('{days}', String(days)),
          'shipping-due'
        );
        await this.markSent('shipping-due');
      }
    }

    const dueSoon = state.expenses.filter((e) => {
      if (!e.dueDate) return false;
      const due = new Date(e.dueDate);
      const diff = (due - new Date()) / 86400000;
      return diff >= 0 && diff <= 3;
    });

    for (const e of dueSoon) {
      const key = `due-${e.id}`;
      if (this.wasSent(key)) continue;
      await this.show(
        t('notifyShippingDue'),
        `${e.name} — ${formatDate(e.dueDate)}`,
        key
      );
      await this.markSent(key);
    }
  },
};

const INVOICE_PREFIX = 'PA';
const INVOICE_START_SEQ = 1001;

const InvoiceNumberEngine = {
  format(seq) {
    return `${INVOICE_PREFIX}-${String(seq).padStart(4, '0')}`;
  },

  parseSeq(invoiceNumber) {
    if (!invoiceNumber) return 0;
    const m = String(invoiceNumber).trim().match(/^PA-(\d+)$/i);
    return m ? parseInt(m[1], 10) : 0;
  },

  inferMaxSeq() {
    let max = 0;
    state.sales.forEach((s) => {
      const n = this.parseSeq(s.invoiceNumber);
      if (n > max) max = n;
    });
    return max;
  },

  normalizeQuery(query) {
    const q = String(query || '').trim();
    const m = q.match(/^PA-?\s*(\d+)$/i);
    if (m) return this.format(parseInt(m[1], 10));
    return q;
  },

  saleInvoiceNumber(sale) {
    return sale?.invoiceNumber || saleInvoiceKey(sale);
  },

  matchesQuery(sale, query) {
    const norm = this.normalizeQuery(query).toUpperCase();
    if (!norm) return false;
    const inv = this.saleInvoiceNumber(sale).toUpperCase();
    return inv === norm || inv.includes(norm);
  },

  next() {
    let seq = state.settings.nextInvoiceSeq || INVOICE_START_SEQ;
    if (seq < INVOICE_START_SEQ) seq = INVOICE_START_SEQ;
    const maxUsed = this.inferMaxSeq();
    if (seq <= maxUsed) seq = maxUsed + 1;
    state.settings.nextInvoiceSeq = seq + 1;
    return this.format(seq);
  },
};

function migrateInvoiceNumbers() {
  const groups = new Map();

  state.sales.forEach((s) => {
    if (s.invoiceNumber && /^PA-\d{4}$/i.test(s.invoiceNumber)) return;
    const key = s.batchId ? `batch:${s.batchId}` : `sale:${s.id}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(s);
  });

  if (!groups.size) return;

  let seq = InvoiceNumberEngine.inferMaxSeq();
  [...groups.values()]
    .sort((a, b) => new Date(a[0].createdAt) - new Date(b[0].createdAt))
    .forEach((group) => {
      seq += 1;
      const inv = InvoiceNumberEngine.format(seq);
      group.forEach((s) => {
        s.invoiceNumber = inv;
      });
    });

  state.settings.nextInvoiceSeq = Math.max(state.settings.nextInvoiceSeq || 1, seq + 1);
}

function migrateData() {
  state.products.forEach((p) => {
    if (!p.style) p.style = 'classic';
    if (p.targetMarginPct == null) p.targetMarginPct = SmartPricingEngine.defaultMarginPct;
  });
  state.sales.forEach((s) => {
    const p = getProduct(s.productId);
    if (p) {
      if (!s.productColor) s.productColor = p.color;
      if (!s.productStyle) s.productStyle = p.style;
    }
    if (!s.saleSource) s.saleSource = 'in_store';
    if (s.lineTotalAud == null) s.lineTotalAud = CurrencyEngine.round(s.unitPriceAud * s.quantity);
    if (s.subtotalAud == null) s.subtotalAud = s.lineTotalAud;
  });
  migrateInvoiceNumbers();
  if (!state.settings.notifiedKeys) state.settings.notifiedKeys = {};
  if (!state.returns) state.returns = [];
  if (!state.inventoryTransactions) state.inventoryTransactions = [];
  if (!state.activityLog) state.activityLog = [];
  if (!state.systemUsers) state.systemUsers = [];
  AuthSystem.syncSession();
  const nextFromSales = InvoiceNumberEngine.inferMaxSeq() + 1;
  if (!state.settings.nextInvoiceSeq || state.settings.nextInvoiceSeq < INVOICE_START_SEQ) {
    state.settings.nextInvoiceSeq = Math.max(nextFromSales, INVOICE_START_SEQ);
  }
  if (!SmartSeasonalMode.modes.includes(state.settings.inventorySeasonalMode)) {
    state.settings.inventorySeasonalMode = 'normal';
  }
}

function paymentMethodLabel(id) {
  const m = PAYMENT_METHODS.find((x) => x.id === id);
  return m ? t(m.key) : id;
}

function inferPaymentMethodId(sale) {
  if (sale.paymentMethod) return sale.paymentMethod;
  const p = (sale.payment || '').toLowerCase();
  if (/card|pos|بطاقة|visa|master/i.test(p)) return 'card';
  if (/transfer|تحويل|بنك|bank/i.test(p)) return 'transfer';
  return 'cash';
}

function paymentMethodIcon(id) {
  return UI_ICONS[id] || UI_ICONS.cash;
}

function salePaymentBadge(sale) {
  const id = inferPaymentMethodId(sale);
  return `<span class="pay-badge pay-badge--${id}" title="${paymentMethodLabel(id)}">${paymentMethodIcon(id)}<span>${paymentMethodLabel(id)}</span></span>`;
}

function formatPosPayButton(total) {
  return `${UI_ICONS.cart}<span class="pos-pay-btn__text">${t('posPay')} ${formatAUD(total)}</span>`;
}

function updateConnectionStatus() {
  const el = document.getElementById('connection-status');
  if (!el) return;
  const cloudReady = !!(APP_CONFIG.supabase.url && APP_CONFIG.supabase.anonKey);
  el.classList.toggle('connection-status--online', cloudReady);
  el.classList.toggle('connection-status--local', !cloudReady);
  const label = el.querySelector('.connection-status__label');
  if (label) label.textContent = cloudReady ? t('connectionOnline') : t('connectionLocal');
  el.title = cloudReady ? t('connectionOnline') : t('connectionLocal');
}

function refundMethodLabel(id) {
  const m = REFUND_METHODS.find((x) => x.id === id);
  return m ? t(m.key) : id;
}

function saleInvoiceKey(sale) {
  if (sale?.invoiceNumber) return sale.invoiceNumber;
  if (sale?.batchId) return `LEG-${sale.batchId}`;
  return sale?.id?.slice(0, 8).toUpperCase() || '—';
}

function saleRefundAmount(sale) {
  return sale.lineTotalAud ?? CurrencyEngine.round(sale.unitPriceAud * sale.quantity);
}

// ═══════════════════════════════════════════════════════════════
//  Returns Engine
// ═══════════════════════════════════════════════════════════════

const ReturnsEngine = {
  searchInvoices(query) {
    const q = query.trim();
    if (!q) return [];
    const qLower = q.toLowerCase();
    const qNorm = InvoiceNumberEngine.normalizeQuery(q).toLowerCase();

    const map = {};
    state.sales.forEach((s) => {
      if (s.returned) return;
      const inv = InvoiceNumberEngine.saleInvoiceNumber(s);
      const invLower = inv.toLowerCase();
      const match = invLower.includes(qLower)
        || invLower.includes(qNorm)
        || (qNorm && invLower === qNorm)
        || s.productName?.toLowerCase().includes(qLower);
      if (match) {
        if (!map[inv]) {
          map[inv] = {
            invoiceNumber: inv,
            sales: [],
            createdAt: s.createdAt,
            payment: s.payment,
          };
        }
        map[inv].sales.push(s);
        if (new Date(s.createdAt) < new Date(map[inv].createdAt)) map[inv].createdAt = s.createdAt;
      }
    });

    return Object.values(map)
      .map((inv) => ({
        ...inv,
        total: CurrencyEngine.round(inv.sales.reduce((sum, s) => sum + saleRefundAmount(s), 0)),
      }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  getInvoice(invoiceNumber) {
    const norm = InvoiceNumberEngine.normalizeQuery(invoiceNumber);
    const sales = state.sales.filter(
      (s) => !s.returned && InvoiceNumberEngine.saleInvoiceNumber(s).toUpperCase() === norm.toUpperCase()
    );
    if (!sales.length) return null;
    return {
      invoiceNumber: sales[0].invoiceNumber || norm,
      sales,
      total: CurrencyEngine.round(sales.reduce((s, x) => s + saleRefundAmount(x), 0)),
      createdAt: sales[0].createdAt,
      payment: sales[0].payment,
    };
  },

  processPartialReturn(saleIds, refundMethod) {
    const unique = [...new Set(saleIds)];
    if (!unique.length) return { ok: false, error: 'empty' };

    const items = [];
    let refundAud = 0;
    let invoiceNumber = '';

    for (const saleId of unique) {
      const sale = state.sales.find((s) => s.id === saleId);
      if (!sale || sale.returned) return { ok: false, error: 'invalid' };

      const amount = saleRefundAmount(sale);
      const p = getProduct(sale.productId);
      if (p) p.quantity += sale.quantity;

      sale.returned = true;
      sale.returnedAt = new Date().toISOString();
      invoiceNumber = saleInvoiceKey(sale);
      refundAud += amount;

      items.push({
        saleId: sale.id,
        productId: sale.productId,
        productName: sale.productName,
        productCode: sale.productCode,
        quantity: sale.quantity,
        refundAud: amount,
        originalSubtotal: sale.subtotalAud,
        originalDiscount: CurrencyEngine.round((sale.subtotalAud || amount) - amount),
      });
    }

    refundAud = CurrencyEngine.round(refundAud);

    state.returns.unshift({
      id: uid(),
      invoiceNumber,
      saleIds: unique,
      items,
      refundAud,
      refundMethod,
      refundMethodLabel: refundMethodLabel(refundMethod),
      payment: items[0] ? state.sales.find((s) => s.id === items[0].saleId)?.payment : '—',
      createdAt: new Date().toISOString(),
    });

    return { ok: true, refundAud, invoiceNumber };
  },

  processReturn(saleId, refundMethod = 'cash') {
    return this.processPartialReturn([saleId], refundMethod);
  },
};

const ReturnsUI = {
  selectedInvoice: null,
  checkedSaleIds: new Set(),

  search(query) {
    const panel = document.getElementById('returns-invoice-panel');
    const detail = document.getElementById('returns-invoice-detail');
    if (!panel) return;

    const q = query.trim();
    if (!q) {
      panel.innerHTML = '';
      this.selectedInvoice = null;
      this.checkedSaleIds = new Set();
      if (detail) detail.innerHTML = '';
      return;
    }

    const normalized = InvoiceNumberEngine.normalizeQuery(q);
    const direct = ReturnsEngine.getInvoice(normalized);
    if (direct) {
      panel.innerHTML = `<p class="returns-inv-found">${t('invoiceFound')}: <strong>${direct.invoiceNumber}</strong> · ${formatAUD(direct.total)}</p>`;
      this.openInvoice(direct.invoiceNumber);
      return;
    }

    const list = ReturnsEngine.searchInvoices(q);
    if (!list.length) {
      panel.innerHTML = `<p class="returns-empty">${t('invoiceNotFound')}</p>`;
      if (detail) detail.innerHTML = '';
      this.selectedInvoice = null;
      return;
    }

    if (list.length === 1) {
      this.openInvoice(list[0].invoiceNumber);
      panel.innerHTML = `<p class="returns-inv-found">${t('invoiceFound')}: <strong>${list[0].invoiceNumber}</strong></p>`;
      return;
    }

    panel.innerHTML = list.map((inv) => `
      <button type="button" class="returns-inv-pick" data-invoice-pick="${inv.invoiceNumber}">
        <span><strong>${inv.invoiceNumber}</strong> · ${formatDate(inv.createdAt)}</span>
        <span>${inv.sales.length} ${t('qty')} · ${formatAUD(inv.total)}</span>
      </button>`).join('');
  },

  openInvoice(invoiceNumber) {
    const inv = ReturnsEngine.getInvoice(invoiceNumber);
    const detail = document.getElementById('returns-invoice-detail');
    if (!inv || !detail) return;

    this.selectedInvoice = inv;
    this.checkedSaleIds = new Set();

    detail.innerHTML = `
      <div class="returns-invoice-head">
        <h3>${t('invoiceDetails')}: <strong>${inv.invoiceNumber}</strong></h3>
        <p>${formatDate(inv.createdAt)} · ${inv.payment || '—'} · ${formatAUD(inv.total)}</p>
      </div>
      <p class="returns-invoice-hint">${t('selectItemsReturn')}</p>
      <ul class="returns-checklist">
        ${inv.sales.map((s) => {
          const refund = saleRefundAmount(s);
          const disc = CurrencyEngine.round((s.subtotalAud || refund) - refund);
          return `<li class="returns-check-item">
            <label class="returns-check-label">
              <input type="checkbox" class="returns-check" data-return-check="${s.id}">
              <span class="returns-check-body">
                <strong>${s.productName}</strong>
                <span class="returns-paid-hint">${t('returnPaidAfterDiscount')}: <strong>${formatAUD(refund)}</strong>${disc > 0 ? ` <em class="returns-disc-note">(${t('posDiscount')} −${formatAUD(disc)})</em>` : ''}</span>
                <span class="returns-check-meta">${s.productCode} · ${t('size')} ${getProduct(s.productId)?.size || '—'} · ×${s.quantity}</span>
              </span>
            </label>
          </li>`;
        }).join('')}
      </ul>
      <div class="returns-refund-bar">
        <div><span>${t('refundTotal')}</span><strong id="returns-refund-sum">${formatAUD(0)}</strong></div>
        <div class="returns-refund-methods">
          <span class="returns-refund-label">${t('refundMethod')}</span>
          ${REFUND_METHODS.map((m) => `<button type="button" class="btn btn--outline returns-refund-btn" data-refund-method="${m.id}">${UI_ICONS.return}<span>${t(m.key)}</span></button>`).join('')}
        </div>
      </div>`;

    this.updateRefundSum();
  },

  toggleCheck(saleId, checked) {
    if (checked) this.checkedSaleIds.add(saleId);
    else this.checkedSaleIds.delete(saleId);
    this.updateRefundSum();
  },

  updateRefundSum() {
    const el = document.getElementById('returns-refund-sum');
    if (!el || !this.selectedInvoice) return;
    let sum = 0;
    this.selectedInvoice.sales.forEach((s) => {
      if (this.checkedSaleIds.has(s.id)) sum += saleRefundAmount(s);
    });
    el.textContent = formatAUD(sum);
  },

  async confirmReturn(refundMethod) {
    if (!this.checkedSaleIds.size) return showToast(t('selectItemsReturn'), 'error');
    if (!confirm(t('returnConfirm'))) return;

    const result = ReturnsEngine.processPartialReturn([...this.checkedSaleIds], refundMethod);
    if (!result.ok) return showToast(t('saleNotReturnable'), 'error');

    await DataStore.save();
    showToast(`${t('returnDone')} · ${formatAUD(result.refundAud)}`);
    this.selectedInvoice = null;
    this.checkedSaleIds = new Set();
    document.getElementById('returns-invoice-detail').innerHTML = '';
    document.getElementById('returns-search-invoice').value = '';
    ReturnsUI.search('');
    renderReturnsLog();
    refreshDashboardMetrics();
    PosEngine.warmCache();
    renderSalesTable(document.getElementById('sale-search')?.value || '');
    renderInventoryTable(document.getElementById('inv-search')?.value || '');
  },
};

function renderReturnsLog() {
  const logBody = document.getElementById('returns-log-tbody');
  const totalEl = document.getElementById('returns-total-aud');
  if (!logBody) return;

  const logs = state.returns || [];
  logBody.innerHTML = logs.length
    ? logs.map((r) => `<tr>
        <td>${formatDate(r.createdAt)}</td>
        <td>${r.invoiceNumber || '—'}</td>
        <td>${r.items?.length || r.saleIds?.length || 1} ${t('qty')}</td>
        <td>${formatAUD(r.refundAud)}</td>
        <td>${r.refundMethodLabel || refundMethodLabel(r.refundMethod)}</td>
      </tr>`).join('')
    : `<tr><td colspan="5" class="empty">${t('noData')}</td></tr>`;

  if (totalEl) totalEl.textContent = formatAUD(AnalyticsEngine.totalReturnsAUD());
}

// ═══════════════════════════════════════════════════════════════
//  Maintenance — reset operational data (keep users)
// ═══════════════════════════════════════════════════════════════

const MaintenanceMode = {
  /** يمسح مفاتيح المخزون والفواتير داخل prestige-abaya-v3 دون المساس بالمستخدمين أو loggedIn */
  async resetDatabase() {
    if (!AuthSystem.isAdmin()) {
      showToast(t('authRequired'), 'error');
      return false;
    }

    const preservedUsers = [...(state.systemUsers || [])];
    const preservedSettings = { ...state.settings };
    const preservedExpenses = [...(state.expenses || [])];

    state.products = [];
    state.sales = [];
    state.returns = [];
    state.inventoryTransactions = [];
    state.activityLog = [];
    state.expenses = preservedExpenses;
    state.systemUsers = preservedUsers;

    state.settings = {
      ...preservedSettings,
      nextInvoiceSeq: INVOICE_START_SEQ,
      notifiedKeys: {},
      invoiceFxHistory: [],
    };

    if (typeof PosEngine !== 'undefined') PosEngine.cart = [];

    await DataStore.save();
    renderAll();
    showToast(t('resetDbSuccess'));
    return true;
  },

  async requestReset() {
    if (!UserSession.requireUser()) return;
    if (!AuthSystem.isAdmin()) {
      showToast(t('authRequired'), 'error');
      return;
    }
    if (!confirm(t('resetDbConfirm'))) return;
    await this.resetDatabase();
  },
};

// ═══════════════════════════════════════════════════════════════
//  DataStore — Supabase-ready
// ═══════════════════════════════════════════════════════════════

const DataStore = {
  provider: 'local',

  async load() {
    if (this.provider === 'supabase') return this._loadSupabase();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      state.products = d.products || [];
      state.expenses = d.expenses || [];
      state.sales = d.sales || [];
      state.returns = d.returns || [];
      state.inventoryTransactions = d.inventoryTransactions || [];
      state.activityLog = d.activityLog || [];
      state.systemUsers = d.systemUsers || [];
      state.settings = { ...state.settings, ...d.settings };
      migrateData();
      // migrate old purchases → expenses if present
      if (d.purchases?.length && !state.expenses.length) {
        d.purchases.forEach((p) => {
          state.expenses.push({
            id: p.id,
            name: p.productName || 'Purchase',
            category: 'import',
            currency: p.currency || 'AUD',
            amountOriginal: p.financials?.netTotal ?? 0,
            exchangeRate: 1,
            financials: p.financials || CurrencyEngine.calcExpense({
              amountOriginal: 0,
              currency: 'AUD',
              exchangeRate: 1,
              vatRate: state.settings.vatRate,
            }),
            createdAt: p.createdAt,
          });
        });
      }
    } catch (e) {
      console.warn('Load error', e);
    }
  },

  usesCloud() {
    return this.provider === 'supabase'
      && typeof SupabaseBridge !== 'undefined'
      && SupabaseBridge.isConfigured();
  },

  async _cloudReady() {
    if (!this.usesCloud()) return { ok: true, localOnly: true };
    if (!SupabaseBridge.getClient()) {
      return { ok: false, error: 'Supabase client not available' };
    }
    return SupabaseBridge.ensureAuth();
  },

  /** Sales insert path — may skip ensureAuth/getSession when skipAuthForSales is enabled */
  async _cloudReadyForSalesInsert() {
    if (!this.usesCloud()) return { ok: true, localOnly: true };
    if (!SupabaseBridge.getClient()) {
      return { ok: false, error: 'Supabase client not available' };
    }
    if (typeof SupabaseBridge.isSkipAuthForSales === 'function' && SupabaseBridge.isSkipAuthForSales()) {
      return SupabaseBridge.ensureClientReady();
    }
    return SupabaseBridge.ensureAuth();
  },

  async cloudUpsertProduct(product) {
    const ready = await this._cloudReady();
    if (!ready.ok) return ready;
    if (ready.localOnly) return { ok: true, localOnly: true };
    return SupabaseBridge.upsertProduct(product);
  },

  async cloudInsertSale(sale, productAfter) {
    const ready = await this._cloudReadyForSalesInsert();
    if (!ready.ok) return ready;
    if (ready.localOnly) return { ok: true, localOnly: true };

    const saleRes = await SupabaseBridge.insertSale(sale);
    if (!saleRes.ok) return saleRes;

    if (productAfter) {
      const prodRes = await SupabaseBridge.upsertProduct(productAfter);
      if (!prodRes.ok) return prodRes;
    }
    return { ok: true };
  },

  async save() {
    if (this.provider === 'supabase') return this._saveSupabase();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        products: state.products,
        expenses: state.expenses,
        sales: state.sales,
        returns: state.returns,
        inventoryTransactions: state.inventoryTransactions,
        activityLog: state.activityLog,
        systemUsers: state.systemUsers,
        settings: state.settings,
      })
    );
  },

  async _loadSupabase() {
    if (typeof SupabaseBridge === 'undefined' || !SupabaseBridge.getClient()) {
      console.warn('[Supabase] Bridge not ready — using localStorage');
      return this.load();
    }
    const auth = await SupabaseBridge.ensureAuth();
    if (!auth.ok) {
      console.warn('[Supabase] Auth failed — using localStorage:', auth.error);
      return this.load();
    }

    const [salesRes, productsRes] = await Promise.all([
      SupabaseBridge.fetchSales(),
      SupabaseBridge.fetchProducts(),
    ]);

    if (salesRes.ok) state.sales = salesRes.data;
    if (productsRes.ok) state.products = productsRes.data;

    migrateData();
    console.info('[Supabase] Loaded', state.sales.length, 'sales,', state.products.length, 'products');
  },

  async _saveSupabase() {
    if (typeof SupabaseBridge === 'undefined' || !SupabaseBridge.getClient()) {
      return this.save();
    }
    /* الحفظ التفصيلي يتم عند كل عملية (insertSale / upsertProduct). */
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        products: state.products,
        expenses: state.expenses,
        sales: state.sales,
        returns: state.returns,
        inventoryTransactions: state.inventoryTransactions,
        activityLog: state.activityLog,
        systemUsers: state.systemUsers,
        settings: state.settings,
      })
    );
  },
};

// ═══════════════════════════════════════════════════════════════
//  Helpers
// ═══════════════════════════════════════════════════════════════

function t(k) {
  return TRANSLATIONS[currentLang][k] ?? TRANSLATIONS.ar[k] ?? k;
}

function reportCloudSaveError(action, result) {
  const detail = result?.error || 'Unknown error';
  console.error(`[Supabase] ${action}:`, detail);
  showToast(`${action}: ${detail}`, 'error');
}

/** Verified Supabase `public.sales` columns — inserts must use only these keys */
const SALES_TABLE_COLUMNS = [
  'id',
  'created_at',
  'customer_name',
  'product_name',
  'price',
  'quantity',
  'created_by',
  'updated_at',
  'customer',
  'invoice_number',
  'line_total_aud',
  'batch_id',
  'status',
  'tenant_id',
];

function pickSalesInsertColumns(row) {
  const out = {};
  SALES_TABLE_COLUMNS.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(row, key) && row[key] !== undefined) {
      out[key] = row[key];
    }
  });
  return out;
}

/** Coerce values for Postgres integer columns (id, quantity, batch_id) */
function coerceSalesIntegerField(value, fallback = undefined) {
  if (value == null || value === '') return fallback;
  if (typeof value === 'number' && Number.isFinite(value)) return Math.trunc(value);
  const s = String(value).trim();
  if (/^\d+$/.test(s)) return parseInt(s, 10);
  return fallback;
}

/** Local uid() strings cannot be inserted into integer id — use numeric id for Supabase */
function salesInsertId(localId) {
  const parsed = coerceSalesIntegerField(localId);
  if (parsed != null) return parsed;
  return Date.now() + Math.floor(Math.random() * 1000);
}

function salesInsertBatchId(localBatchId) {
  const parsed = coerceSalesIntegerField(localBatchId);
  if (parsed != null) return parsed;
  return Date.now();
}

/** Build a Supabase `sales` row using verified column names only */
function buildSalesInsertRow({
  id,
  createdAt,
  customerName,
  productName,
  price,
  quantity,
  createdBy,
  invoiceNumber,
  lineTotalAud,
  batchId,
  status,
  tenantId,
}) {
  const ts = createdAt || new Date().toISOString();
  const customer = (customerName || '').trim() || 'POS Guest';
  const qty = coerceSalesIntegerField(quantity, 1);
  const row = {
    id: salesInsertId(id),
    created_at: ts,
    updated_at: ts,
    customer_name: customer,
    customer,
    product_name: productName || '',
    price: CurrencyEngine.round(Number(price) || 0),
    quantity: Math.max(1, qty ?? 1),
    created_by: createdBy || 'guest',
    invoice_number: invoiceNumber || '',
    line_total_aud: CurrencyEngine.round(Number(lineTotalAud) || 0),
    status: status || 'completed',
  };
  const batchIdInt = coerceSalesIntegerField(batchId);
  if (batchIdInt != null) row.batch_id = batchIdInt;
  if (tenantId) row.tenant_id = String(tenantId);
  return pickSalesInsertColumns(row);
}

/** Force tenant_id on a sales insert payload immediately before Supabase insert */
function tagSalesInsertWithTenant(row, tenantId) {
  if (!tenantId) return row;
  return pickSalesInsertColumns({
    ...row,
    tenant_id: String(tenantId),
  });
}

/** Tenant id persisted at login (profiles → localStorage current_tenant_id) */
function getCurrentTenantIdForInsert() {
  try {
    const tid = localStorage.getItem(CURRENT_TENANT_KEY);
    if (tid && String(tid).trim()) return String(tid).trim();
  } catch (e) {
    console.warn('[Tenant] localStorage read failed:', e);
  }
  return null;
}

function requireCurrentTenantIdForSale() {
  const tenantId = getCurrentTenantIdForInsert();
  if (tenantId) return tenantId;
  console.error('Critical Security Error: No Tenant ID found!');
  const message = 'خطأ في الجلسة: يرجى تسجيل الدخول مجدداً.';
  alert(message);
  showToast(message, 'error');
  throw new Error(message);
}

/**
 * Global Secure Insert with AI Hook (delegates to SupabaseBridge).
 * @returns {Promise<object|null>} inserted row or null on auth failure
 */
async function secureInsert(table, data) {
  if (typeof SupabaseBridge === 'undefined' || !SupabaseBridge.getClient()) {
    console.error('Supabase Error: client not available');
    return null;
  }
  const result = await SupabaseBridge.secureInsert(table, data);
  if (!result.ok) {
    if (result.error === 'No tenant_id') return null;
    throw new Error(result.error || 'secureInsert failed');
  }
  return result.data;
}

/** Attach created_by + timestamptz fields for local state and Supabase rows */
function withRecordTimestamps(record, { isNew = false } = {}) {
  const now = new Date().toISOString();
  const audit = UserSession.auditFields();
  if (isNew) {
    return {
      ...record,
      ...audit,
      createdAt: record.createdAt || now,
      updatedAt: now,
    };
  }
  return {
    ...record,
    createdAt: record.createdAt,
    createdBy: record.createdBy ?? audit.createdBy,
    updatedAt: now,
  };
}

function uid() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function getProduct(id) {
  return state.products.find((p) => p.id === id);
}

const NUM_LOCALE = 'en-US';

function formatNum(n, { minimumFractionDigits = 0, maximumFractionDigits = 2 } = {}) {
  const v = CurrencyEngine.round(parseFloat(n) || 0);
  return v.toLocaleString(NUM_LOCALE, { minimumFractionDigits, maximumFractionDigits });
}

function formatSAR(n) {
  return `${formatNum(n, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR`;
}

function formatAUD(n) {
  return `${formatNum(n, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AUD`;
}

function purgeStorageForLoginPage() {
  if (localStorage.getItem(SIMPLE_AUTH_KEY) === 'true') return;
  localStorage.clear();
}

function resetAuthLoginFields() {
  const user = document.getElementById('auth-login-username');
  const pass = document.getElementById('auth-login-password');
  if (user) {
    user.removeAttribute('readonly');
    user.removeAttribute('disabled');
    user.disabled = false;
    user.setAttribute('autocomplete', 'off');
    user.style.pointerEvents = 'auto';
  }
  if (pass) {
    pass.removeAttribute('readonly');
    pass.removeAttribute('disabled');
    pass.disabled = false;
    pass.setAttribute('autocomplete', 'new-password');
    pass.style.pointerEvents = 'auto';
  }
}

function dismissAppOverlays() {
  document.getElementById('user-menu-dropdown')?.setAttribute('hidden', '');
  document.body.classList.remove('user-modal-open');

  const fabMenu = document.getElementById('fab-menu');
  const fabToggle = document.getElementById('fab-toggle');
  if (fabMenu) fabMenu.hidden = true;
  if (fabToggle) fabToggle.setAttribute('aria-expanded', 'false');

  document.getElementById('pos-drawer')?.classList.remove('pos-drawer--open');
  document.querySelectorAll('.pos-drawer-backdrop--show').forEach((el) => {
    el.classList.remove('pos-drawer-backdrop--show');
  });

  document.querySelectorAll(
    '.pos-modal, .invoice-ocr-modal, .sip-modal, .user-modal, #pos-payment-modal, #pos-line-edit-modal, #pos-discount-modal'
  ).forEach((el) => {
    el.hidden = true;
  });

  if (typeof PosUI !== 'undefined') {
    PosUI.closeLineEdit?.();
    PosUI.closeLineDiscount?.();
    PosUI.closePaymentModal?.();
  }
}

function enforceAutocompleteOff(root = document) {
  root.querySelectorAll('form').forEach((f) => {
    if (f.id === 'auth-login-form') return;
    f.setAttribute('autocomplete', 'off');
    f.setAttribute('data-form-type', 'other');
  });
  root.querySelectorAll('input, select, textarea').forEach((el) => {
    if (el.type === 'hidden' || el.type === 'file') return;
    if (el.id === 'auth-login-username' || el.id === 'auth-login-password') return;
    if (el.closest('#auth-overlay')) return;
    el.setAttribute('autocomplete', 'off');
  });
}

function parseAppTimestamp(value) {
  if (typeof SupabaseBridge !== 'undefined' && SupabaseBridge.timestamptzFromDb) {
    return SupabaseBridge.timestamptzFromDb(value);
  }
  if (value == null || value === '') return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function formatDate(iso) {
  const normalized = parseAppTimestamp(iso);
  if (!normalized) return '—';
  const loc = currentLang === 'ar' ? 'ar-SA' : 'en-AU';
  return new Date(normalized).toLocaleDateString(loc, { year: 'numeric', month: 'short', day: 'numeric' });
}

function catLabel(id) {
  const c = EXPENSE_CATEGORIES.find((x) => x.id === id);
  return c ? t(c.key) : id;
}

const EXCEL_ICON = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zM8 13h2v2H8v-2zm0-4h2v2H8V9zm4 4h6v2h-6v-2zm0-4h6v2h-6V9z"/></svg>`;

function exportFullBtn() {
  return `<button type="button" class="btn btn--excel btn--export-full" data-export="full">${EXCEL_ICON}${t('exportFull')}</button>`;
}

// ═══════════════════════════════════════════════════════════════
//  Excel Export — SheetJS
// ═══════════════════════════════════════════════════════════════

const ExcelExport = {
  fileDate() {
    return new Date().toISOString().slice(0, 10);
  },

  /** ورقة المبيعات — كافة التفاصيل */
  sheetSales() {
    const headers = [
      t('date'), t('code'), t('product'), t('qty'),
      `${t('priceAud')} / ${t('unitAmount')}`, t('costAud'), t('revenueAud'), t('profitAud'),
      t('customer'), t('payment'), t('saleSource'), t('notes'),
    ];
    const rows = state.sales.map((s) => {
      const c = CurrencyEngine.calcSale(s);
      return [
        formatDate(s.createdAt),
        s.productCode,
        s.productName,
        s.quantity,
        s.unitPriceAud,
        c.cost,
        c.revenue,
        c.profit,
        s.customer,
        s.payment,
        saleSourceLabel(s.saleSource),
        s.notes || '',
      ];
    });
    const totalRev = state.sales.reduce((sum, s) => sum + CurrencyEngine.calcSale(s).revenue, 0);
    const totalProfit = state.sales.reduce((sum, s) => sum + CurrencyEngine.calcSale(s).profit, 0);
    rows.push([]);
    rows.push([t('total'), '', '', '', '', '', totalRev, totalProfit, '', '', '', '']);
    return [headers, ...rows];
  },

  /** ورقة المصروفات — مع الفئات ومجاميعها */
  sheetExpenses() {
    const headers = [
      t('date'), t('expenseName'), t('category'), t('currency'),
      t('originalAmount'), t('exchangeRate'), t('audValue'), t('vat'), t('totalAud'),
    ];
    const rows = [];
    const byCategory = {};

    state.expenses.forEach((e) => {
      const f = e.financials || {};
      const cat = catLabel(e.category);
      if (!byCategory[e.category]) byCategory[e.category] = { label: cat, items: [], total: 0 };
      byCategory[e.category].items.push(e);
      byCategory[e.category].total += f.audTotal || 0;
    });

    EXPENSE_CATEGORIES.forEach((cat) => {
      const group = byCategory[cat.id];
      if (!group || !group.items.length) return;

      rows.push([`── ${group.label} ──`, '', '', '', '', '', '', '', '']);
      group.items.forEach((e) => {
        const f = e.financials || {};
        rows.push([
          formatDate(e.createdAt), e.name, group.label, e.currency,
          e.amountOriginal, e.exchangeRate, f.audBeforeVat, f.vat, f.audTotal,
        ]);
      });
      rows.push([t('categorySubtotal'), '', group.label, '', '', '', '', '', group.total]);
      rows.push([]);
    });

    const grandTotal = state.expenses.reduce((s, e) => s + (e.financials?.audTotal || 0), 0);
    rows.push([t('totalAud'), '', '', '', '', '', '', '', grandTotal]);
    return [headers, ...rows];
  },

  /** ورقة المخزون — الحالة الحالية + تنبؤ الأيام */
  sheetInventory() {
    const threshold = APP_CONFIG.stockAlertThreshold;
    const forecastCol = t('daysLeftForecast');
    const headerRow = [
      t('code'), t('name'), t('size'), t('color'),
      t('costAud'), t('priceAud'), t('qty'), t('status'), forecastCol,
    ];

    const rows = state.products.map((p) => {
      const st = p.quantity <= 0 ? t('out') : p.quantity < threshold ? t('low') : t('available');
      const fc = DemandForecastEngine.productForecast(p);
      const daysText = fc.hasData && fc.daysLeft !== null ? fc.daysLeft : '—';
      return [p.code, p.name, p.size, p.color, p.cost, p.price, p.quantity, st, daysText];
    });

    return [headerRow, ...rows];
  },

  /** ورقة ملخص الأداء — التحليلات والأرباح */
  sheetSummary() {
    const rev = AnalyticsEngine.totalRevenueAUD();
    const costs = AnalyticsEngine.totalCostOfSalesAUD();
    const expenses = AnalyticsEngine.totalExpensesAUD();
    const profit = AnalyticsEngine.netProfitAUD();
    const dist = AnalyticsEngine.costDistribution();
    const turnover = AnalyticsEngine.inventoryTurnover();
    const forecast = AnalyticsEngine.profitForecast();
    const alerts = AnalyticsEngine.lowStockAlerts();
    const avgDaily = DemandForecastEngine.avgDailySales();

    return [
      [t('exportBrand'), 'Prestige Abaya'],
      [t('exportGenerated'), new Date().toLocaleString(currentLang === 'ar' ? 'ar-SA' : 'en-AU')],
      [],
      [t('sheetSummary'), ''],
      [t('profitAud'), profit],
      [t('revenueAud'), rev],
      [t('expensesAud'), expenses],
      [t('costOfSales'), costs],
      [`${t('profitAud')} %`, rev > 0 ? CurrencyEngine.round((profit / rev) * 100) : 0],
      [],
      [t('inventoryTurnover'), `${turnover.rate}×`],
      [t('unitsSold'), turnover.unitsSold],
      [t('invValue'), turnover.invValue],
      [],
      [t('abayaShare'), `${dist.abayasPct}%`],
      [t('shippingShare'), `${dist.shippingPct}%`],
      [t('catImport'), dist.abayas],
      [t('catIntl'), dist.shipping],
      [],
      [t('totalProducts'), state.products.length],
      [t('totalStock'), state.products.reduce((s, p) => s + p.quantity, 0)],
      [t('totalSales'), state.sales.length],
      [t('stockAlerts'), alerts.length],
      [],
      [t('forecastNote'), forecast.projectedMonthly],
      [currentLang === 'ar' ? 'متوسط المبيعات اليومي' : 'Avg daily sales', avgDaily],
    ];
  },

  /** ملف Excel واحد — 4 أوراق عمل */
  exportFull() {
    if (typeof XLSX === 'undefined') {
      showToast('SheetJS loading...', 'error');
      return false;
    }

    const wb = XLSX.utils.book_new();
    const sheets = [
      { name: 'المبيعات', rows: this.sheetSales() },
      { name: 'المصروفات', rows: this.sheetExpenses() },
      { name: 'المخزون', rows: this.sheetInventory() },
      { name: 'ملخص الأداء', rows: this.sheetSummary() },
    ];

    sheets.forEach(({ name, rows }) => {
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
    });

    XLSX.writeFile(wb, 'Prestige_Abaya_Data.xlsx');
    showToast(t('exported'));
    return true;
  },
};

const CHART_ANIMATION = {
  duration: 1200,
  easing: 'easeOutQuart',
};

const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: true,
  animation: CHART_ANIMATION,
  plugins: {
    legend: {
      labels: { font: { family: 'Tajawal', size: 13, weight: '600' }, padding: 16 },
    },
    tooltip: {
      backgroundColor: '#2c3345',
      titleFont: { family: 'Tajawal', size: 14 },
      bodyFont: { family: 'Tajawal', size: 13 },
      padding: 12,
      cornerRadius: 10,
    },
  },
};

function showToast(msg, type = 'success', durationMs = 2800) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.className = `toast toast--show${type === 'error' ? ' toast--error' : ''}`;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => el.classList.remove('toast--show'), durationMs);
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ═══════════════════════════════════════════════════════════════
//  Smart seasonal mode · Inventory profitability (live)
// ═══════════════════════════════════════════════════════════════

const SmartSeasonalMode = {
  modes: ['normal', 'holiday', 'clearance'],

  factors() {
    return APP_CONFIG.seasonalFactors || { normal: 1, holiday: 1.15, clearance: 0.8 };
  },

  current() {
    const m = state.settings?.inventorySeasonalMode || 'normal';
    return this.modes.includes(m) ? m : 'normal';
  },

  factor(mode) {
    const f = this.factors()[mode ?? this.current()];
    return typeof f === 'number' && f > 0 ? f : 1;
  },

  label(mode = this.current()) {
    const keys = { normal: 'seasonNormal', holiday: 'seasonHoliday', clearance: 'seasonClearance' };
    return t(keys[mode] || keys.normal);
  },

  factorHint(mode = this.current()) {
    if (mode === 'holiday') return t('seasonFactorHoliday');
    if (mode === 'clearance') return t('seasonFactorClearance');
    return '';
  },

  adjustedPrice(basePrice, mode = this.current()) {
    return CurrencyEngine.round((parseFloat(basePrice) || 0) * this.factor(mode));
  },

  async setMode(mode) {
    if (!this.modes.includes(mode)) mode = 'normal';
    state.settings.inventorySeasonalMode = mode;
    await DataStore.save();
    return mode;
  },

  toastMessage(mode) {
    return t('seasonModeApplied').replace('{mode}', this.label(mode));
  },
};

const InventoryProfitabilityEngine = {
  minMarginPct() {
    const s = parseFloat(state.settings?.minProfitMarginPct);
    return !Number.isNaN(s) && s > 0 ? s : (APP_CONFIG.minProfitMarginPct ?? 20);
  },

  effectiveSalePrice(p) {
    const basePrice = parseFloat(p?.price) || 0;
    const mode = SmartSeasonalMode.current();
    if (mode === 'normal') return CurrencyEngine.round(basePrice);
    return SmartSeasonalMode.adjustedPrice(basePrice, mode);
  },

  calcRow(p) {
    const cost = parseFloat(p?.cost) || 0;
    const basePrice = parseFloat(p?.price) || 0;
    const price = this.effectiveSalePrice(p);
    const qty = Math.max(0, parseInt(p?.quantity, 10) || 0);
    const unitProfit = CurrencyEngine.round(price - cost);
    const lineProfit = CurrencyEngine.round(unitProfit * qty);
    const purchaseValue = CurrencyEngine.round(cost * qty);
    const expectedRevenue = CurrencyEngine.round(price * qty);
    const marginPct = price > 0 ? CurrencyEngine.round((unitProfit / price) * 100) : 0;
    const lowMargin = price <= cost || marginPct < this.minMarginPct();
    const mode = SmartSeasonalMode.current();
    return {
      cost,
      basePrice,
      price,
      qty,
      unitProfit,
      lineProfit,
      purchaseValue,
      expectedRevenue,
      marginPct,
      lowMargin,
      seasonalMode: mode,
      seasonalAdjusted: mode !== 'normal',
      seasonalFactor: SmartSeasonalMode.factor(mode),
    };
  },

  calcTotals(products = state.products) {
    return (products || []).reduce((acc, p) => {
      const r = this.calcRow(p);
      acc.totalPurchase += r.purchaseValue;
      acc.totalProfit += r.lineProfit;
      acc.totalRevenue += r.expectedRevenue;
      acc.totalQty += r.qty;
      if (r.lowMargin) acc.lowMarginCount += 1;
      return acc;
    }, {
      totalPurchase: 0,
      totalProfit: 0,
      totalRevenue: 0,
      totalQty: 0,
      lowMarginCount: 0,
    });
  },

  profitCellClass(lowMargin) {
    return lowMargin ? 'inv-profit-cell inv-profit-cell--low' : 'inv-profit-cell';
  },
};

function renderInventorySeasonalBar() {
  const bar = document.getElementById('inv-seasonal-bar');
  if (!bar) return;
  const mode = SmartSeasonalMode.current();
  bar.dataset.seasonalMode = mode;
  bar.classList.toggle('seasonal-mode-bar--holiday', mode === 'holiday');
  bar.classList.toggle('seasonal-mode-bar--clearance', mode === 'clearance');
  bar.querySelectorAll('[data-seasonal-mode]').forEach((btn) => {
    const active = btn.dataset.seasonalMode === mode;
    btn.classList.toggle('seasonal-mode-toggle__btn--active', active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
  const hint = document.getElementById('inv-seasonal-hint');
  if (hint) hint.textContent = SmartSeasonalMode.factorHint(mode);
}

function flashSeasonalValues() {
  const sel = [
    '#inv-profit-stats .stat-card__value',
    '[data-inv-unit-profit]',
    '[data-inv-line-profit]',
    '.inv-tfoot-num strong',
    '.inv-seasonal-adj-price',
  ].join(',');
  document.querySelectorAll(sel).forEach((el) => {
    el.classList.remove('inv-seasonal-flash');
    void el.offsetWidth;
    el.classList.add('inv-seasonal-flash');
    el.addEventListener('animationend', () => el.classList.remove('inv-seasonal-flash'), { once: true });
  });
}

async function applyInventorySeasonalMode(mode) {
  if (!SmartSeasonalMode.modes.includes(mode) || mode === SmartSeasonalMode.current()) return;
  await SmartSeasonalMode.setMode(mode);
  renderInventorySeasonalBar();
  renderInventoryTable(document.getElementById('inv-search')?.value || '');
  flashSeasonalValues();
  showToast(SmartSeasonalMode.toastMessage(mode), 'success', 3200);
}

function invSeasonalPriceCellHtml(p, m) {
  const factorHint = m.seasonalAdjusted ? SmartSeasonalMode.factorHint() : '';
  const adjBlock = m.seasonalAdjusted
    ? `<span class="inv-seasonal-adj-price" data-inv-seasonal-price title="${t('seasonAdjustedPrice')}">${formatAUD(m.price)}</span>
       <small class="inv-seasonal-factor">${escapeHtml(factorHint)}</small>`
    : '';
  return `
    <input type="number" class="inv-price-input" data-inv-price-input="${p.id}"
      min="0" step="0.01" value="${m.basePrice}" title="${t('seasonBasePrice')}"
      aria-label="${t('invSuggestedSalePrice')}">
    ${adjBlock}`;
}

function renderInventoryProfitStats(products = state.products) {
  const el = document.getElementById('inv-profit-stats');
  if (!el) return;
  const t0 = InventoryProfitabilityEngine.calcTotals(products);
  const pct = InventoryProfitabilityEngine.minMarginPct();
  const mode = SmartSeasonalMode.current();
  const modeTag = mode !== 'normal'
    ? ` <span class="inv-stats-mode-tag inv-stats-mode-tag--${mode}">${SmartSeasonalMode.label(mode)}</span>`
    : '';
  el.innerHTML = [
    { l: t('invTotalPurchaseValue'), v: formatAUD(t0.totalPurchase), c: 'stat-card--warning' },
    { l: `${t('invTotalExpectedProfit')}${modeTag}`, v: formatAUD(t0.totalProfit), c: 'stat-card--accent' },
    { l: `${t('invExpectedRevenue')}${modeTag}`, v: formatAUD(t0.totalRevenue), c: 'stat-card--success' },
    {
      l: t('invProfitMargin'),
      v: t0.lowMarginCount
        ? `${t0.lowMarginCount} ⚠`
        : `≥ ${pct}%`,
      c: t0.lowMarginCount ? 'stat-card--warning' : '',
    },
  ].map((i) => `<article class="stat-card ${i.c}"><span class="stat-card__label">${i.l}</span><strong class="stat-card__value">${i.v}</strong></article>`).join('');
}

function renderInventoryTableFooter(rows) {
  const tfoot = document.getElementById('inv-tfoot');
  if (!tfoot) return;
  const t0 = InventoryProfitabilityEngine.calcTotals(rows);
  tfoot.innerHTML = `
    <tr class="inv-tfoot-row">
      <td colspan="4"><strong>${t('invInventoryGrandTotal')}</strong></td>
      <td class="inv-tfoot-num"><strong>${formatAUD(t0.totalPurchase)}</strong><small>${t('costAud')}</small></td>
      <td class="inv-tfoot-num"><strong>${formatAUD(t0.totalRevenue)}</strong><small>${t('invExpectedRevenue')}</small></td>
      <td class="inv-tfoot-num"><strong>${t0.totalQty}</strong><small>${t('qty')}</small></td>
      <td></td>
      <td class="inv-tfoot-num inv-tfoot-num--profit"><strong>${formatAUD(t0.totalProfit)}</strong><small>${t('invTotalExpectedProfit')}</small></td>
      <td colspan="2"></td>
    </tr>`;
}

function syncInvProfitRow(tr, product) {
  if (!tr || !product) return;
  const m = InventoryProfitabilityEngine.calcRow(product);
  const unitEl = tr.querySelector('[data-inv-unit-profit]');
  const lineEl = tr.querySelector('[data-inv-line-profit]');
  const cls = InventoryProfitabilityEngine.profitCellClass(m.lowMargin);
  if (unitEl) {
    unitEl.textContent = formatAUD(m.unitProfit);
    unitEl.className = cls;
    unitEl.title = m.lowMargin
      ? t('invLowMarginHint').replace('{pct}', String(InventoryProfitabilityEngine.minMarginPct()))
      : `${m.marginPct}%`;
  }
  if (lineEl) {
    lineEl.textContent = formatAUD(m.lineProfit);
    lineEl.className = cls;
  }
  const costTd = tr.querySelector('[data-inv-cost-display]');
  if (costTd) costTd.textContent = formatAUD(m.cost);
  const adjEl = tr.querySelector('[data-inv-seasonal-price]');
  const factorEl = tr.querySelector('.inv-seasonal-factor');
  const priceCell = tr.querySelector('.inv-price-cell');
  if (priceCell) {
    const input = priceCell.querySelector('[data-inv-price-input]');
    if (input) input.value = m.basePrice;
    if (m.seasonalAdjusted) {
      if (adjEl) adjEl.textContent = formatAUD(m.price);
      else {
        const wrap = document.createElement('span');
        wrap.className = 'inv-seasonal-adj-price';
        wrap.dataset.invSeasonalPrice = '';
        wrap.title = t('seasonAdjustedPrice');
        wrap.textContent = formatAUD(m.price);
        priceCell.appendChild(wrap);
      }
      if (factorEl) factorEl.textContent = SmartSeasonalMode.factorHint();
      else {
        const sm = document.createElement('small');
        sm.className = 'inv-seasonal-factor';
        sm.textContent = SmartSeasonalMode.factorHint();
        priceCell.appendChild(sm);
      }
      priceCell.classList.add('inv-price-cell--seasonal');
    } else {
      adjEl?.remove();
      factorEl?.remove();
      priceCell.classList.remove('inv-price-cell--seasonal');
    }
  }
}

function refreshInventoryProfitabilityUI(filterQuery = '') {
  renderInventoryProfitStats(state.products);
  const q = (filterQuery || document.getElementById('inv-search')?.value || '').toLowerCase();
  const list = state.products.filter((p) => !q || p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q));
  renderInventoryTableFooter(list);
}

async function persistInvInlinePrice(productId, price) {
  const p = getProduct(productId);
  if (!p) return;
  const next = CurrencyEngine.round(price);
  if (Number.isNaN(next) || next < 0) return;
  if (p.price === next) return;
  p.price = next;
  await DataStore.save();
  PosEngine.warmCache();
  populateSaleSelect();
}

// ═══════════════════════════════════════════════════════════════
//  CRUD
// ═══════════════════════════════════════════════════════════════

async function saveProduct(data) {
  if (!UserSession.requireUser()) return;
  if (state.products.some((p) => p.code === data.code && p.id !== data.id)) {
    showToast('Code exists', 'error');
    return;
  }

  let product;
  if (data.id) {
    const existing = state.products.find((p) => p.id === data.id);
    if (!existing) return;
    product = withRecordTimestamps({ ...existing, ...data }, { isNew: false });
  } else {
    product = withRecordTimestamps(
      { ...data, id: uid() },
      { isNew: true }
    );
  }

  const cloud = await DataStore.cloudUpsertProduct(product);
  if (DataStore.usesCloud() && !cloud.ok) {
    reportCloudSaveError('Product save', cloud);
    return;
  }

  if (data.id) {
    const i = state.products.findIndex((p) => p.id === data.id);
    if (i >= 0) state.products[i] = product;
  } else {
    state.products.push(product);
  }
  await DataStore.save();
  ActivityFeed.log({
    type: data.id ? 'product_update' : 'product_add',
    amountAud: CurrencyEngine.round((parseFloat(data.cost) || 0) * (parseInt(data.quantity, 10) || 0)),
    label: data.name || data.code,
  });
  showToast(t('saved'));
  renderAll();
}

async function deleteProduct(id) {
  if (state.sales.some((s) => s.productId === id)) {
    showToast('Has sales', 'error');
    return;
  }
  state.products = state.products.filter((p) => p.id !== id);
  await DataStore.save();
  showToast(t('deleted'));
  renderAll();
}

/** سجل حركة مخزون — فاتورة مورد / استيراد */
function logInventoryTransaction(entry) {
  if (!state.inventoryTransactions) state.inventoryTransactions = [];
  state.inventoryTransactions.unshift({
    id: uid(),
    type: entry.type || 'invoice_import',
    productId: entry.productId || null,
    productName: entry.productName || '',
    productCode: entry.productCode || '',
    invoiceNumber: entry.invoiceNumber || '',
    processedAt: entry.processedAt || new Date().toISOString(),
    costAud: CurrencyEngine.round(entry.costAud ?? entry.unitCostAud ?? 0),
    unitCostAud: entry.unitCostAud != null ? CurrencyEngine.round(entry.unitCostAud) : null,
    exchangeRate: CurrencyEngine.round(entry.exchangeRate ?? 0),
    qtyAdded: parseInt(entry.qtyAdded, 10) || 0,
    qtyBefore: parseInt(entry.qtyBefore, 10) || 0,
    qtyAfter: parseInt(entry.qtyAfter, 10) || 0,
    costBefore: entry.costBefore != null ? CurrencyEngine.round(entry.costBefore) : null,
    costAfter: entry.costAfter != null ? CurrencyEngine.round(entry.costAfter) : null,
    lineAud: entry.lineAud != null ? CurrencyEngine.round(entry.lineAud) : null,
    createdBy: entry.createdBy || UserSession.createdBy(),
  });
  state.inventoryTransactions = state.inventoryTransactions.slice(0, 500);
}

/**
 * تحقق قبل الحفظ — سعر الصرف + صفوف المراجعة (قيم مُعدّلة يدوياً)
 */
function validateReviewedInvoiceForSave(rows, exchangeRate) {
  const errors = [];
  const rate = parseFloat(exchangeRate);
  if (Number.isNaN(rate) || rate <= 0) errors.push(t('invValidateFxMissing'));

  const list = (rows || []).filter((r) => (r.name || '').trim());
  if (!list.length) errors.push(t('invValidateEmptyRows'));

  list.forEach((row, index) => {
    const label = `${row.name || `${t('iipItemName')} ${index + 1}`}`;
    const qty = parseInt(row.qty, 10);
    const costAud = parseFloat(row.costAud ?? row.unitAud);
    if (!row.name?.trim()) errors.push(`${t('invValidateRowName')} (${index + 1})`);
    if (!qty || qty < 1) errors.push(`${label}: ${t('invValidateRowQty')}`);
    if (Number.isNaN(costAud) || costAud <= 0) errors.push(`${label}: ${t('invValidateRowCost')}`);
  });

  const validRows = list.filter((r) => {
    const qty = parseInt(r.qty, 10);
    const costAud = parseFloat(r.costAud ?? r.unitAud);
    return r.name?.trim() && qty >= 1 && costAud > 0;
  });

  return { ok: errors.length === 0, errors, validRows };
}

/** تحديث منتج واحد في المخزون من صف المراجعة (ليس OCR خام) */
function integrateReviewRowInventory(row, meta, usedCodes) {
  const invoiceNumber = (meta.invoiceNumber || '').trim();
  const exchangeRate = parseFloat(meta.exchangeRate) > 0 ? parseFloat(meta.exchangeRate) : 0.4;
  const processedAt = meta.processedAt || new Date().toISOString();
  const importNote = invoiceNumber
    ? (currentLang === 'ar' ? `فاتورة مورد: ${invoiceNumber}` : `Supplier invoice: ${invoiceNumber}`)
    : '';

  const name = (row.name || '').trim();
  const size = String(row.size || '56');
  const color = (row.color || '').trim() || (currentLang === 'ar' ? 'مستورد' : 'Import');
  const qty = parseInt(row.qty, 10);
  const cost = parseFloat(row.costAud ?? row.unitAud ?? row.cost);
  const price = parseFloat(row.price);
  const lineAud = CurrencyEngine.round(row.lineAudIncVat ?? cost * qty);

  let code = (row.code || '').trim();
  let target = row.mappedProductId ? getProduct(row.mappedProductId) : null;
  if (!target) target = InvoiceOcrEngine.findProductByName(name);
  if (target && String(target.size) !== size) {
    target = state.products.find((p) => p.id === target.id && String(p.size) === size)
      || state.products.find((p) =>
        InvoiceOcrEngine.normalizeName(p.name) === InvoiceOcrEngine.normalizeName(name)
        && String(p.size) === size);
  }

  if (target) {
    const prevQty = parseInt(target.quantity, 10) || 0;
    const costBefore = parseFloat(target.cost) || 0;
    const costAfter = weightedAverageCost(prevQty, costBefore, qty, cost);
    target.cost = costAfter;
    target.quantity = prevQty + qty;
    target.price = CurrencyEngine.round(price);
    if (row.style) target.style = row.style;
    if (importNote) target.importInvoiceRef = importNote;

    return {
      ok: true,
      action: 'updated',
      productId: target.id,
      productName: target.name,
      productCode: target.code,
      invoiceNumber,
      processedAt,
      exchangeRate,
      unitCostAud: cost,
      costAud: costAfter,
      costBefore,
      costAfter,
      qtyAdded: qty,
      qtyBefore: prevQty,
      qtyAfter: target.quantity,
      lineAud,
    };
  }

  if (!code) code = InvoiceOcrEngine.generateCode(name, usedCodes.size, usedCodes);
  if (state.products.some((p) => p.code === code && String(p.size) !== size)) {
    return { ok: false, error: 'code', row: code };
  }

  const newId = uid();
  const newCost = CurrencyEngine.round(cost);
  state.products.push({
    id: newId,
    code,
    name,
    size,
    color,
    style: row.style || 'classic',
    cost: newCost,
    price: CurrencyEngine.round(price),
    quantity: qty,
    image: row.image || null,
    importInvoiceRef: importNote || null,
    createdAt: processedAt,
    ...UserSession.auditFields(),
  });
  usedCodes.add(code);

  return {
    ok: true,
    action: 'added',
    productId: newId,
    productName: name,
    productCode: code,
    invoiceNumber,
    processedAt,
    exchangeRate,
    unitCostAud: cost,
    costAud: newCost,
    costBefore: null,
    costAfter: newCost,
    qtyAdded: qty,
    qtyBefore: 0,
    qtyAfter: qty,
    lineAud,
  };
}

/** تسجيل حركة مخزون لصف مراجعة (سعر الصرف لحظة الحفظ) */
function integrateReviewRowTransaction(invResult) {
  if (!invResult?.ok) return;
  logInventoryTransaction({
    productId: invResult.productId,
    productName: invResult.productName,
    productCode: invResult.productCode,
    invoiceNumber: invResult.invoiceNumber,
    processedAt: invResult.processedAt,
    unitCostAud: invResult.unitCostAud,
    costAud: invResult.costAud,
    exchangeRate: invResult.exchangeRate,
    qtyAdded: invResult.qtyAdded,
    qtyBefore: invResult.qtyBefore,
    qtyAfter: invResult.qtyAfter,
    costBefore: invResult.costBefore,
    costAfter: invResult.costAfter,
    lineAud: invResult.lineAud,
  });
}

/**
 * الربط اللحظي الشامل — تحديث المخزون ثم تسجيل الحركات (متوازي لكل صف)
 * يستخدم صفوف المراجعة بعد التعديل اليدوي فقط (source: review_table)
 */
async function realTimeIntegrateReviewedInvoice(reviewedRows, meta = {}) {
  const rows = (reviewedRows || []).filter((r) => r.source === 'review_table' || r.fromReviewTable === true);
  const usedCodes = new Set(state.products.map((p) => p.code));
  let added = 0;
  let updated = 0;
  const inventoryResults = [];

  for (const row of rows) {
    const inv = integrateReviewRowInventory(row, meta, usedCodes);
    if (!inv.ok) return inv;
    if (inv.action === 'added') added += 1;
    else updated += 1;
    inventoryResults.push(inv);
  }

  await Promise.all(
    inventoryResults.map((inv) => Promise.resolve(integrateReviewRowTransaction(inv)))
  );

  if (DataStore.usesCloud()) {
    for (const inv of inventoryResults) {
      const p = getProduct(inv.productId);
      if (!p) continue;
      const cloud = await DataStore.cloudUpsertProduct(p);
      if (!cloud.ok) {
        reportCloudSaveError('Invoice product', cloud);
        return { ok: false, error: cloud.error };
      }
    }
  }

  await DataStore.save();
  PosEngine.warmCache();
  return {
    ok: true,
    added,
    updated,
    processedAt: meta.processedAt,
    exchangeRate: meta.exchangeRate,
    invoiceNumber: meta.invoiceNumber,
  };
}

/** حفظ التكلفة — يمر عبر الربط اللحظي */
async function updateInventoryCostFromInvoice(rows, meta = {}) {
  const tagged = (rows || []).map((r) => ({ ...r, source: 'review_table', fromReviewTable: true }));
  return realTimeIntegrateReviewedInvoice(tagged, meta);
}

async function saveProductsFromInvoiceBatch(rows, meta) {
  return updateInventoryCostFromInvoice(rows, meta);
}

// ═══════════════════════════════════════════════════════════════
//  International AI Invoice Processor — OCR · Financials · UI · Save
// ═══════════════════════════════════════════════════════════════

/**
 * حسابات الفاتورة المركزية — صف واحد + إجماليات الفاتورة
 */
const InvoiceFinancialEngine = {
  vatRate() {
    return state.settings.vatRate ?? APP_CONFIG.vatRate ?? 0.15;
  },

  /**
   * حساب مالي لصنف واحد: إجمالي السطر، ضريبة 15%، إجمالي مع الضريبة، تحويل AUD
   * @param {Object} input — qty, unitExVat, lineExVat?, lineIncVat?, vatAmount?, exchangeRate
   */
  calculateFinancials(input = {}) {
    const qty = Math.max(1, parseInt(input.qty, 10) || 1);
    const rate = parseFloat(input.exchangeRate) > 0 ? parseFloat(input.exchangeRate) : 0.4;
    const vatR = input.vatRate ?? this.vatRate();
    const editField = input._editField || null;

    let unitExVat = CurrencyEngine.round(parseFloat(input.unitExVat) || 0);
    let lineExVat = parseFloat(input.lineExVat);
    let lineIncVat = parseFloat(input.lineIncVat);
    let vatAmount = parseFloat(input.vatAmount);

    if (editField === 'lineIncVat' && lineIncVat > 0) {
      lineExVat = CurrencyEngine.round(lineIncVat / (1 + vatR));
      vatAmount = CurrencyEngine.round(lineIncVat - lineExVat);
      unitExVat = qty > 0 ? CurrencyEngine.round(lineExVat / qty) : unitExVat;
    } else if (editField === 'lineExVat' && lineExVat > 0) {
      vatAmount = CurrencyEngine.round(lineExVat * vatR);
      lineIncVat = CurrencyEngine.round(lineExVat + vatAmount);
      unitExVat = qty > 0 ? CurrencyEngine.round(lineExVat / qty) : unitExVat;
    } else if (editField === 'vatAmount' && vatAmount >= 0 && lineExVat > 0) {
      lineIncVat = CurrencyEngine.round(lineExVat + vatAmount);
    } else if (editField === 'costAud') {
      const costAud = parseFloat(input.costAud) || 0;
      const lineAud = CurrencyEngine.round(costAud * qty);
      lineIncVat = rate > 0 ? CurrencyEngine.round(lineAud / rate) : lineIncVat;
      lineExVat = CurrencyEngine.round(lineIncVat / (1 + vatR));
      vatAmount = CurrencyEngine.round(lineIncVat - lineExVat);
      unitExVat = qty > 0 ? CurrencyEngine.round(lineExVat / qty) : unitExVat;
    } else {
      lineExVat = CurrencyEngine.round(unitExVat * qty);
      vatAmount = CurrencyEngine.round(lineExVat * vatR);
      lineIncVat = CurrencyEngine.round(lineExVat + vatAmount);
    }

    const lineAudIncVat = CurrencyEngine.round(lineIncVat * rate);
    const unitAud = qty > 0 ? CurrencyEngine.round(lineAudIncVat / qty) : 0;

    return {
      qty,
      unitExVat,
      lineExVat: CurrencyEngine.round(lineExVat),
      vatAmount: CurrencyEngine.round(vatAmount),
      lineIncVat: CurrencyEngine.round(lineIncVat),
      exchangeRate: rate,
      lineAudIncVat,
      lineAudExVat: CurrencyEngine.round(lineExVat * rate),
      unitAud,
      costAud: unitAud,
      currency: 'SAR',
      applyVat: true,
    };
  },

  /** إجماليات الفاتورة: مجموع SAR، تحويل AUD */
  calculateInvoiceTotals(lines = [], exchangeRate) {
    const rate = parseFloat(exchangeRate) > 0 ? parseFloat(exchangeRate) : 0.4;
    const calculated = lines.map((line) => this.calculateFinancials({ ...line, exchangeRate: rate }));
    const totalSar = CurrencyEngine.round(
      calculated.reduce((sum, l) => sum + (l.lineIncVat || 0), 0)
    );
    const totalExVat = CurrencyEngine.round(
      calculated.reduce((sum, l) => sum + (l.lineExVat || 0), 0)
    );
    const totalVat = CurrencyEngine.round(
      calculated.reduce((sum, l) => sum + (l.vatAmount || 0), 0)
    );
    const totalAud = CurrencyEngine.round(totalSar * rate);
    const totalQty = calculated.reduce((sum, l) => sum + l.qty, 0);
    return {
      lines: calculated,
      totalSar,
      totalExVat,
      totalVat,
      totalAud,
      exchangeRate: rate,
      totalQty,
    };
  },

  /** توزيع المجموع النهائي AUD على الأصناف بنسبة مساهمة كل سطر */
  allocateFairCosts(lines, totals) {
    const list = lines.filter((r) => (r.name || '').trim());
    const totalSar = totals?.totalSar ?? CurrencyEngine.round(
      list.reduce((s, r) => s + (parseFloat(r.lineIncVat) || 0), 0)
    );
    const totalAud = totals?.totalAud ?? CurrencyEngine.round(totalSar * (totals?.exchangeRate || 0.4));
    if (totalSar <= 0 || totalAud <= 0) return list;

    let allocatedSum = 0;
    return list.map((row, index) => {
      const qty = Math.max(1, parseInt(row.qty, 10) || 1);
      const share = (parseFloat(row.lineIncVat) || 0) / totalSar;
      let lineAud = CurrencyEngine.round(totalAud * share);
      if (index === list.length - 1) lineAud = CurrencyEngine.round(totalAud - allocatedSum);
      else allocatedSum += lineAud;
      const costAud = qty > 0 ? CurrencyEngine.round(lineAud / qty) : 0;
      return { ...row, qty, lineAudIncVat: lineAud, costAud, unitAud: costAud };
    });
  },
};

function recordInvoiceFxHistory({ rate, invoiceNumber, totalSar, totalAud, itemCount }) {
  if (!state.settings.invoiceFxHistory) state.settings.invoiceFxHistory = [];
  state.settings.invoiceFxHistory.unshift({
    id: uid(),
    rate: CurrencyEngine.round(rate),
    invoiceNumber: invoiceNumber || '',
    totalSar: CurrencyEngine.round(totalSar),
    totalAud: CurrencyEngine.round(totalAud),
    itemCount: itemCount || 0,
    savedAt: new Date().toISOString(),
    createdBy: UserSession.createdBy(),
  });
  state.settings.invoiceFxHistory = state.settings.invoiceFxHistory.slice(0, 100);
  state.settings.sarToAudRate = CurrencyEngine.round(rate);
}

/**
 * متوسط التكلفة المرجّح (AUD):
 * (الكمية الحالية × التكلفة الحالية + الكمية الجديدة × التكلفة الجديدة) ÷ (الكمية الحالية + الكمية الجديدة)
 */
function weightedAverageCost(oldQty, oldCost, addQty, addCost) {
  const q1 = Math.max(0, parseInt(oldQty, 10) || 0);
  const q2 = Math.max(0, parseInt(addQty, 10) || 0);
  const c1 = parseFloat(oldCost) || 0;
  const c2 = parseFloat(addCost) || 0;
  const totalQ = q1 + q2;
  if (totalQ <= 0) return CurrencyEngine.round(c2);
  return CurrencyEngine.round((q1 * c1 + q2 * c2) / totalQ);
}

const calcWeightedAverageCost = weightedAverageCost;

async function pdfFirstPageToImageBlob(file) {
  const pdfjs = window.pdfjsLib;
  if (!pdfjs) throw new Error(t('iipPdfLibMissing'));
  pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data }).promise;
  const page = await doc.getPage(1);
  const viewport = page.getViewport({ scale: 2 });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error(t('invoiceOcrFailed')));
    }, 'image/png');
  });
}

const MultiCurrencyEngine = {
  vatRate() {
    return state.settings.vatRate ?? APP_CONFIG.vatRate ?? 0.15;
  },

  liveRate(currency) {
    if (currency === 'AUD') return 1;
    const r = LiveCurrencyBridge.rateFor(currency);
    return r > 0 ? r : null;
  },

  toAud(amount, rate) {
    const r = parseFloat(rate);
    if (!amount || Number.isNaN(amount)) return 0;
    return CurrencyEngine.round(amount * (r > 0 ? r : 1));
  },

  calcRow(row) {
    const currency = row.currency || 'SAR';
    const rate = parseFloat(row.exchangeRate) > 0
      ? parseFloat(row.exchangeRate)
      : (this.liveRate(currency) || 1);
    const fin = InvoiceFinancialEngine.calculateFinancials({
      ...row,
      exchangeRate: rate,
      _editField: row._editField,
    });
    return {
      currency,
      exchangeRate: rate,
      applyVat: currency === 'SAR' && row.applyVat !== false,
      ...fin,
      lineTotalAud: fin.lineAudIncVat,
    };
  },
};

const InvoiceOcrEngine = {
  hasTesseract() {
    return typeof Tesseract !== 'undefined';
  },

  hasPdfJs() {
    return typeof window.pdfjsLib !== 'undefined';
  },

  normalizeName(name) {
    return String(name || '').trim().toLowerCase().replace(/\s+/g, ' ');
  },

  findProductByName(name) {
    const norm = this.normalizeName(name);
    if (!norm || norm.length < 2) return null;

    const exact = state.products.find((p) => this.normalizeName(p.name) === norm);
    if (exact) return exact;

    return state.products.find((p) => {
      const pn = this.normalizeName(p.name);
      return pn.length >= 2 && (pn.includes(norm) || norm.includes(pn));
    }) || null;
  },

  skipLinePatterns: [
    /^(total|subtotal|sub\s*total|amount\s*due|balance|invoice|bill|receipt|tax|vat|gst|discount|shipping|payment|paid|due)/i,
    /^(المجموع|الإجمال|الاجمال|المبلغ|الضريبة|ضريبة|فاتورة|فاتوره|إيصال|ايصال|خصم|شحن|مدفوع|المتبقي|الرصيد|تاريخ|رقم\s*الفاتورة)/,
    /^\d{1,2}[\/\-.]\d{1,2}/,
    /^[\d,.]+\s*$/,
    /^page\s+\d+/i,
  ],

  normalizeNumber(raw) {
    if (raw == null) return NaN;
    let s = String(raw).trim().replace(/[^\d.,]/g, '');
    if (!s) return NaN;
    if (s.includes(',') && s.includes('.')) {
      s = s.replace(/,/g, '');
    } else if (s.includes(',') && !s.includes('.')) {
      const parts = s.split(',');
      s = parts.length === 2 && parts[1].length <= 2 ? `${parts[0]}.${parts[1]}` : s.replace(/,/g, '');
    }
    return parseFloat(s);
  },

  slugCode(name) {
    const latin = (name || '')
      .replace(/[^\w\s]/g, ' ')
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 6);
    if (latin.length >= 2) return latin;
    const digits = Math.abs([...name].reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0)) % 10000;
    return `P${digits}`;
  },

  generateCode(name, index, used) {
    let code = `SUP-${this.slugCode(name)}-${String(index + 1).padStart(2, '0')}`;
    let n = 1;
    while (used.has(code) || state.products.some((p) => p.code === code)) {
      n += 1;
      code = `SUP-${this.slugCode(name)}-${String(index + n).padStart(2, '0')}`;
    }
    used.add(code);
    return code;
  },

  detectCurrency(text, line = '') {
    const blob = `${text} ${line}`;
    if (/\bAUD\b|د\.?\s*أ|دولار\s*أسترالي/i.test(blob)) return 'AUD';
    if (/\bUSD\b|US\$|\$\s*\d|دولار\s*أمريك/i.test(blob)) return 'USD';
    if (/\bSAR\b|ريال|ر\.?\s*س|SR\b|﷼/i.test(blob)) return 'SAR';
    return 'SAR';
  },

  extractInvoiceNumber(text) {
    const patterns = [
      /(?:invoice|inv|فاتورة|فاتوره)\s*[#:\-]?\s*([A-Z0-9][A-Z0-9\-\/]{2,})/i,
      /رقم\s*(?:الفاتورة|فاتورة)\s*[#:\-]?\s*([A-Z0-9\u0600-\u06FF][\w\-\/]{2,})/i,
      /(?:tax\s*invoice|فاتورة\s*ضريبية)\s*[#:\-]?\s*([A-Z0-9][\w\-\/]{3,})/i,
      /\b(INV[\-\s]?\d{3,})\b/i,
      /\b(\d{4,}[\-\/]\d{2,})\b/,
    ];
    for (const re of patterns) {
      const m = (text || '').match(re);
      if (m?.[1]) return m[1].trim();
    }
    return '';
  },

  normalizeOcrText(text) {
    const arDigits = '٠١٢٣٤٥٦٧٨٩';
    const faDigits = '۰۱۲۳۴۵۶۷۸۹';
    return (text || '')
      .replace(/\r/g, '\n')
      .replace(/[|¦]/g, ' ')
      .replace(/[٠-٩]/g, (d) => String(arDigits.indexOf(d)))
      .replace(/[۰-۹]/g, (d) => String(faDigits.indexOf(d)))
      .replace(/\s+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n');
  },

  finalizeSarItem(item) {
    const qty = Math.max(1, Math.round(parseInt(item.qty, 10) || 1));
    const vatRate = state.settings.vatRate ?? APP_CONFIG.vatRate ?? 0.15;
    let unitExVat = CurrencyEngine.round(parseFloat(item.unitExVat ?? item.cost) || 0);
    let lineExVat = parseFloat(item.lineExVat);
    let lineIncVat = parseFloat(item.lineIncVat);
    let vatAmount = parseFloat(item.vatAmount);

    if (!Number.isNaN(lineIncVat) && lineIncVat > 0 && (Number.isNaN(lineExVat) || lineExVat <= 0)) {
      lineExVat = CurrencyEngine.round(lineIncVat / (1 + vatRate));
    }
    if (!Number.isNaN(lineExVat) && lineExVat > 0 && (Number.isNaN(lineIncVat) || lineIncVat <= 0)) {
      vatAmount = CurrencyEngine.round(lineExVat * vatRate);
      lineIncVat = CurrencyEngine.round(lineExVat + vatAmount);
    }
    if (unitExVat > 0) {
      lineExVat = CurrencyEngine.round(unitExVat * qty);
      vatAmount = CurrencyEngine.round(lineExVat * vatRate);
      lineIncVat = CurrencyEngine.round(lineExVat + vatAmount);
    } else if (!Number.isNaN(lineExVat) && lineExVat > 0) {
      unitExVat = qty > 0 ? CurrencyEngine.round(lineExVat / qty) : 0;
      vatAmount = CurrencyEngine.round(lineExVat * vatRate);
      lineIncVat = CurrencyEngine.round(lineExVat + vatAmount);
    } else {
      lineExVat = 0;
      vatAmount = 0;
      lineIncVat = 0;
    }

    return {
      name: (item.name || '').trim(),
      qty,
      currency: 'SAR',
      unitExVat,
      lineExVat,
      vatAmount,
      lineIncVat,
    };
  },

  parseColumnRow(cols) {
    const texts = [];
    const nums = [];
    cols.forEach((c) => {
      const n = this.normalizeNumber(c);
      if (!Number.isNaN(n) && n > 0) nums.push(n);
      else if (String(c).trim().length >= 2 && !/^\d+[.,]?\d*$/.test(String(c).trim())) {
        texts.push(String(c).trim());
      }
    });
    if (!texts.length || nums.length < 2) return null;

    const name = texts.join(' ').replace(/\s+/g, ' ').trim();
    const ints = nums.filter((n) => n < 5000 && Math.abs(n - Math.round(n)) < 0.01).map((n) => Math.round(n));
    const money = nums.filter((n) => n >= 0.01 && n < 500000);

    const qty = ints[0] || 1;
    let unitExVat = 0;
    let lineExVat = 0;
    let lineIncVat = null;

    if (money.length >= 3) {
      unitExVat = money[0];
      lineExVat = money[money.length - 2];
      lineIncVat = money[money.length - 1];
    } else if (money.length === 2) {
      unitExVat = money[0];
      lineExVat = CurrencyEngine.round(unitExVat * qty);
      lineIncVat = money[1];
    } else {
      unitExVat = money[0];
      lineExVat = CurrencyEngine.round(unitExVat * qty);
    }

    if (!name || name.length < 2) return null;
    return this.finalizeSarItem({ name, qty, unitExVat, lineExVat, lineIncVat });
  },

  parseEnhancedLine(line, docCurrency = 'SAR') {
    const trimmed = line.replace(/\s{2,}/g, ' ').trim();
    if (!trimmed || trimmed.length < 3) return null;

    if (trimmed.includes('\t')) {
      const parsed = this.parseColumnRow(trimmed.split('\t').map((c) => c.trim()).filter(Boolean));
      if (parsed) return parsed;
    }

    const pipeCols = trimmed.split(/\s*\|\s*/).map((c) => c.trim()).filter(Boolean);
    if (pipeCols.length >= 4) {
      const parsed = this.parseColumnRow(pipeCols);
      if (parsed) return parsed;
    }

    const multiCols = trimmed.split(/\s{2,}/).map((c) => c.trim()).filter(Boolean);
    if (multiCols.length >= 4) {
      const parsed = this.parseColumnRow(multiCols);
      if (parsed) return parsed;
    }

    const raw = this.parseIntlLine(trimmed, docCurrency);
    return raw ? this.finalizeSarItem(raw) : null;
  },

  parseStructuredInvoice(text) {
    const normalized = this.normalizeOcrText(text);
    const invoiceNumber = this.extractInvoiceNumber(normalized);
    const docCurrency = this.detectCurrency(normalized);
    const items = [];
    const seen = new Set();

    const lines = normalized.split(/\n/).map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      if (this.skipLinePatterns.some((p) => p.test(line))) continue;
      if (line.length > 140) continue;

      const raw = this.parseEnhancedLine(line, docCurrency);
      if (!raw?.name || raw.name.length < 2) continue;

      const item = this.finalizeSarItem(raw);
      if (!item.unitExVat && !item.lineExVat && !item.lineIncVat) continue;

      const key = `${item.name}|${item.qty}|${item.unitExVat}|${item.lineExVat}|${item.lineIncVat}`;
      if (seen.has(key)) continue;
      seen.add(key);
      items.push(item);
    }

    let sorted = this.sortExtractedItems(items);
    if (!sorted.length && normalized.trim().length > 10) {
      sorted = this.sortExtractedItems(
        this.fallbackLinesFromText(normalized).map((i) => this.finalizeSarItem(i)).filter((i) => i.name)
      );
    }

    return { invoiceNumber, items: sorted, text: normalized };
  },

  parseIntlLine(line, docCurrency = 'SAR') {
    const trimmed = line.replace(/\s{2,}/g, ' ').trim();
    if (!trimmed || trimmed.length < 3) return null;

    const currency = this.detectCurrency('', trimmed) || docCurrency;
    const nums = [...trimmed.matchAll(/[\d.,]+/g)]
      .map((m) => this.normalizeNumber(m[0]))
      .filter((n) => !Number.isNaN(n) && n > 0);

    let name = trimmed
      .replace(/[\d.,]+/g, ' ')
      .replace(/\b(SAR|USD|AUD|ريال|ر\.س)\b/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (nums.length >= 2 && name.length >= 2) {
      const ints = nums.filter((n) => n < 5000 && Math.abs(n - Math.round(n)) < 0.01).map((n) => Math.round(n));
      const qty = ints[0] || 1;
      const money = nums.filter((n) => n >= 0.01 && n < 500000);
      const unitExVat = money.find((n) => n !== qty) || money[0] || 0;
      const lineExVat = money.length >= 2 ? money[money.length - 2] : CurrencyEngine.round(unitExVat * qty);
      const lineIncVat = money.length >= 1 ? money[money.length - 1] : null;
      if (qty >= 1 && unitExVat > 0) {
        return {
          name,
          qty,
          currency,
          unitExVat: CurrencyEngine.round(unitExVat),
          lineExVat: CurrencyEngine.round(lineExVat),
          lineIncVat: lineIncVat != null ? CurrencyEngine.round(lineIncVat) : null,
        };
      }
    }

    const basic = this.parseLine(trimmed);
    if (!basic) return null;
    return {
      name: basic.name,
      qty: basic.qty,
      currency,
      unitExVat: basic.cost,
      lineExVat: CurrencyEngine.round(basic.cost * basic.qty),
      lineIncVat: null,
    };
  },

  parseLine(line) {
    const trimmed = line.replace(/\s{2,}/g, ' ').trim();
    if (!trimmed || trimmed.length < 3) return null;

    const patterns = [
      /^(.+?)\s+(\d{1,4})\s+([\d,.]+)\s*$/,
      /^(.+?)\s+([\d,.]+)\s+(\d{1,4})\s*$/,
      /^(\d{1,4})\s+([\d,.]+)\s+(.+)$/,
      /^([\d,.]+)\s+(\d{1,4})\s+(.+)$/,
      /^(.+?)\s*[x×]\s*(\d{1,4})\s+([\d,.]+)\s*$/i,
      /^(.+?)\s+(\d{1,4})\s*[x×]\s*([\d,.]+)\s*$/i,
    ];

    for (const re of patterns) {
      const m = trimmed.match(re);
      if (!m) continue;

      let name;
      let qty;
      let cost;

      if (/^\d/.test(m[1]) && re.source.startsWith('^(\\d')) {
        qty = parseInt(m[1], 10);
        cost = this.normalizeNumber(m[2]);
        name = m[3];
      } else if (/^[\d,.]/.test(m[1]) && m[2] && /^\d/.test(m[2])) {
        cost = this.normalizeNumber(m[1]);
        qty = parseInt(m[2], 10);
        name = m[3];
      } else {
        name = m[1];
        const a = this.normalizeNumber(m[2]);
        const b = this.normalizeNumber(m[3]);
        if (Number.isInteger(a) && a > 0 && a < 5000 && !Number.isNaN(b)) {
          qty = a;
          cost = b;
        } else if (Number.isInteger(b) && b > 0 && b < 5000) {
          qty = b;
          cost = a;
        } else continue;
      }

      name = (name || '').replace(/^[\d.]+\s*/, '').trim();
      if (!name || name.length < 2 || Number.isNaN(cost) || cost <= 0 || !qty || qty < 1) continue;
      if (qty > 9999) continue;
      return { name, qty, cost: CurrencyEngine.round(cost) };
    }

    const cols = line.split(/\t+|\s{2,}/).map((c) => c.trim()).filter(Boolean);
    if (cols.length >= 3) {
      const nums = cols.map((c) => this.normalizeNumber(c)).filter((n) => !Number.isNaN(n) && n > 0);
      const ints = cols.map((c) => parseInt(c, 10)).filter((n) => !Number.isNaN(n) && n > 0 && n < 5000);
      const textCols = cols.filter((c) => Number.isNaN(this.normalizeNumber(c)) || !/^\d/.test(c));
      if (nums.length >= 1 && ints.length >= 1 && textCols.length >= 1) {
        const qty = ints[0];
        const cost = nums.find((n) => n !== qty && (n < 100000)) || nums[nums.length - 1];
        const name = textCols.join(' ').trim();
        if (name.length >= 2 && cost > 0) {
          return { name, qty, cost: CurrencyEngine.round(cost) };
        }
      }
    }

    return null;
  },

  sortExtractedItems(items) {
    return [...items].sort((a, b) => (a.name || '').localeCompare(b.name || '', currentLang === 'ar' ? 'ar' : 'en'));
  },

  extractLineItems(text) {
    const lines = (text || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const docCurrency = this.detectCurrency(text);
    const items = [];
    const seen = new Set();

    for (const line of lines) {
      if (this.skipLinePatterns.some((p) => p.test(line))) continue;
      if (line.length > 120) continue;

      const item = this.parseEnhancedLine(line, docCurrency);
      if (!item) continue;

      const key = `${item.name}|${item.qty}|${item.unitExVat}|${item.lineExVat}|${item.lineIncVat}`;
      if (seen.has(key)) continue;
      seen.add(key);
      items.push(item);
    }

    return this.sortExtractedItems(items);
  },

  fallbackLinesFromText(text) {
    const docCurrency = this.detectCurrency(text);
    return (text || '').split(/\r?\n/).map((l) => l.trim()).filter((l) => {
      if (l.length < 3 || l.length > 120) return false;
      return !this.skipLinePatterns.some((p) => p.test(l));
    }).map((line) => {
      const item = this.parseIntlLine(line, docCurrency) || this.parseLine(line);
      if (item) return item;
      return { name: line.slice(0, 80), qty: 1, currency: docCurrency, unitExVat: 0, lineExVat: 0, lineIncVat: null };
    });
  },

  async parseFile(file, onProgress) {
    if (!file) throw new Error(t('iipFormatsOnly'));

    let imageFile = file;
    if (file.type === 'application/pdf') {
      if (!this.hasPdfJs()) throw new Error(t('iipPdfLibMissing'));
      const blob = await pdfFirstPageToImageBlob(file);
      imageFile = new File([blob], 'invoice-page1.png', { type: 'image/png' });
    } else if (!file.type?.startsWith('image/')) {
      throw new Error(t('iipFormatsOnly'));
    }

    if (!this.hasTesseract()) {
      throw new Error(t('invoiceOcrLibMissing'));
    }

    const worker = await Tesseract.createWorker('ara+eng', 1, {
      logger: (m) => {
        if (!onProgress) return;
        if (m.status === 'recognizing text' && typeof m.progress === 'number') {
          onProgress(m.progress);
        } else if (m.status === 'loading tesseract core' || m.status === 'initializing tesseract') {
          onProgress(0.05);
        } else if (m.status === 'loading language traineddata') {
          onProgress(0.15);
        }
      },
    });

    try {
      if (worker.setParameters) {
        await worker.setParameters({
          tessedit_pageseg_mode: '3',
          preserve_interword_spaces: '1',
        });
      }
    } catch (_) { /* optional OCR tuning */ }

    const imageUrl = URL.createObjectURL(imageFile);
    try {
      const result = await worker.recognize(imageUrl);
      const rawText = result?.data?.text || '';
      const structured = this.parseStructuredInvoice(rawText);
      return {
        text: structured.text,
        invoiceNumber: structured.invoiceNumber,
        items: structured.items,
        confidence: result?.data?.confidence,
      };
    } finally {
      URL.revokeObjectURL(imageUrl);
      await worker.terminate();
    }
  },

  /** @deprecated */
  async parseImageFile(file, onProgress) {
    return this.parseFile(file, onProgress);
  },

  rowFromItem(item, index, used, invoiceNumber = '') {
    const matched = this.findProductByName(item.name);
    const base = {
      rowId: uid(),
      mappedProductId: matched?.id || null,
      code: matched?.code || this.generateCode(item.name, index, used),
      name: item.name,
      size: matched?.size || '56',
      color: matched?.color || (currentLang === 'ar' ? 'مستورد' : 'Import'),
      qty: item.qty || 1,
      currency: 'SAR',
      exchangeRate: MultiCurrencyEngine.liveRate('SAR') || 0.4,
      unitExVat: item.unitExVat ?? item.cost ?? 0,
      lineExVat: item.lineExVat ?? null,
      vatAmount: item.vatAmount ?? null,
      lineIncVat: item.lineIncVat ?? null,
      applyVat: true,
      invoiceNumber,
      style: matched?.style || 'classic',
    };
    const calc = MultiCurrencyEngine.calcRow(base);
    return {
      ...base,
      ...calc,
      price: CurrencyEngine.round(matched?.price || calc.costAud * APP_CONFIG.recordSaleMultiplier),
    };
  },

  rowsFromItems(items, invoiceNumber = '') {
    const used = new Set(state.products.map((p) => p.code));
    return items.map((item, i) => this.rowFromItem(item, i, used, invoiceNumber));
  },
};

const InvoiceOcrUI = {
  draftRows: [],
  pendingFile: null,
  previewUrl: null,
  invoiceNumber: '',
  pendingIsPdf: false,
  isProcessing: false,
  isSaving: false,

  reviewTbody() {
    return document.getElementById('sip-review-tbody');
  },

  loadSavedExchangeRate() {
    const saved = parseFloat(state.settings.sarToAudRate);
    if (!Number.isNaN(saved) && saved > 0) return saved;
    const live = MultiCurrencyEngine.liveRate('SAR');
    if (live > 0) return live;
    const fx = parseFloat(state.settings.exchangeRates?.audPerSar);
    return !Number.isNaN(fx) && fx > 0 ? fx : 0.4;
  },

  getExchangeRate() {
    const el = document.getElementById('sip-exchange-rate');
    const v = parseFloat(el?.value);
    if (!Number.isNaN(v) && v > 0) return v;
    return this.loadSavedExchangeRate();
  },

  async saveExchangeRate() {
    const rate = this.getExchangeRate();
    state.settings.sarToAudRate = rate;
    await DataStore.save();
  },

  updateFxLabel() {
    const el = document.getElementById('sip-fx-label');
    if (!el) return;
    const rate = this.getExchangeRate();
    el.textContent = t('sipExchangeHint').replace('{rate}', String(rate));
  },

  showWorkArea() {
    const area = document.getElementById('sip-work-area');
    if (area) area.hidden = false;
    const rateEl = document.getElementById('sip-exchange-rate');
    if (rateEl) rateEl.value = this.loadSavedExchangeRate();
    this.updateFxLabel();
  },

  hideWorkArea() {
    const area = document.getElementById('sip-work-area');
    if (area) area.hidden = true;
    this.draftRows = [];
  },

  /** تصفير النموذج بعد حفظ ناجح — جاهز لفاتورة جديدة */
  resetInvoiceForm() {
    this.pendingFile = null;
    this.pendingIsPdf = false;
    this.invoiceNumber = '';
    this.draftRows = [];
    this.isProcessing = false;
    this.clearPreview();
    this.showProcessingPhase(false);
    this.setProcessingUI(false);

    const input = document.getElementById('supplier-invoice-input');
    if (input) input.value = '';
    const inv = document.getElementById('sip-invoice-number');
    if (inv) inv.value = '';
    const fileName = document.getElementById('sip-file-name');
    if (fileName) fileName.textContent = '';
    const hint = document.getElementById('sip-review-hint');
    if (hint) hint.textContent = t('sipReviewHint');
    document.getElementById('sip-drop-zone')?.classList.remove('sip-drop-zone--active', 'sip-drop-zone--has-file');

    const sarEl = document.getElementById('sip-grand-total-sar');
    const audEl = document.getElementById('sip-grand-total-aud');
    if (sarEl) sarEl.textContent = formatSAR(0);
    if (audEl) audEl.textContent = formatAUD(0);

    const tbody = this.reviewTbody();
    if (tbody) tbody.innerHTML = '';

    this.hideWorkArea();
  },

  renderTransactionLog(limit = 8) {
    const wrap = document.getElementById('sip-transaction-log-wrap');
    const tbody = document.getElementById('sip-transaction-log-tbody');
    if (!wrap || !tbody) return;

    const logs = (state.inventoryTransactions || [])
      .filter((tx) => tx.type === 'invoice_import')
      .slice(0, limit);

    if (!logs.length) {
      wrap.hidden = true;
      return;
    }

    wrap.hidden = false;
    tbody.innerHTML = logs.map((tx) => `
      <tr>
        <td>${escapeHtml(tx.invoiceNumber || '—')}</td>
        <td>${formatDate(tx.processedAt)}</td>
        <td>${escapeHtml(tx.productName || '—')}</td>
        <td>+${tx.qtyAdded ?? 0}</td>
        <td>${formatAUD(tx.unitCostAud ?? tx.costAud)}</td>
        <td><span class="user-audit-badge">${escapeHtml(tx.createdBy || '—')}</span></td>
      </tr>`).join('');
  },

  setSaveButtonBusy(busy) {
    const btn = document.getElementById('sip-save-inventory');
    if (!btn) return;
    btn.disabled = !!busy;
    btn.setAttribute('aria-busy', busy ? 'true' : 'false');
    const label = btn.querySelector('span');
    if (label) label.textContent = busy ? t('invConfirmSaving') : t('sipApproveSave');
  },

  /** Overlay يغطي الشاشة أثناء الترحيل — يمنع الضغط المزدوج */
  setIntegrationOverlay(show, messageKey = 'invConfirmSaving') {
    const overlay = document.getElementById('iip-loading-overlay');
    const title = overlay?.querySelector('.iip-loading-overlay__title');
    const status = document.getElementById('iip-loading-status');
    const card = document.getElementById('supplier-invoice-processor');
    if (title) title.textContent = t(messageKey);
    if (status && show) status.textContent = t('invConfirmSaving');
    if (overlay) {
      overlay.hidden = !show;
      overlay.classList.toggle('iip-loading-overlay--fullscreen', !!show);
    }
    if (card) card.classList.toggle('card--iip-processing', !!show);
    document.body.classList.toggle('iip-integration-lock', !!show);
  },

  validateBeforeSave() {
    const exchangeRate = this.getExchangeRate();
    const reviewed = this.collectReviewedRowsFromDom();
    return validateReviewedInvoiceForSave(reviewed, exchangeRate);
  },

  showProcessingPhase(show) {
    const el = document.getElementById('sip-phase-processing');
    if (el) el.hidden = !show;
    if (show) this.setIntegrationOverlay(true, 'sipProcessing');
    else if (!this.isSaving) this.setIntegrationOverlay(false);
  },

  setProgress(pct) {
    const el = document.getElementById('sip-progress-text');
    if (!el) return;
    const n = Math.min(100, Math.max(0, Math.round((pct || 0) * 100)));
    el.textContent = n > 0
      ? t('invoiceOcrProgress').replace('{pct}', String(n))
      : t('sipProcessing');
    const fill = document.getElementById('sip-processing-bar-fill');
    const overlayFill = document.getElementById('iip-overlay-progress');
    const statusEl = document.getElementById('iip-loading-status');
    const pctW = `${Math.max(n, 8)}%`;
    if (fill) fill.style.width = pctW;
    if (overlayFill) overlayFill.style.width = pctW;
    if (statusEl && n > 0) statusEl.textContent = t('invoiceOcrProgress').replace('{pct}', String(n));
  },

  setProcessingUI(busy, pct = 0) {
    const btn = document.getElementById('sip-start-process');
    const spinner = document.getElementById('sip-spinner');
    if (btn) {
      btn.disabled = busy || !this.pendingFile;
      btn.setAttribute('aria-busy', busy ? 'true' : 'false');
    }
    if (spinner) spinner.hidden = !busy;
    if (busy) this.setProgress(pct);
    else {
      const fill = document.getElementById('sip-processing-bar-fill');
      if (fill) fill.style.width = '';
    }
  },

  applyOcrResults({ items, invoiceNumber }) {
    this.invoiceNumber = invoiceNumber || '';
    const sorted = InvoiceOcrEngine.sortExtractedItems(items || []);
    this.draftRows = InvoiceOcrEngine.rowsFromItems(sorted, this.invoiceNumber);
    this.showWorkArea();
    const invEl = document.getElementById('sip-invoice-number');
    if (invEl) invEl.value = this.invoiceNumber;
    const hint = document.getElementById('sip-review-hint');
    if (hint) hint.textContent = t('sipOcrReview');
    this.renderTable();
  },

  clearPreview() {
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
      this.previewUrl = null;
    }
    const img = document.getElementById('sip-preview-img');
    const ph = document.getElementById('sip-preview-placeholder');
    if (img) {
      img.removeAttribute('src');
      img.hidden = true;
    }
    if (ph) {
      ph.textContent = '—';
      ph.hidden = false;
    }
  },

  setPendingFile(file) {
    const isPdf = file?.type === 'application/pdf';
    const isImage = file?.type?.startsWith('image/');
    if (!isPdf && !isImage) {
      showToast(t('iipFormatsOnly'), 'error');
      return;
    }
    const maxBytes = APP_CONFIG.ocrMaxFileMb * 1024 * 1024;
    if (file.size > maxBytes) {
      showToast(t('invoiceFileTooLarge'), 'error');
      return;
    }

    this.pendingFile = file;
    this.pendingIsPdf = isPdf;
    this.clearPreview();
    const img = document.getElementById('sip-preview-img');
    const ph = document.getElementById('sip-preview-placeholder');
    const nameEl = document.getElementById('sip-file-name');
    if (isPdf) {
      if (ph) {
        ph.textContent = 'PDF';
        ph.hidden = false;
      }
      if (img) img.hidden = true;
    } else {
      this.previewUrl = URL.createObjectURL(file);
      if (img) {
        img.src = this.previewUrl;
        img.hidden = false;
      }
      if (ph) ph.hidden = true;
    }
    if (nameEl) nameEl.textContent = file.name;
    document.getElementById('sip-drop-zone')?.classList.add('sip-drop-zone--has-file');
    this.showWorkArea();
    if (!this.draftRows.length) {
      this.draftRows = [this.emptyRow(0), this.emptyRow(1), this.emptyRow(2)];
    }
    this.renderTable();
    this.runOcrAndFill();
  },

  async runOcrAndFill() {
    if (!this.pendingFile || this.isProcessing) return;
    if (!InvoiceOcrEngine.hasTesseract()) {
      showToast(t('invoiceOcrLibMissing'), 'error');
      return;
    }

    this.isProcessing = true;
    this.showProcessingPhase(true);
    this.setProcessingUI(true, 0);

    try {
      await LiveCurrencyBridge.fetchRates();
      const rateEl = document.getElementById('sip-exchange-rate');
      if (rateEl) rateEl.value = this.loadSavedExchangeRate();
      this.updateFxLabel();

      const ocrResult = await InvoiceOcrEngine.parseFile(this.pendingFile, (p) => {
        this.setProcessingUI(true, p);
      });

      console.log('[Invoice OCR] extracted text:', ocrResult?.text ?? '');

      const text = (ocrResult.text || '').trim();
      const items = ocrResult.items || [];
      const hasUsableRows = items.some((it) => (it.name || '').trim().length >= 2);

      if (text && hasUsableRows) {
        this.applyOcrResults(ocrResult);
        showToast(t('sipOcrDone'));
      } else {
        showToast(t('invoiceNoItemsFound'), 'error');
      }
    } catch (err) {
      console.error('[Invoice OCR]', err);
      showToast(err.message || t('invoiceOcrFailed'), 'error');
    } finally {
      this.isProcessing = false;
      this.setProcessingUI(false);
      this.showProcessingPhase(false);
    }
  },

  async startProcessing() {
    return this.runOcrAndFill();
  },

  emptyRow(index) {
    const used = new Set([...state.products.map((p) => p.code), ...this.draftRows.map((r) => r.code)]);
    const base = {
      rowId: uid(),
      mappedProductId: null,
      code: InvoiceOcrEngine.generateCode('Product', index, used),
      name: '',
      size: '56',
      color: currentLang === 'ar' ? 'مستورد' : 'Import',
      qty: 1,
      currency: 'SAR',
      exchangeRate: this.getExchangeRate(),
      unitExVat: 0,
      lineExVat: 0,
      vatAmount: 0,
      lineIncVat: 0,
      applyVat: true,
      invoiceNumber: this.invoiceNumber || '',
      style: 'classic',
    };
    const calc = MultiCurrencyEngine.calcRow(base);
    return { ...base, ...calc, price: 0 };
  },

  /** قراءة القيم من جدول المراجعة فقط (بعد التعديل اليدوي — ليس OCR خام) */
  collectReviewedRowsFromDom() {
    const tbody = this.reviewTbody();
    if (tbody) {
      tbody.querySelectorAll('tr[data-invoice-row]').forEach((tr) => this.syncSimpleRow(tr));
    }
    return this.collectRows().map((row) => ({
      ...row,
      source: 'review_table',
      fromReviewTable: true,
    }));
  },

  collectRows() {
    const tbody = this.reviewTbody();
    if (!tbody) return [];

    const invInput = document.getElementById('sip-invoice-number');
    this.invoiceNumber = (invInput?.value || this.invoiceNumber || '').trim();

    const used = new Set(state.products.map((p) => p.code));
    return [...tbody.querySelectorAll('tr[data-invoice-row]')].map((tr, index) => {
      const get = (field) => tr.querySelector(`[data-inv-field="${field}"]`)?.value;
      const name = (get('name') || '').trim();
      const matched = InvoiceOcrEngine.findProductByName(name);
      let code = matched?.code || (tr.dataset.invCode || get('code') || '').trim();
      if (!code && name) code = InvoiceOcrEngine.generateCode(name, index, used);
      else if (code) used.add(code);

      const base = {
        rowId: tr.dataset.invoiceRow,
        mappedProductId: matched?.id || tr.dataset.mappedId || null,
        code,
        name,
        size: tr.dataset.invSize || matched?.size || '56',
        color: tr.dataset.invColor || matched?.color || (currentLang === 'ar' ? 'مستورد' : 'Import'),
        qty: parseInt(get('qty'), 10) || 1,
        currency: 'SAR',
        exchangeRate: this.getExchangeRate(),
        unitExVat: parseFloat(get('unitExVat')) || 0,
        lineExVat: parseFloat(get('lineExVat')) || 0,
        vatAmount: parseFloat(get('vatAmount')) || 0,
        lineIncVat: parseFloat(get('lineIncVat')) || 0,
        applyVat: true,
        invoiceNumber: this.invoiceNumber,
        style: tr.dataset.invStyle || matched?.style || 'classic',
      };
      const calc = MultiCurrencyEngine.calcRow(base);
      const costStored = parseFloat(get('costAud'));
      const costAud = !Number.isNaN(costStored) && costStored > 0
        ? CurrencyEngine.round(costStored)
        : calc.costAud;
      const priceStored = parseFloat(get('price'));
      const price = !Number.isNaN(priceStored) && priceStored > 0
        ? priceStored
        : CurrencyEngine.round(matched?.price || costAud * APP_CONFIG.recordSaleMultiplier);

      return {
        ...base,
        ...calc,
        costAud,
        unitAud: costAud,
        price,
        supplierInvoiceNumber: this.invoiceNumber,
      };
    });
  },

  renderTable() {
    const tbody = this.reviewTbody();
    if (!tbody) return;

    tbody.innerHTML = this.draftRows.map((row) => {
      const calc = MultiCurrencyEngine.calcRow({
        ...row,
        currency: 'SAR',
        applyVat: true,
        exchangeRate: this.getExchangeRate(),
      });
      Object.assign(row, calc);
      const matched = row.mappedProductId
        ? getProduct(row.mappedProductId)
        : InvoiceOcrEngine.findProductByName(row.name);

      return `
      <tr data-invoice-row="${row.rowId}"
          data-inv-code="${escapeHtml(row.code)}"
          data-inv-size="${escapeHtml(row.size)}"
          data-inv-color="${escapeHtml(row.color)}"
          data-inv-style="${escapeHtml(row.style)}"
          data-mapped-id="${matched?.id || ''}">
        <td>
          <input type="text" data-inv-field="name" value="${escapeHtml(row.name)}" placeholder="${t('iipItemName')}" required>
          <input type="hidden" data-inv-field="code" value="${escapeHtml(row.code)}">
          <input type="hidden" data-inv-field="price" value="${row.price}">
        </td>
        <td><input type="number" data-inv-field="qty" min="1" step="1" value="${row.qty}"></td>
        <td><input type="number" data-inv-field="unitExVat" min="0" step="0.01" value="${row.unitExVat}"></td>
        <td><input type="number" data-inv-field="lineExVat" min="0" step="0.01" value="${row.lineExVat}"></td>
        <td><input type="number" data-inv-field="vatAmount" min="0" step="0.01" value="${row.vatAmount}" title="${t('iipVat15')}"></td>
        <td><input type="number" data-inv-field="lineIncVat" min="0" step="0.01" value="${row.lineIncVat}"></td>
        <td>
          <input type="number" data-inv-field="costAud" min="0" step="0.01" value="${row.costAud}" class="sip-input-aud" title="${t('sipUnitCostAud')}">
        </td>
        <td class="sip-aud-cell">
          <strong class="sip-aud-val" data-sip-aud-line>${formatAUD(row.lineAudIncVat)}</strong>
        </td>
        <td class="actions actions--invoice-ocr">
          <button type="button" class="btn btn--sm btn--danger" data-invoice-remove-row="${row.rowId}">${t('delete')}</button>
        </td>
      </tr>`;
    }).join('');
    this.redistributeAllRowCosts();
  },

  computeGrandTotals(rows) {
    const list = rows || this.collectRows().filter((r) => (r.name || '').trim());
    const totals = InvoiceFinancialEngine.calculateInvoiceTotals(list, this.getExchangeRate());
    return {
      totalSar: totals.totalSar,
      totalAud: totals.totalAud,
      totalVat: totals.totalVat,
      totalExVat: totals.totalExVat,
      rate: totals.exchangeRate,
      totalQty: totals.totalQty,
      rows: list,
    };
  },

  applyFairCostAllocation(rows) {
    const list = rows.filter((r) => (r.name || '').trim());
    const totals = InvoiceFinancialEngine.calculateInvoiceTotals(list, this.getExchangeRate());
    return InvoiceFinancialEngine.allocateFairCosts(list, totals).map((row) => ({
      ...row,
      grandTotalAud: totals.totalAud,
      grandTotalSar: totals.totalSar,
    }));
  },

  updateGrandTotals() {
    const { totalSar, totalAud } = this.computeGrandTotals();
    const sarEl = document.getElementById('sip-grand-total-sar');
    const audEl = document.getElementById('sip-grand-total-aud');
    if (sarEl) sarEl.textContent = formatSAR(totalSar);
    if (audEl) audEl.textContent = formatAUD(totalAud);
    return { totalSar, totalAud };
  },

  redistributeAllRowCosts() {
    const rows = this.collectRows().filter((r) => (r.name || '').trim() && (parseFloat(r.lineIncVat) || 0) > 0);
    if (!rows.length) {
      this.updateGrandTotals();
      return;
    }
    const allocated = this.applyFairCostAllocation(rows);
    allocated.forEach((row) => {
      const tr = document.querySelector(`tr[data-invoice-row="${row.rowId}"]`);
      if (!tr) return;
      const costEl = tr.querySelector('[data-inv-field="costAud"]');
      const audLine = tr.querySelector('[data-sip-aud-line]');
      if (costEl && document.activeElement !== costEl) costEl.value = row.costAud;
      if (audLine) audLine.textContent = formatAUD(row.lineAudIncVat);
    });
    this.updateGrandTotals();
  },

  syncSimpleRow(tr) {
    if (!tr) return;
    const active = document.activeElement?.dataset?.invField;
    const get = (f) => tr.querySelector(`[data-inv-field="${f}"]`)?.value;
    const set = (f, v) => {
      const el = tr.querySelector(`[data-inv-field="${f}"]`);
      if (!el || document.activeElement === el) return;
      el.value = v;
    };

    const fin = InvoiceFinancialEngine.calculateFinancials({
      qty: get('qty'),
      unitExVat: get('unitExVat'),
      lineExVat: get('lineExVat'),
      vatAmount: get('vatAmount'),
      lineIncVat: get('lineIncVat'),
      costAud: get('costAud'),
      exchangeRate: this.getExchangeRate(),
      _editField: active,
    });

    set('unitExVat', fin.unitExVat);
    set('lineExVat', fin.lineExVat);
    set('vatAmount', fin.vatAmount);
    set('lineIncVat', fin.lineIncVat);

    const name = get('name')?.trim();
    if (name) {
      const matched = InvoiceOcrEngine.findProductByName(name);
      tr.dataset.mappedId = matched?.id || '';
    }

    if (active !== 'costAud') {
      this.redistributeAllRowCosts();
    } else {
      set('costAud', fin.costAud);
      const audLine = tr.querySelector('[data-sip-aud-line]');
      if (audLine) audLine.textContent = formatAUD(fin.lineAudIncVat);
      this.updateGrandTotals();
    }
  },

  refreshAllAudCells() {
    const tbody = this.reviewTbody();
    if (!tbody) return;
    tbody.querySelectorAll('tr[data-invoice-row]').forEach((tr) => this.syncSimpleRow(tr));
    this.redistributeAllRowCosts();
  },

  /**
   * حفظ وتأكيد — ربط لحظي: قيم المراجعة اليدوية → مخزون + سجل حركات
   */
  async confirmAndSaveToInventory() {
    if (this.isSaving) return;
    if (!UserSession.requireUser()) return;

    const validation = this.validateBeforeSave();
    if (!validation.ok) {
      const msg = validation.errors.join('\n• ');
      showToast(validation.errors[0], 'error', 4500);
      window.alert(`⚠ ${t('invoiceOcrFailed')}\n\n• ${msg}`);
      return;
    }

    const reviewedRaw = validation.validRows;
    const exchangeRate = this.getExchangeRate();
    const rows = this.applyFairCostAllocation(reviewedRaw.map((r) => ({
      ...r,
      source: 'review_table',
      fromReviewTable: true,
    })));
    const { totalSar, totalAud } = this.computeGrandTotals(rows);

    const summary = [
      `${t('sipGrandTotalSar')}: ${formatSAR(totalSar)}`,
      `${t('sipGrandTotalAud')}: ${formatAUD(totalAud)}`,
      `${t('sipExchangeRate')}: ${exchangeRate}`,
      '',
      ...rows.map((r) => {
        const tag = InvoiceOcrEngine.findProductByName(r.name) ? `↻ ${t('sipMapped')}` : `+ ${t('sipNewProduct')}`;
        return `• ${r.name} × ${r.qty} — ${formatAUD(r.costAud)}/${t('qty')} ${tag}`;
      }),
    ].join('\n');
    const msg = `${t('invoiceConfirmTitle')}\n\n${summary}\n\n${t('invoiceConfirmHint')}`;
    if (!confirm(msg)) return;

    this.isSaving = true;
    this.setSaveButtonBusy(true);
    this.setIntegrationOverlay(true, 'invConfirmSaving');

    try {
      await this.saveExchangeRate();
      const invInput = document.getElementById('sip-invoice-number');
      this.invoiceNumber = (invInput?.value || this.invoiceNumber || '').trim();
      const processedAt = new Date().toISOString();

      const result = await realTimeIntegrateReviewedInvoice(rows, {
        invoiceNumber: this.invoiceNumber,
        exchangeRate,
        processedAt,
      });

      if (!result.ok) {
        if (result.error === 'code') return showToast(`${t('code')}: ${result.row}`, 'error');
        return showToast(t('invoiceOcrFailed'), 'error');
      }

      recordInvoiceFxHistory({
        rate: exchangeRate,
        invoiceNumber: this.invoiceNumber,
        totalSar,
        totalAud,
        itemCount: rows.length,
      });
      await DataStore.save();

      showToast(
        `✓ ${t('invInventoryUpdatedSuccess')} (+${result.added}${result.updated ? ` ↻${result.updated}` : ''})`,
        'success',
        5500
      );

      ActivityFeed.log({
        type: 'invoice_import',
        amountAud: totalAud,
        label: this.invoiceNumber || '',
      });

      this.resetInvoiceForm();
      this.renderTransactionLog();
      renderAll();
    } catch (err) {
      console.error('[Invoice Integration]', err);
      showToast(err.message || t('invoiceOcrFailed'), 'error', 4500);
    } finally {
      this.isSaving = false;
      this.setSaveButtonBusy(false);
      this.setIntegrationOverlay(false);
    }
  },

  /** @alias */
  async confirmSaveToInventory() {
    return this.confirmAndSaveToInventory();
  },

  addRow() {
    this.draftRows = this.collectRows();
    this.draftRows.push(this.emptyRow(this.draftRows.length));
    this.renderTable();
  },

  removeRow(rowId) {
    this.draftRows = this.collectRows().filter((r) => r.rowId !== rowId);
    if (!this.draftRows.length) this.draftRows.push(this.emptyRow(0));
    this.renderTable();
  },

};

/** واجهة موحدة للمعالج الذكي للفواتير الدولية */
const InternationalAIInvoiceProcessor = {
  Financials: InvoiceFinancialEngine,
  Ocr: InvoiceOcrEngine,
  UI: InvoiceOcrUI,
  calculateFinancials: (input) => InvoiceFinancialEngine.calculateFinancials(input),
  calculateInvoiceTotals: (lines, rate) => InvoiceFinancialEngine.calculateInvoiceTotals(lines, rate),
  recordFxHistory: recordInvoiceFxHistory,
  updateInventoryCost: updateInventoryCostFromInvoice,
  realTimeIntegrate: realTimeIntegrateReviewedInvoice,
  validateForSave: validateReviewedInvoiceForSave,
  confirmAndSave: (rows, meta) => realTimeIntegrateReviewedInvoice(rows, meta),
  calcWeightedAverageCost: weightedAverageCost,
  logTransaction: logInventoryTransaction,
};

if (typeof window !== 'undefined') {
  window.InternationalAIInvoiceProcessor = InternationalAIInvoiceProcessor;
  window.calculateFinancials = (input) => InvoiceFinancialEngine.calculateFinancials(input);
}

function renderSupplierInvoiceProcessorHTML() {
  const saved = parseFloat(state.settings.sarToAudRate);
  const defaultFx = !Number.isNaN(saved) && saved > 0
    ? saved
    : (state.settings?.exchangeRates?.audPerSar || 0.4);
  return `
    <div class="card card--supplier-processor" id="supplier-invoice-processor">
      <div id="iip-loading-overlay" class="iip-loading-overlay" hidden aria-hidden="true">
        <div class="iip-loading-overlay__panel">
          <div class="sip-spinner" aria-hidden="true"></div>
          <p class="iip-loading-overlay__title">${t('sipProcessing')}</p>
          <p class="iip-loading-overlay__sub" id="iip-loading-status">${t('iipAiBadge')}</p>
          <div class="sip-processing-bar"><span class="sip-processing-bar__fill" id="iip-overlay-progress"></span></div>
        </div>
      </div>
      <div class="sip-bar">
        <div class="sip-bar__text">
          <h2 class="card__title sip-bar__title">${t('supplierInvoiceProcessor')}</h2>
          <p class="sip-bar__desc">${t('supplierInvoiceDesc')}</p>
          <span class="sip-ai-badge">${t('iipAiBadge')}</span>
        </div>
      </div>
      <div class="sip-drop-zone" id="sip-drop-zone">
        <input type="file" id="supplier-invoice-input" class="sip-drop-zone__input" accept="image/jpeg,image/png,image/webp,image/*,application/pdf">
        <div class="sip-drop-zone__icon" aria-hidden="true">${UI_ICONS.upload}</div>
        <p class="sip-drop-zone__hint">${t('sipDropHint')}</p>
        <p class="sip-drop-zone__formats">${t('iipFormats')}</p>
        <p class="sip-drop-zone__filename" id="sip-file-name"></p>
      </div>
      <div id="sip-phase-processing" hidden>
        <div class="sip-processing-shell">
          <div class="sip-spinner" id="sip-spinner" role="status" aria-label="${t('sipProcessing')}"></div>
          <p class="sip-processing-text" id="sip-progress-text">${t('sipProcessing')}</p>
          <div class="sip-processing-bar"><span class="sip-processing-bar__fill" id="sip-processing-bar-fill"></span></div>
        </div>
      </div>
      <div id="sip-work-area" hidden>
        <p class="form-hint sip-review__hint" id="sip-review-hint">${t('sipReviewHint')}</p>
        <div class="sip-review-meta">
          <div class="form-field sip-invoice-num-field">
            <label for="sip-invoice-number">${t('iipInvoiceNumber')}</label>
            <input type="text" id="sip-invoice-number" class="sip-invoice-number-input" placeholder="INV-…">
          </div>
        </div>
        <div class="table-wrap sip-review-table-wrap">
          <table class="table table--invoice-ocr table--sip-review">
            <thead><tr>
              <th>${t('iipItemName')}</th>
              <th>${t('qty')}</th>
              <th>${t('sipUnitExVat')}</th>
              <th>${t('iipLineExVat')}</th>
              <th>${t('iipVat15')}</th>
              <th>${t('iipLineIncVat')}</th>
              <th>${t('sipUnitCostAud')}</th>
              <th>${t('sipTotalAud')}</th>
              <th></th>
            </tr></thead>
            <tbody id="sip-review-tbody"></tbody>
            <tfoot>
              <tr class="sip-grand-total-row">
                <td colspan="4"><strong>${t('sipGrandTotal')}</strong></td>
                <td></td>
                <td></td>
                <td class="sip-grand-total-sar-cell">
                  <span class="sip-grand-total-label">${t('sipGrandTotalSar')}</span>
                  <strong id="sip-grand-total-sar" class="sip-grand-total-sar">0.00 SAR</strong>
                </td>
                <td class="sip-grand-total-aud-cell" colspan="2">
                  <span class="sip-grand-total-label">${t('sipGrandTotalAud')}</span>
                  <strong id="sip-grand-total-aud" class="sip-grand-total-aud">$0.00</strong>
                  <small class="sip-grand-total-hint">${t('sipGrandTotalAudHint')}</small>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div class="sip-review-meta sip-fx-footer">
          <div class="form-field">
            <label for="sip-exchange-rate">${t('sipExchangeRate')}</label>
            <input type="number" id="sip-exchange-rate" min="0" step="0.0001" value="${defaultFx}">
          </div>
          <p class="sip-fx-hint" id="sip-fx-label">${t('sipExchangeHint').replace('{rate}', String(defaultFx))}</p>
        </div>
        <div class="sip-review__actions">
          <button type="button" class="btn btn--outline" data-invoice-add-row>${t('invoiceAddRow')}</button>
          <button type="button" class="btn btn--primary btn--with-icon" id="sip-save-inventory">
            ${UI_ICONS.upload}<span>${t('sipApproveSave')}</span>
          </button>
        </div>
      </div>
      <div class="sip-transaction-log card__section" id="sip-transaction-log-wrap" hidden>
        <h4 class="sip-transaction-log__title">${t('invTxLog')}</h4>
        <div class="table-wrap sip-transaction-log__table">
          <table class="table table--compact">
            <thead><tr>
              <th>${t('invTxInvoice')}</th>
              <th>${t('invTxDate')}</th>
              <th>${t('invTxProduct')}</th>
              <th>${t('invTxQtyAdded')}</th>
              <th>${t('invTxCostAud')}</th>
              <th>${t('invTxCreatedBy')}</th>
            </tr></thead>
            <tbody id="sip-transaction-log-tbody"></tbody>
          </table>
        </div>
      </div>
    </div>`;
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getLineImage(line) {
  return line?.image || getProduct(line?.productId)?.image || null;
}

function renderProductImageMarkup(image, name, className = 'pos-cart-card__img') {
  if (image) {
    return `<img class="${className}" src="${image}" alt="${escapeHtml(name || '')}" loading="lazy">`;
  }
  const letter = escapeHtml((name || '?').trim().charAt(0) || '?');
  return `<div class="${className} pos-cart-card__img--ph" aria-hidden="true">${letter}</div>`;
}

function updateProductImagePreview(src) {
  const img = document.getElementById('product-image-preview');
  const ph = document.getElementById('product-image-placeholder');
  const clearBtn = document.getElementById('product-image-clear');
  const data = document.getElementById('product-image-data');
  if (data) data.value = src || '';
  if (src && img) {
    img.src = src;
    img.hidden = false;
    if (ph) ph.hidden = true;
    if (clearBtn) clearBtn.hidden = false;
  } else {
    if (img) {
      img.removeAttribute('src');
      img.hidden = true;
    }
    if (ph) ph.hidden = false;
    if (clearBtn) clearBtn.hidden = true;
  }
}

async function saveExpense(data) {
  if (!UserSession.requireUser()) return;
  const financials = CurrencyEngine.calcExpense({
    amountOriginal: data.amountOriginal,
    currency: data.currency,
    exchangeRate: data.exchangeRate,
    vatRate: state.settings.vatRate,
  });

  const record = {
    id: data.id || uid(),
    name: data.name,
    category: data.category,
    currency: data.currency,
    amountOriginal: data.amountOriginal,
    exchangeRate: data.exchangeRate,
    financials,
    notes: data.notes || '',
    dueDate: data.dueDate || null,
    createdAt: data.createdAt || new Date().toISOString(),
  };

  if (data.id) {
    const i = state.expenses.findIndex((e) => e.id === data.id);
    if (i >= 0) {
      const prev = state.expenses[i];
      state.expenses[i] = { ...record, createdBy: prev.createdBy || UserSession.createdBy() };
    }
  } else {
    state.expenses.unshift({ ...record, ...UserSession.auditFields() });
  }

  if (data.category === 'import' && data.addStock && data.productId) {
    const p = getProduct(data.productId);
    if (p) {
      p.quantity += data.stockQty || 0;
      if (data.updateCost) p.cost = CurrencyEngine.round(financials.audTotal / (data.stockQty || 1));
    }
  }

  await DataStore.save();
  ActivityFeed.log({
    type: 'expense',
    amountAud: financials.audTotal,
    label: record.name,
  });
  showToast(t('saved'));
  renderAll();
}

async function deleteExpense(id) {
  state.expenses = state.expenses.filter((e) => e.id !== id);
  await DataStore.save();
  showToast(t('deleted'));
  renderAll();
}

function saleSourceLabel(source) {
  const key = SALE_SOURCES[source] || SALE_SOURCES.in_store;
  return t(key);
}

async function saveSale(data, options = {}) {
  if (!UserSession.requireUser()) return;
  const p = getProduct(data.productId);
  if (!p) return showToast('No product', 'error');
  if (data.quantity > p.quantity) return showToast(`Stock: ${p.quantity}`, 'error');

  const qty = data.quantity;
  const subtotalAud = data.subtotalAud ?? CurrencyEngine.round((data.unitPriceAud ?? p.price) * qty);
  const lineTotalAud = data.lineTotalAud ?? subtotalAud;
  const unitPriceAud = CurrencyEngine.round(lineTotalAud / qty);

  const sale = withRecordTimestamps({
    id: uid(),
    productId: data.productId,
    productName: p.name,
    productCode: p.code,
    productColor: p.color,
    productStyle: p.style || 'classic',
    quantity: qty,
    unitPriceAud,
    unitCostAud: p.cost,
    subtotalAud,
    lineTotalAud,
    discountType: data.discountType || 'none',
    discountValue: data.discountValue || 0,
    customer: (data.customer || '').trim() || '—',
    createdBy: UserSession.createdBy(),
    payment: data.payment || '—',
    saleSource: data.saleSource || 'in_store',
    paymentMethod: data.paymentMethod || 'cash',
    returned: false,
    invoiceNumber: data.invoiceNumber || InvoiceNumberEngine.next(),
    notes: data.notes || '',
  }, { isNew: true });

  if (DataStore.usesCloud()) {
    let currentTenantId;
    try {
      currentTenantId = requireCurrentTenantIdForSale();
    } catch {
      return;
    }
    const cloud = await DataStore.cloudInsertSale(
      { ...sale, tenantId: currentTenantId, tenant_id: currentTenantId },
      null
    );
    if (!cloud.ok) {
      reportCloudSaveError('Sale save', cloud);
      return;
    }
  }

  state.sales.unshift(sale);
  p.quantity -= qty;

  await DataStore.save();
  ActivityFeed.log({
    type: 'sale',
    amountAud: lineTotalAud,
    label: p.name,
  });

  if (options.lightRefresh) {
    PosEngine.syncCacheFromState();
    refreshDashboardMetrics();
    if (!options.silent) showToast(options.toastKey ? t(options.toastKey) : t('saved'));
    NotificationEngine.evaluate();
    return sale;
  }

  showToast(options.toastKey ? t(options.toastKey) : t('saved'));
  renderAll();
  NotificationEngine.evaluate();
  return sale;
}

// ═══════════════════════════════════════════════════════════════
//  Ultra-Fast POS — cache · search · cart · batch checkout
// ═══════════════════════════════════════════════════════════════

const PosEngine = {
  cache: [],
  cart: [],

  warmCache() {
    this.cache = state.products
      .filter((p) => p.quantity > 0)
      .map((p) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        color: p.color,
        size: p.size,
        price: p.price,
        quantity: p.quantity,
        image: p.image || null,
        search: `${p.code} ${p.name} ${p.color} ${p.size}`.toLowerCase(),
      }));
    return this.cache;
  },

  syncCacheFromState() {
    const map = new Map(state.products.map((p) => [p.id, p]));
    this.cache = this.cache
      .map((c) => {
        const live = map.get(c.id);
        if (!live || live.quantity <= 0) return null;
        return {
          ...c,
          price: live.price,
          quantity: live.quantity,
          image: live.image || null,
          search: `${live.code} ${live.name} ${live.color} ${live.size}`.toLowerCase(),
        };
      })
      .filter(Boolean);
  },

  search(query) {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const out = [];
    for (let i = 0; i < this.cache.length && out.length < 14; i++) {
      if (this.cache[i].search.includes(q)) out.push(this.cache[i]);
    }
    return out;
  },

  calcTotals(unitPrice, qty, discountType, discountValue) {
    const subtotal = CurrencyEngine.round(unitPrice * qty);
    if (!discountType || discountType === 'none' || !discountValue) {
      return { subtotal, discount: 0, total: subtotal };
    }
    let discount = 0;
    if (discountType === 'percent') {
      discount = CurrencyEngine.round(subtotal * (Math.min(100, Math.max(0, discountValue)) / 100));
    } else {
      discount = CurrencyEngine.round(Math.min(Math.max(0, discountValue), subtotal));
    }
    return { subtotal, discount, total: CurrencyEngine.round(subtotal - discount) };
  },

  topSelling(limit = 5) {
    const counts = {};
    state.sales.forEach((s) => {
      counts[s.productId] = (counts[s.productId] || 0) + s.quantity;
    });
    return Object.entries(counts)
      .map(([id, soldQty]) => {
        const p = getProduct(id);
        if (!p || p.quantity <= 0) return null;
        return {
          id: p.id,
          code: p.code,
          name: p.name,
          color: p.color,
          price: p.price,
          quantity: p.quantity,
          soldQty,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.soldQty - a.soldQty)
      .slice(0, limit);
  },

  avatarColor(colorName) {
    const key = (colorName || '').toLowerCase();
    const map = {
      black: '#1c2333', navy: '#1e3a5f', beige: '#b8956a', white: '#e8eaed',
      grey: '#64748b', gray: '#64748b', brown: '#6b4423', green: '#0d6b5c',
      red: '#9f1239', pink: '#db2777', gold: '#9a7b4f',
    };
    return map[key] || '#9a7b4f';
  },

  stockAvailable(productId, excludeLineId = null) {
    const p = getProduct(productId);
    if (!p) return 0;
    const inCart = this.cart
      .filter((l) => l.productId === productId && l.cartLineId !== excludeLineId)
      .reduce((s, l) => s + l.qty, 0);
    return Math.max(0, p.quantity - inCart);
  },

  findProductVariant(code, size, color) {
    return state.products.find(
      (p) => p.code === code && String(p.size) === String(size) && (!color || p.color === color)
    ) || state.products.find((p) => p.code === code && String(p.size) === String(size));
  },

  createCartLine(product, qty = 1) {
    const line = {
      cartLineId: uid(),
      productId: product.id,
      name: product.name,
      code: product.code,
      color: product.color,
      size: product.size,
      image: product.image || null,
      unitPrice: product.price,
      qty: Math.max(1, qty),
      discountType: 'none',
      discountValue: 0,
      extraShipping: 0,
      lineSubtotal: 0,
      lineDiscount: 0,
      lineTotal: 0,
    };
    return this.recalcLine(line);
  },

  recalcLine(line) {
    const base = CurrencyEngine.round(line.unitPrice * line.qty + (parseFloat(line.extraShipping) || 0));
    const { discount, total } = this.calcTotals(base, 1, line.discountType, line.discountValue);
    line.lineSubtotal = base;
    line.lineDiscount = discount;
    line.lineTotal = total;
    return line;
  },

  cartSubtotal() {
    return CurrencyEngine.round(this.cart.reduce((s, line) => s + line.lineSubtotal, 0));
  },

  cartDiscountTotal() {
    return CurrencyEngine.round(this.cart.reduce((s, line) => s + line.lineDiscount, 0));
  },

  calcCartTotals() {
    const subtotal = this.cartSubtotal();
    const discount = this.cartDiscountTotal();
    return {
      subtotal,
      discount,
      total: CurrencyEngine.round(this.cart.reduce((s, line) => s + line.lineTotal, 0)),
    };
  },
};

/**
 * POS checkout — stock is deducted here only (not while items sit in cart).
 * Cloud saves use secureInsert('sales', …) for tenant isolation + AI anomaly hooks.
 */
async function savePosCartBatch(lines, paymentMethod = 'cash', cartTotals = null, options = {}) {
  if (!lines.length) return false;
  if (!UserSession.requireUser()) return false;

  for (const line of lines) {
    const p = getProduct(line.productId);
    if (!p || line.qty > p.quantity) {
      showToast(`${line.name}: ${t('out')}`, 'error');
      return false;
    }
  }

  const totals = cartTotals || PosEngine.calcCartTotals();
  const batchId = uid().slice(0, 8);
  const batchIdForCloud = Date.now();
  const invoiceNumber = InvoiceNumberEngine.next();
  if (!invoiceNumber || !String(invoiceNumber).trim()) {
    showToast('Invoice number error', 'error');
    return false;
  }
  const payLabel = paymentMethodLabel(paymentMethod);
  const createdBy = UserSession.createdBy();
  const batchCustomer = (options.customer || document.getElementById('pos-customer')?.value || '')
    .trim() || 'POS Guest';
  const created = [];

  for (const line of lines) {
    const p = getProduct(line.productId);
    const lineSub = line.lineSubtotal ?? CurrencyEngine.round(line.unitPrice * line.qty + (line.extraShipping || 0));
    const lineTotal = line.lineTotal ?? lineSub;
    const lineCustomer = (line.customer || batchCustomer).trim() || batchCustomer;
    const saleId = uid();

    const localSale = withRecordTimestamps({
      id: saleId,
      productId: line.productId,
      productName: p.name,
      productCode: p.code,
      productColor: p.color,
      productStyle: p.style || 'classic',
      productSize: line.size || p.size,
      quantity: line.qty,
      unitPriceAud: CurrencyEngine.round(lineTotal / line.qty),
      unitCostAud: p.cost,
      subtotalAud: lineSub,
      lineTotalAud: lineTotal,
      discountType: line.discountType || 'none',
      discountValue: line.discountValue || 0,
      extraShipping: line.extraShipping || 0,
      customer: lineCustomer,
      createdBy,
      payment: payLabel,
      paymentMethod,
      saleSource: 'off_store',
      invoiceNumber,
      batchId,
      returned: false,
      notes: `سلة POS · ${invoiceNumber}`,
    }, { isNew: true });

    if (DataStore.usesCloud()) {
      let currentTenantId;
      try {
        currentTenantId = requireCurrentTenantIdForSale();
      } catch {
        return false;
      }

      const ready = await DataStore._cloudReadyForSalesInsert();
      if (!ready.ok) {
        reportCloudSaveError('POS sale', ready);
        return false;
      }

      const row = buildSalesInsertRow({
        id: saleId,
        createdAt: localSale.createdAt,
        customerName: lineCustomer,
        productName: p.name,
        price: CurrencyEngine.round(lineTotal / line.qty),
        quantity: parseInt(line.qty, 10) || 1,
        createdBy,
        invoiceNumber,
        lineTotalAud: lineTotal,
        batchId: batchIdForCloud,
        status: 'completed',
      });

      const cloud = await SupabaseBridge.secureInsert('sales', row);
      if (!cloud.ok) {
        reportCloudSaveError('POS sale', cloud);
        return false;
      }
      if (cloud.anomaly) {
        showToast('تنبيه ذكي: تم تسجيل عملية غير اعتيادية في ai_alerts', 'error');
      }
    }

    state.sales.unshift(localSale);
    p.quantity -= line.qty;
    created.push(localSale);
  }

  await DataStore.save();
  ActivityFeed.log({
    type: 'pos_sale',
    amountAud: totals.total,
    label: invoiceNumber,
  });
  PosEngine.syncCacheFromState();
  refreshDashboardMetrics();
  NotificationEngine.evaluate();
  return created;
}

function posLineUnitAfterDiscount(line) {
  if (!line?.qty) return line?.unitPrice || 0;
  return CurrencyEngine.round(line.lineTotal / line.qty);
}

const PosUI = {
  editingLineId: null,

  getItem(productId) {
    return PosEngine.cache.find((p) => p.id === productId) || getProduct(productId);
  },

  addToCart(productId, qty = 1) {
    const live = getProduct(productId);
    if (!live) return showToast(t('out'), 'error');

    const available = PosEngine.stockAvailable(productId);
    if (available <= 0) return showToast(t('out'), 'error');

    const existing = PosEngine.cart.find((l) => l.productId === productId && l.size === live.size);
    if (existing) {
      const nextQty = existing.qty + qty;
      if (nextQty > PosEngine.stockAvailable(productId, existing.cartLineId) + existing.qty) {
        return showToast(`${t('posAvailableStock')}: ${PosEngine.stockAvailable(productId, existing.cartLineId) + existing.qty}`, 'error');
      }
      existing.qty = nextQty;
      if (!existing.image && live.image) existing.image = live.image;
      PosEngine.recalcLine(existing);
    } else {
      if (qty > available) return showToast(`${t('posAvailableStock')}: ${available}`, 'error');
      PosEngine.cart.push(PosEngine.createCartLine(live, qty));
    }

    document.getElementById('pos-search-results')?.classList.remove('pos-results--open');
    this.renderCart();
    this.renderQuickAdd();
    this.toggleDrawer(true);
    showToast(t('posAddedToCart'));
  },

  removeFromCart(cartLineId) {
    PosEngine.cart = PosEngine.cart.filter((l) => l.cartLineId !== cartLineId);
    this.renderCart();
  },

  setCartQty(cartLineId, qty) {
    const line = PosEngine.cart.find((l) => l.cartLineId === cartLineId);
    if (!line) return;
    const max = PosEngine.stockAvailable(line.productId, line.cartLineId) + line.qty;
    line.qty = Math.min(max, Math.max(1, qty));
    PosEngine.recalcLine(line);
    this.renderCart();
  },

  renderQuickAdd() {
    const strip = document.getElementById('pos-quick-add');
    if (!strip) return;
    const top = PosEngine.topSelling(5);
    if (!top.length) {
      strip.innerHTML = '';
      return;
    }
    strip.innerHTML = top.map((p) => `
      <button type="button" class="pos-quick-chip" data-pos-add="${p.id}">
        ${p.name} · ${formatAUD(p.price)}
      </button>`).join('');
  },

  openLineEdit(cartLineId) {
    const line = PosEngine.cart.find((l) => l.cartLineId === cartLineId);
    if (!line) return;
    this.editingLineId = cartLineId;

    const modal = document.getElementById('pos-line-edit-modal');
    const title = document.getElementById('pos-line-edit-title');
    const sizeSel = document.getElementById('pos-edit-size');
    const qty = document.getElementById('pos-edit-qty');
    const ship = document.getElementById('pos-edit-shipping');
    const discType = document.getElementById('pos-edit-discount-type');
    const discVal = document.getElementById('pos-edit-discount-value');
    const stockHint = document.getElementById('pos-edit-stock-hint');

    if (title) title.textContent = line.name;
    if (sizeSel) {
      sizeSel.innerHTML = PRODUCT_SIZES.map((s) =>
        `<option value="${s}"${String(s) === String(line.size) ? ' selected' : ''}>${s}</option>`
      ).join('');
    }
    if (qty) {
      qty.value = line.qty;
      qty.max = String(PosEngine.stockAvailable(line.productId, line.cartLineId) + line.qty);
    }
    if (ship) ship.value = line.extraShipping || 0;
    this.setEditDiscountType(line.discountType || 'none');
    if (discVal) discVal.value = line.discountValue || 0;
    this.updateStockHint();
    this.updateLineEditPreview();
    if (modal) modal.hidden = false;
  },

  closeLineEdit() {
    const modal = document.getElementById('pos-line-edit-modal');
    if (modal) modal.hidden = true;
    this.editingLineId = null;
  },

  openLineDiscount(cartLineId) {
    const line = PosEngine.cart.find((l) => l.cartLineId === cartLineId);
    if (!line) return;
    this.editingLineId = cartLineId;
    const title = document.getElementById('pos-discount-line-title');
    const val = document.getElementById('pos-dsc-value');
    if (title) title.textContent = line.name;
    this.setDiscountModalType(line.discountType || 'none');
    if (val) val.value = line.discountValue || 0;
    const modal = document.getElementById('pos-discount-modal');
    if (modal) modal.hidden = false;
  },

  closeLineDiscount() {
    const modal = document.getElementById('pos-discount-modal');
    if (modal) modal.hidden = true;
    this.editingLineId = null;
  },

  setDiscountModalType(type) {
    const discType = document.getElementById('pos-dsc-type');
    const wrap = document.getElementById('pos-dsc-value-wrap');
    if (discType) discType.value = type;
    if (wrap) wrap.classList.toggle('hidden', type === 'none');
    document.querySelectorAll('[data-pos-dsc-type]').forEach((btn) => {
      btn.classList.toggle('pos-discount-toggle__btn--active', btn.dataset.posDscType === type);
    });
  },

  saveLineDiscount() {
    const line = PosEngine.cart.find((l) => l.cartLineId === this.editingLineId);
    if (!line) return;
    line.discountType = document.getElementById('pos-dsc-type')?.value || 'none';
    line.discountValue = parseFloat(document.getElementById('pos-dsc-value')?.value) || 0;
    PosEngine.recalcLine(line);
    this.closeLineDiscount();
    this.editingLineId = null;
    this.renderCart();
    showToast(t('saved'));
  },

  setEditDiscountType(type) {
    const discType = document.getElementById('pos-edit-discount-type');
    const wrap = document.getElementById('pos-edit-discount-wrap');
    if (discType) discType.value = type;
    if (wrap) wrap.classList.toggle('hidden', type === 'none');
    document.querySelectorAll('[data-pos-disc-type]').forEach((btn) => {
      btn.classList.toggle('pos-discount-toggle__btn--active', btn.dataset.posDiscType === type);
    });
    this.updateLineEditPreview();
  },

  updateStockHint() {
    const line = PosEngine.cart.find((l) => l.cartLineId === this.editingLineId);
    const stockHint = document.getElementById('pos-edit-stock-hint');
    const urgentEl = document.getElementById('pos-edit-size-urgent');
    if (!line) return;

    const newSize = document.getElementById('pos-edit-size')?.value || line.size;
    const variant = PosEngine.findProductVariant(line.code, newSize, line.color);
    const productId = variant?.id || line.productId;
    const available = PosEngine.stockAvailable(productId, line.cartLineId)
      + (productId === line.productId ? line.qty : 0);

    if (stockHint) {
      stockHint.textContent = `${t('posAvailableStock')}: ${available}`;
      stockHint.classList.remove('pos-edit-stock--urgent');
    }

    if (urgentEl) {
      if (available > 0 && available < POS_STOCK_URGENT_THRESHOLD) {
        urgentEl.textContent = t('posStockUrgent').replace('{n}', String(available));
        urgentEl.hidden = false;
        if (stockHint) stockHint.classList.add('pos-edit-stock--urgent');
      } else {
        urgentEl.hidden = true;
        urgentEl.textContent = '';
      }
    }
  },

  updateLineEditPreview() {
    const line = PosEngine.cart.find((l) => l.cartLineId === this.editingLineId);
    const preview = document.getElementById('pos-edit-preview-total');
    if (!line || !preview) return;
    this.updateStockHint();
    const draft = { ...line };
    draft.qty = parseInt(document.getElementById('pos-edit-qty')?.value, 10) || 1;
    draft.extraShipping = parseFloat(document.getElementById('pos-edit-shipping')?.value) || 0;
    draft.discountType = document.getElementById('pos-edit-discount-type')?.value || 'none';
    draft.discountValue = parseFloat(document.getElementById('pos-edit-discount-value')?.value) || 0;
    PosEngine.recalcLine(draft);
    preview.innerHTML = `
      <span>${t('posSubtotal')}: ${formatAUD(draft.lineSubtotal)}</span>
      ${draft.lineDiscount > 0 ? `<span>−${formatAUD(draft.lineDiscount)}</span>` : ''}
      <strong>${t('posTotal')}: ${formatAUD(draft.lineTotal)}</strong>`;
  },

  saveLineEdit() {
    const line = PosEngine.cart.find((l) => l.cartLineId === this.editingLineId);
    if (!line) return;

    const newSize = document.getElementById('pos-edit-size')?.value;
    const variant = PosEngine.findProductVariant(line.code, newSize, line.color);
    if (!variant) return showToast(t('out'), 'error');

    const qty = parseInt(document.getElementById('pos-edit-qty')?.value, 10) || 1;
    const max = PosEngine.stockAvailable(variant.id, line.cartLineId) + (line.productId === variant.id ? line.qty : 0);
    if (qty > max) return showToast(`${t('posAvailableStock')}: ${max}`, 'error');

    line.productId = variant.id;
    line.name = variant.name;
    line.size = variant.size;
    line.unitPrice = variant.price;
    line.image = variant.image || null;
    line.qty = qty;
    line.extraShipping = parseFloat(document.getElementById('pos-edit-shipping')?.value) || 0;
    line.discountType = document.getElementById('pos-edit-discount-type')?.value || 'none';
    line.discountValue = parseFloat(document.getElementById('pos-edit-discount-value')?.value) || 0;
    PosEngine.recalcLine(line);

    this.closeLineEdit();
    this.renderCart();
    showToast(t('saved'));
  },

  updateTotals() {
    const totals = PosEngine.calcCartTotals();
    const subEl = document.getElementById('pos-cart-subtotal');
    const discEl = document.getElementById('pos-cart-discount-amt');
    const discRow = document.getElementById('pos-cart-discount-row');
    const totalEl = document.getElementById('pos-cart-grand-total');
    const badge = document.getElementById('pos-cart-badge');

    if (subEl) subEl.textContent = formatAUD(totals.subtotal);
    if (discEl) discEl.textContent = `−${formatAUD(totals.discount)}`;
    if (discRow) discRow.hidden = totals.discount <= 0;
    if (totalEl) totalEl.textContent = formatAUD(totals.total);

    const count = PosEngine.cart.reduce((s, l) => s + l.qty, 0);
    if (badge) {
      badge.textContent = String(count);
      badge.hidden = count <= 0;
    }

    const payBtn = document.getElementById('pos-complete-payment');
    if (payBtn) {
      payBtn.disabled = !PosEngine.cart.length;
      payBtn.innerHTML = PosEngine.cart.length
        ? formatPosPayButton(totals.total)
        : `${UI_ICONS.cart}<span class="pos-pay-btn__text">${t('posCompletePayment')}</span>`;
    }
    const drawer = document.getElementById('pos-drawer');
    if (drawer) drawer.classList.toggle('pos-drawer--has-items', PosEngine.cart.length > 0);
  },

  renderCart() {
    const linesEl = document.getElementById('pos-cart-lines');
    if (!linesEl) return;

    if (!PosEngine.cart.length) {
      linesEl.innerHTML = `<p class="pos-cart__empty">${t('posCartEmpty')}</p>`;
      this.updateTotals();
      return;
    }

    linesEl.innerHTML = PosEngine.cart.map((line) => {
      const unitAfter = posLineUnitAfterDiscount(line);
      const hasDisc = line.lineDiscount > 0;
      return `
      <article class="pos-cart-card pos-cart-card--clickable" data-cart-line="${line.cartLineId}" data-pos-open-line="${line.cartLineId}" role="button" tabindex="0" aria-label="${escapeHtml(line.name)} — ${t('edit')}">
        <header class="pos-cart-card__header">
          <div class="pos-cart-card__media">
            ${renderProductImageMarkup(getLineImage(line), line.name)}
          </div>
          <div class="pos-cart-card__head-text">
            <h4 class="pos-cart-card__name">${escapeHtml(line.name)}</h4>
            <span class="pos-cart-card__size">${t('size')}: ${escapeHtml(String(line.size))}</span>
          </div>
          <button type="button" class="pos-cart-card__remove" data-pos-cart-remove="${line.cartLineId}" data-pos-stop aria-label="${t('posRemove')}">×</button>
        </header>
        <div class="pos-cart-card__stack">
          <div class="pos-cart-card__row">
            <span class="pos-cart-card__lbl">${t('posPriceAfterDisc')}</span>
            <div class="pos-cart-card__vals">
              <strong class="pos-cart-card__price-val num-digits">${formatAUD(unitAfter)}</strong>
              ${hasDisc ? `<em class="pos-cart-card__was num-digits">${formatAUD(line.unitPrice)}</em>` : ''}
              ${hasDisc ? `<span class="pos-cart-card__disc-tag num-digits">−${formatAUD(line.lineDiscount)}</span>` : ''}
            </div>
          </div>
          <div class="pos-cart-card__row" data-pos-stop>
            <span class="pos-cart-card__lbl">${t('qty')}</span>
            <div class="pos-cart-card__qty">
              <button type="button" class="pos-cart__qty-btn" data-pos-cart-minus="${line.cartLineId}" aria-label="−">−</button>
              <span class="pos-cart__qty-val num-digits">${line.qty}</span>
              <button type="button" class="pos-cart__qty-btn" data-pos-cart-plus="${line.cartLineId}" aria-label="+">+</button>
            </div>
          </div>
          <div class="pos-cart-card__row pos-cart-card__row--total">
            <span class="pos-cart-card__lbl">${t('posCartTotal')}</span>
            <strong class="pos-cart-card__line-total num-digits">${formatAUD(line.lineTotal)}</strong>
          </div>
        </div>
        <div class="pos-cart-card__actions" data-pos-stop>
          <button type="button" class="pos-cart-card__disc-btn${hasDisc ? ' pos-cart-card__disc-btn--active' : ''}" data-pos-discount-line="${line.cartLineId}" aria-label="${t('posDiscountLine')} — ${escapeHtml(line.name)}">${UI_ICONS.discount}</button>
        </div>
      </article>`;
    }).join('');

    this.updateTotals();
  },

  toggleDrawer(open) {
    const drawer = document.getElementById('pos-drawer');
    const backdrop = document.getElementById('pos-drawer-backdrop');
    if (!drawer) return;
    const show = open ?? !drawer.classList.contains('pos-drawer--open');
    drawer.classList.toggle('pos-drawer--open', show);
    if (backdrop) backdrop.classList.toggle('pos-drawer-backdrop--show', show);
  },

  openPaymentModal() {
    if (!PosEngine.cart.length) return;
    this.updateTotals();
    const modal = document.getElementById('pos-payment-modal');
    const sumEl = document.getElementById('pos-payment-sum');
    if (sumEl) sumEl.textContent = formatAUD(PosEngine.calcCartTotals().total);
    if (modal) modal.hidden = false;
  },

  closePaymentModal() {
    const modal = document.getElementById('pos-payment-modal');
    if (modal) modal.hidden = true;
  },

  async confirmPayment(paymentMethod) {
    if (!PosEngine.cart.length) return;

    const lines = PosEngine.cart.map((l) => ({ ...l }));
    const totals = PosEngine.calcCartTotals();
    const created = await savePosCartBatch(lines, paymentMethod, totals);
    if (!created) return;

    PosEngine.cart = [];

    this.closePaymentModal();
    this.renderCart();
    this.renderQuickAdd();
    this.toggleDrawer(false);
    PosEngine.warmCache();

    const hint = document.getElementById('pos-cache-hint');
    if (hint) {
      hint.textContent = PosEngine.cache.length
        ? `${PosEngine.cache.length} ${t('available')}`
        : t('posNoStock');
    }

    const lastEl = document.getElementById('pos-last-sale');
    const invNo = created[0]?.invoiceNumber || '—';
    if (lastEl) {
      lastEl.innerHTML = `<strong>${t('posLastSale')}:</strong> ${invNo} · ${lines.length} ${t('qty')} · ${formatAUD(totals.total)} · ${paymentMethodLabel(paymentMethod)}`;
    }

    showToast(t('posPaymentSuccess').replace('{inv}', invNo));
    document.getElementById('pos-search')?.focus({ preventScroll: true });
  },

  completePayment() {
    this.openPaymentModal();
  },

  bumpCartLine(cartLineId, delta) {
    const line = PosEngine.cart.find((l) => l.cartLineId === cartLineId);
    if (!line) return;
    this.setCartQty(cartLineId, line.qty + delta);
  },

  renderResults(query) {
    const box = document.getElementById('pos-search-results');
    if (!box) return;

    const matches = PosEngine.search(query);
    if (!query.trim()) {
      box.innerHTML = '';
      box.classList.remove('pos-results--open');
      return;
    }

    if (!matches.length) {
      box.innerHTML = `<div class="pos-results__empty">${t('posNoResults')}</div>`;
      box.classList.add('pos-results--open');
      return;
    }

    box.innerHTML = matches.map((p) => `
      <button type="button" class="pos-results__item" data-pos-add="${p.id}">
        <span class="pos-results__left">
          <span class="pos-results__name">${escapeHtml(p.name)}</span>
          <span class="pos-results__meta">${escapeHtml(p.code)} · ${escapeHtml(p.color)}</span>
        </span>
        <span class="pos-results__right">
          <strong class="num-digits">${formatAUD(p.price)}</strong>
          <em class="num-digits">${formatNum(PosEngine.stockAvailable(p.id), { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ${t('posInStock')}</em>
        </span>
      </button>`).join('');
    box.classList.add('pos-results--open');
  },

  onSearchInput(value) {
    this.renderResults(value);
  },

  initPanel() {
    PosEngine.warmCache();
    const hint = document.getElementById('pos-cache-hint');
    if (hint) {
      hint.textContent = PosEngine.cache.length
        ? `${PosEngine.cache.length} ${t('available')}`
        : t('posNoStock');
    }
    this.renderQuickAdd();
    this.renderCart();
    const search = document.getElementById('pos-search');
    if (search) {
      search.value = '';
      this.renderResults('');
      search.focus({ preventScroll: true });
    }
  },
};

function refreshDashboardMetrics() {
  const exp = AnalyticsEngine.totalExpensesAUD();
  const rev = AnalyticsEngine.totalRevenueAUD();
  const profit = AnalyticsEngine.netProfitAUD();
  const dist = AnalyticsEngine.costDistribution();
  const forecast = AnalyticsEngine.profitForecast();
  const alerts = AnalyticsEngine.lowStockAlerts();
  const turnover = AnalyticsEngine.inventoryTurnover();
  const fx = state.settings.exchangeRates;
  const proactive = PredictiveBuyingEngine.proactiveAlerts();

  const statsEl = document.getElementById('dash-stats');
  if (statsEl) {
    statsEl.innerHTML = [
      { l: t('profitAud'), v: formatAUD(profit), c: 'stat-card--accent' },
      { l: t('revenueAud'), v: formatAUD(rev), c: 'stat-card--success' },
      { l: t('expensesAud'), v: formatAUD(exp), c: 'stat-card--warning' },
      { l: t('totalProducts'), v: state.products.length, c: '' },
      { l: t('totalStock'), v: state.products.reduce((s, p) => s + p.quantity, 0), c: '' },
      { l: t('totalSales'), v: state.sales.length, c: '' },
    ].map((i) => `<article class="stat-card ${i.c}"><span class="stat-card__label">${i.l}</span><strong class="stat-card__value">${i.v}</strong></article>`).join('');
  }

  const insights = document.getElementById('insights-bar');
  if (insights) {
    insights.innerHTML = `
      <div class="insight-chip insight-chip--ai">✦ ${t('aiInsights')}</div>
      ${fx?.audPerSar ? `<div class="insight-chip insight-chip--live">${t('sarToAud')} <strong>${fx.audPerSar}</strong></div>` : ''}
      <div class="insight-chip">${t('inventoryTurnover')}: <strong>${turnover.rate}×</strong></div>
      ${alerts.length ? `<div class="insight-chip insight-chip--warn">⚠ ${alerts.length} ${t('stockAlerts')}</div>` : ''}
      ${proactive.length ? `<div class="insight-chip insight-chip--warn">📦 ${proactive.length} ${t('predictiveBuying')}</div>` : ''}
      ${AnalyticsEngine.totalReturnsAUD() > 0 ? `<div class="insight-chip insight-chip--warn">↩ ${formatAUD(AnalyticsEngine.totalReturnsAUD())} ${t('totalReturns')}</div>` : ''}
      <div class="insight-chip">${t('abayaShare')}: <strong>${dist.abayasPct}%</strong></div>
      <div class="insight-chip">${t('shippingShare')}: <strong>${dist.shippingPct}%</strong></div>
      <div class="insight-chip">${t('forecastNote')}: <strong>${formatAUD(forecast.projectedMonthly)}</strong></div>`;
  }

  const ai = document.getElementById('analytics-insights');
  if (ai) ai.innerHTML = insights?.innerHTML || '';

  renderSmartDashboard();
}


async function deleteSale(id) {
  const sale = state.sales.find((s) => s.id === id);
  if (sale) {
    const p = getProduct(sale.productId);
    if (p) p.quantity += sale.quantity;
  }
  state.sales = state.sales.filter((s) => s.id !== id);
  await DataStore.save();
  showToast(t('deleted'));
  renderAll();
}

// ═══════════════════════════════════════════════════════════════
//  Render — App Shell (cached template parts)
// ═══════════════════════════════════════════════════════════════

const NAV_TABS = ['dashboard', 'pos', 'expenses', 'inventory', 'sales', 'returns', 'analytics', 'users', 'settings'];

function navTabsForUser() {
  return AuthSystem.isAdmin() ? NAV_TABS : NAV_TABS.filter((tab) => tab !== 'users');
}

function renderSiteNav(activeTab = 'dashboard') {
  const nav = document.getElementById('site-nav');
  if (!nav) return;
  const tabs = AuthSystem.isLoggedIn() ? navTabsForUser() : ['dashboard'];
  nav.innerHTML = tabs.map((tab) =>
    `<button type="button" class="site-nav__btn${tab === activeTab ? ' site-nav__btn--active' : ''}"
      id="nav-${tab}"
      data-tab="${tab}"
      data-target="${tab}"
      aria-controls="${tab}"
      aria-current="${tab === activeTab ? 'page' : 'false'}">${t(tab)}</button>`
  ).join('');
}

function getActiveTab() {
  const active = document.querySelector('.site-nav__btn--active');
  return active?.dataset.target || active?.dataset.tab
    || document.querySelector('.panel.panel--active')?.id
    || 'dashboard';
}

function renderApp() {
  const app = document.getElementById('app');
  if (!app) return;

  // if (!AuthSystem.isLoggedIn()) { ... } — login disabled (AUTH_SKIP_LOGIN)

  const activeTab = getActiveTab();
  const allowed = navTabsForUser();
  const tab = allowed.includes(activeTab) ? activeTab : 'dashboard';
  renderSiteNav(tab);

  const panel = (id, html) =>
    `<section id="${id}" class="panel${tab === id ? ' panel--active' : ''}">${html}</section>`;

  app.innerHTML = `
    <main class="app-main">
      ${panel('dashboard', renderDashboardHTML())}
      ${panel('pos', renderPosHTML())}
      ${panel('expenses', renderExpensesHTML())}
      ${panel('inventory', renderInventoryHTML())}
      ${panel('sales', renderSalesHTML())}
      ${panel('returns', renderReturnsHTML())}
      ${panel('analytics', renderAnalyticsHTML())}
      ${panel('users', renderUsersHTML())}
      ${panel('settings', renderSettingsHTML())}
    </main>`;
  enforceAutocompleteOff(app);
}

function renderUsersHTML() {
  if (!AuthSystem.isAdmin()) {
    return `<div class="card"><p class="empty">${t('authRequired')}</p></div>`;
  }
  return `
    <div class="card card--users-admin">
      <h2 class="card__title">${t('userManagement')}</h2>
      <p class="form-hint">${t('userManagementDesc')}</p>
      <form id="user-add-form" class="auth-form user-add-form">
        <div id="user-add-error" class="auth-form__error" hidden role="alert"></div>
        <div class="form-grid">
          <div class="form-field">
            <label for="user-add-username">${t('authUsername')}</label>
            <input type="text" id="user-add-username" required maxlength="48" autocomplete="off">
          </div>
          <div class="form-field">
            <label for="user-add-password">${t('authPassword')}</label>
            <div class="auth-password-wrap">
              <input type="password" id="user-add-password" required minlength="6" autocomplete="off">
              <button type="button" class="auth-password-toggle" data-auth-toggle-pwd="user-add-password" aria-pressed="false">
                <span class="auth-password-toggle__icon auth-password-toggle__icon--show" aria-hidden="true">👁</span>
                <span class="auth-password-toggle__icon auth-password-toggle__icon--hide" aria-hidden="true">🙈</span>
              </button>
            </div>
          </div>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn--primary">${t('addSystemUser')}</button>
        </div>
      </form>
    </div>
    <div class="card">
      <h3 class="card__title">${t('usersList')}</h3>
      <div class="table-wrap">
        <table class="table table--compact">
          <thead><tr>
            <th>${t('authUsername')}</th>
            <th>${t('status')}</th>
            <th>${t('userCreatedAt')}</th>
            <th>${t('userCreatedByCol')}</th>
            <th>${t('actions')}</th>
          </tr></thead>
          <tbody id="users-tbody"></tbody>
        </table>
      </div>
    </div>`;
}

function renderDashboardHTML() {
  return `
    <section class="activity-feed card" id="activity-feed-panel" aria-live="polite">
      <div class="activity-feed__head">
        <h2 class="card__title activity-feed__title">📡 ${t('activityFeedTitle')}</h2>
        <span class="activity-feed__pulse" aria-hidden="true"></span>
      </div>
      <ul class="activity-feed__list" id="activity-feed-list"></ul>
    </section>
    <div class="export-bar card">
      <div class="export-bar__info">
        <strong>${t('exportFull')}</strong>
        <span>${t('sheetSales')} · ${t('sheetExpenses')} · ${t('sheetInventory')} · ${t('sheetSummary')}</span>
      </div>
      ${exportFullBtn()}
    </div>
    <section class="smart-dashboard card" id="smart-dashboard">
      <div class="smart-dashboard__head">
        <h2 class="card__title smart-dashboard__title">✦ ${t('smartDashboard')}</h2>
        <span class="smart-dashboard__badge">${t('aiInsights')}</span>
      </div>
      <div class="smart-dashboard__grid">
        <article class="smart-metric" id="turnover-metric">
          <span class="smart-metric__label">${t('inventoryTurnover')}</span>
          <strong class="smart-metric__value" id="turnover-value">—</strong>
          <p class="smart-metric__hint">${t('turnoverDesc')}</p>
          <div class="smart-metric__sub" id="turnover-sub"></div>
        </article>
        <div class="chart-card chart-card--smart">
          <h3 class="chart-card__title">${t('weeklySales')}</h3>
          <canvas id="chart-weekly-sales"></canvas>
        </div>
        <article class="smart-alerts" id="stock-alerts-panel">
          <div class="smart-alerts__head">
            <h3 class="smart-alerts__title">⚠ ${t('stockAlerts')}</h3>
            <span class="smart-alerts__count" id="alerts-count">0</span>
          </div>
          <ul class="smart-alerts__list" id="stock-alerts-list"></ul>
        </article>
      </div>
      <article class="predictive-panel card" id="predictive-panel">
        <div class="predictive-panel__head">
          <h3 class="predictive-panel__title">✦ ${t('predictiveBuying')}</h3>
          <span class="predictive-panel__badge" id="predictive-shipping-badge" hidden>${t('shippingTrendUp')}</span>
        </div>
        <p class="predictive-panel__desc">${t('predictiveBuyingDesc')}</p>
        <ul class="predictive-panel__list" id="predictive-alerts-list"></ul>
      </article>
    </section>
    <div class="insights" id="insights-bar"></div>
    <div class="stats" id="dash-stats"></div>
    <div class="charts-grid charts-grid--dashboard">
      <div class="chart-card"><h3 class="chart-card__title">${t('profitAud')}</h3><canvas id="chart-profit"></canvas></div>
      <div class="chart-card"><h3 class="chart-card__title">${t('costDist')}</h3><canvas id="chart-cost-dist"></canvas></div>
      <div class="chart-card"><h3 class="chart-card__title">${t('profitForecast')}</h3><canvas id="chart-forecast"></canvas></div>
      <div class="chart-card"><h3 class="chart-card__title">${t('topProducts')}</h3><canvas id="chart-top"></canvas></div>
    </div>`;
}

function renderPosHTML() {
  const payBtns = PAYMENT_METHODS.map((m) =>
    `<button type="button" class="pos-pay-option" data-pos-pay="${m.id}">${paymentMethodIcon(m.id)}<span>${t(m.key)}</span></button>`
  ).join('');

  return `
    <div class="pos-ultra pos-page">
      <header class="pos-ultra__head card card--pos">
        <div>
          <h2 class="card__title">${t('pos')}</h2>
          <p class="pos-ultra__hint">${t('posTapHint')}</p>
        </div>
        <div class="pos-ultra__actions">
          <button type="button" class="btn btn--outline btn--sm pos-cart-toggle" id="pos-toggle-cart">
            ${t('posOpenCart')} <span class="pos-cart-badge" id="pos-cart-badge" hidden>0</span>
          </button>
        </div>
      </header>
      <div class="pos-layout">
        <div class="pos-main">
          <div class="pos-search-wrap">
            <svg class="pos-search__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3-3"/></svg>
            <input type="search" id="pos-search" class="pos-search" placeholder="${t('posSearchPlaceholder')}" autocomplete="off" enterkeyhint="search" aria-autocomplete="list" aria-controls="pos-search-results" data-lpignore="true" data-form-type="other">
            <div id="pos-search-results" class="pos-results" role="listbox"></div>
          </div>
          <div id="pos-quick-add" class="pos-quick-add"></div>
          <p class="pos-last-sale" id="pos-last-sale"></p>
          <p class="pos-cache-hint" id="pos-cache-hint"></p>
        </div>
        <div id="pos-drawer-backdrop" class="pos-drawer-backdrop" data-pos-drawer-close></div>
        <aside class="pos-drawer card" id="pos-drawer">
          <header class="pos-drawer__head">
            <h3 class="pos-section-title">${t('posCartDrawer')}</h3>
            <button type="button" class="pos-drawer__close" data-pos-drawer-close aria-label="${t('posClose')}">×</button>
          </header>
          <p class="pos-cart-hint">${t('posCartTapEdit')}</p>
          <div id="pos-cart-lines" class="pos-cart__list" role="list"></div>
          <div class="pos-drawer__totals">
            <div class="pos-totals__row"><span>${t('posSubtotal')}</span><strong id="pos-cart-subtotal">${formatAUD(0)}</strong></div>
            <div class="pos-totals__row pos-totals__row--disc" id="pos-cart-discount-row" hidden><span>${t('posDiscount')}</span><strong id="pos-cart-discount-amt">—</strong></div>
            <div class="pos-totals__row pos-totals__row--total"><span>${t('posCartTotal')}</span><strong id="pos-cart-grand-total">${formatAUD(0)}</strong></div>
          </div>
          <button type="button" class="btn btn--pos-pay btn--with-icon" id="pos-complete-payment" disabled>${UI_ICONS.cart}<span class="pos-pay-btn__text">${t('posCompletePayment')}</span></button>
        </aside>
      </div>
    </div>
    <div id="pos-payment-modal" class="pos-modal" hidden>
      <div class="pos-modal__backdrop" data-pos-payment-close></div>
      <div class="pos-modal__sheet pos-modal__sheet--pay">
        <h3 class="pos-modal__title">${t('posSelectPayment')}</h3>
        <p class="pos-payment-sum">${t('posCartTotal')}: <strong id="pos-payment-sum">${formatAUD(0)}</strong></p>
        <div class="pos-pay-options">${payBtns}</div>
        <button type="button" class="btn btn--outline" data-pos-payment-close>${t('cancel')}</button>
      </div>
    </div>
    <div id="pos-line-edit-modal" class="pos-modal pos-line-modal" hidden>
      <div class="pos-modal__backdrop" data-pos-edit-close></div>
      <div class="pos-modal__sheet pos-line-modal__sheet">
        <header class="pos-modal__head">
          <h3 class="pos-modal__title" id="pos-line-edit-title">${t('posEditLine')}</h3>
          <button type="button" class="pos-modal__close" data-pos-edit-close aria-label="${t('posClose')}">×</button>
        </header>
        <div class="pos-modal__body pos-line-modal__body">
          <div class="form-field">
            <label class="pos-size-label">${t('size')} <span id="pos-edit-size-urgent" class="pos-stock-urgent" hidden></span></label>
            <select id="pos-edit-size"></select>
          </div>
          <div class="form-grid form-grid--compact">
            <div class="form-field">
              <label>${t('qty')}</label>
              <input type="number" id="pos-edit-qty" min="1" step="1" value="1" autocomplete="off">
            </div>
            <div class="form-field">
              <label>${t('posExtraShipping')}</label>
              <input type="number" id="pos-edit-shipping" min="0" step="0.01" value="0" autocomplete="off">
            </div>
          </div>
          <p class="pos-edit-stock" id="pos-edit-stock-hint"></p>
          <div class="pos-discount-block">
            <span class="pos-discount-block__icon" aria-hidden="true">%</span>
            <span class="pos-discount-block__label">${t('posDiscount')}</span>
            <div class="pos-discount-toggle" role="group" aria-label="${t('posDiscount')}">
              <button type="button" class="pos-discount-toggle__btn pos-discount-toggle__btn--active" data-pos-disc-type="none">${t('posDiscountNone')}</button>
              <button type="button" class="pos-discount-toggle__btn" data-pos-disc-type="percent">${t('posDiscountPercent')}</button>
              <button type="button" class="pos-discount-toggle__btn" data-pos-disc-type="fixed">${t('posDiscountFixed')}</button>
            </div>
            <input type="hidden" id="pos-edit-discount-type" value="none">
            <div id="pos-edit-discount-wrap" class="pos-edit-discount-wrap hidden">
              <input type="number" id="pos-edit-discount-value" min="0" step="0.01" value="0" placeholder="0">
            </div>
          </div>
          <div class="pos-edit-preview" id="pos-edit-preview-total"></div>
          <div class="pos-line-modal__actions">
            <button type="button" class="btn btn--outline" data-pos-edit-close>${t('cancel')}</button>
            <button type="button" class="btn btn--primary" id="pos-edit-save">${t('posSaveLine')}</button>
          </div>
        </div>
      </div>
    </div>
    <div id="pos-discount-modal" class="pos-modal pos-discount-modal" hidden>
      <div class="pos-modal__backdrop" data-pos-dsc-close></div>
      <div class="pos-modal__sheet pos-discount-modal__sheet">
        <header class="pos-modal__head">
          <h3 class="pos-modal__title">${t('posDiscountLine')}</h3>
          <button type="button" class="pos-modal__close" data-pos-dsc-close aria-label="${t('posClose')}">×</button>
        </header>
        <div class="pos-modal__body">
          <p class="pos-discount-modal__product" id="pos-discount-line-title">—</p>
          <div class="pos-discount-block pos-discount-block--modal">
            <span class="pos-discount-block__icon" aria-hidden="true">${UI_ICONS.discount}</span>
            <div class="pos-discount-toggle" role="group" aria-label="${t('posDiscount')}">
              <button type="button" class="pos-discount-toggle__btn pos-discount-toggle__btn--active" data-pos-dsc-type="none">${t('posDiscountNone')}</button>
              <button type="button" class="pos-discount-toggle__btn" data-pos-dsc-type="percent">${t('posDiscountPercent')}</button>
              <button type="button" class="pos-discount-toggle__btn" data-pos-dsc-type="fixed">${t('posDiscountFixed')}</button>
            </div>
            <input type="hidden" id="pos-dsc-type" value="none">
            <div id="pos-dsc-value-wrap" class="pos-edit-discount-wrap hidden">
              <label class="pos-dsc-value-label">${t('posDiscountValue')}</label>
              <input type="number" id="pos-dsc-value" min="0" step="0.01" value="0" placeholder="0">
            </div>
          </div>
          <div class="pos-discount-modal__actions">
            <button type="button" class="btn btn--outline" data-pos-dsc-close>${t('cancel')}</button>
            <button type="button" class="btn btn--primary" id="pos-dsc-save">${t('save')}</button>
          </div>
        </div>
      </div>
    </div>`;
}

function renderReturnsHTML() {
  return `
    <div class="card returns-intro">
      <h2 class="card__title">${t('returns')}</h2>
      <p class="form-hint">${t('returnsDesc')}</p>
      <label class="returns-search-label">${t('invoiceNumber')}</label>
      <input type="search" class="search returns-search-input" id="returns-search-invoice" placeholder="${t('searchInvoice')}" autocomplete="off">
      <div id="returns-invoice-panel" class="returns-invoice-panel"></div>
      <div id="returns-invoice-detail" class="returns-invoice-detail"></div>
    </div>
    <div class="card">
      <h2 class="card__title">${t('totalReturns')}: <span id="returns-total-aud">${formatAUD(0)}</span></h2>
      <div class="table-wrap">
        <table class="table">
          <thead><tr>
            <th>${t('date')}</th><th>${t('invoiceNumber')}</th><th>${t('qty')}</th>
            <th>${t('refundAud')}</th><th>${t('refundMethod')}</th>
          </tr></thead>
          <tbody id="returns-log-tbody"></tbody>
        </table>
      </div>
    </div>`;
}

function renderExpensesHTML() {
  const cats = EXPENSE_CATEGORIES.map((c) => `<option value="${c.id}">${t(c.key)}</option>`).join('');
  return `
    <div class="card">
      <h2 class="card__title">${t('addExpense')}</h2>
      <form id="expense-form">
        <input type="hidden" id="expense-id">
        <div class="form-grid">
          <div class="form-field"><label>${t('expenseName')}</label><input id="expense-name" required></div>
          <div class="form-field"><label>${t('category')}</label><select id="expense-category" required>${cats}</select></div>
          <div class="form-field"><label>${t('currency')}</label>
            <select id="expense-currency">
              <option value="AUD">${t('aud')}</option>
              <option value="SAR">${t('sar')}</option>
              <option value="USD">${t('usd')}</option>
            </select>
          </div>
          <div class="form-field"><label>${t('originalAmount')}</label><input type="number" id="expense-amount" min="0" step="0.01" required></div>
          <div class="form-field" id="exchange-field"><label>${t('exchangeRate')}</label>
            <input type="number" id="expense-rate" min="0" step="0.0001" value="1" placeholder="0.40">
            <small class="form-hint">${t('exchangeHint')}</small>
            <small class="form-hint form-hint--live" id="expense-rate-live"></small>
          </div>
          <div class="form-field"><label>${t('expenseDueDate')}</label><input type="date" id="expense-due"></div>
        </div>
        <div class="live-rates card" id="live-rates-panel"></div>
        <div id="expense-preview" class="calc-preview"></div>
        <div class="form-actions">
          <button type="submit" class="btn btn--primary">${t('save')}</button>
          <button type="button" class="btn btn--outline" id="expense-cancel">${t('cancel')}</button>
        </div>
      </form>
    </div>
    <div class="card">
      <div class="card__header">
        <h2 class="card__title">${t('allExpenses')}</h2>
        <div class="card__actions">
          <select id="expense-filter" class="search">
          <option value="">${t('filterCategory')}</option>
          ${EXPENSE_CATEGORIES.map((c) => `<option value="${c.id}">${t(c.key)}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="table-wrap">
        <table class="table">
          <thead><tr>
            <th>${t('date')}</th><th>${t('expenseName')}</th><th>${t('category')}</th>
            <th>${t('currency')}</th><th>${t('originalAmount')}</th><th>${t('exchangeRate')}</th>
            <th>${t('audValue')}</th><th>${t('vat')}</th><th>${t('totalAud')}</th><th>${t('actions')}</th>
          </tr></thead>
          <tbody id="expense-tbody"></tbody>
          <tfoot id="expense-tfoot"></tfoot>
        </table>
      </div>
    </div>`;
}

function renderPricingCalculatorHTML() {
  const m = SmartPricingEngine.defaultMarginPct;
  return `
    <section id="pricing-calculator" class="pricing-calculator" hidden aria-label="${t('pricingCalculator')}">
      <div class="smart-pricing__head">
        <span class="smart-pricing__badge">✦</span>
        <h3 class="pricing-calculator__title">${t('pricingCalculator')}</h3>
        <button type="button" class="btn btn--ghost btn--sm pricing-calculator__close" id="pricing-calculator-close" aria-label="${t('cancel')}">×</button>
      </div>
      <p class="smart-pricing__desc">${t('smartPricingDesc')}</p>
      <div class="form-grid form-grid--smart-pricing">
        <div class="form-field">
          <label>${t('costFabric')}</label>
          <input type="number" id="pricing-fabric" class="smart-pricing-input" min="0" step="0.01" value="0">
        </div>
        <div class="form-field">
          <label>${t('costTailoring')}</label>
          <input type="number" id="pricing-tailoring" class="smart-pricing-input" min="0" step="0.01" value="0">
        </div>
        <div class="form-field">
          <label>${t('costPackaging')}</label>
          <input type="number" id="pricing-packaging" class="smart-pricing-input" min="0" step="0.01" value="0">
        </div>
      </div>
      <div class="smart-pricing__margin-block">
        <div class="smart-pricing__margin-head">
          <label for="pricing-margin">${t('targetMargin')}</label>
          <strong id="pricing-margin-display">${m}%</strong>
        </div>
        <input type="range" id="pricing-margin" class="smart-pricing__range" min="0" max="75" step="1" value="${m}">
        <input type="number" id="pricing-margin-num" class="smart-pricing-input smart-pricing-input--margin" min="0" max="99" step="0.5" value="${m}">
      </div>
      <div class="smart-pricing__result">
        <div class="smart-pricing__result-row">
          <span>${t('unitCostTotal')}</span>
          <strong id="pricing-unit-cost">${formatAUD(0)}</strong>
        </div>
        <div class="smart-pricing__result-row smart-pricing__result-row--highlight">
          <span>${t('suggestedPrice')}</span>
          <strong id="pricing-suggested-price" class="smart-pricing__price">${formatAUD(0)}</strong>
        </div>
        <p class="smart-pricing__margin-note" id="pricing-margin-note"></p>
      </div>
      <div class="form-actions smart-pricing__actions">
        <button type="button" class="btn btn--primary" id="apply-suggested-price">${t('applySuggestedPrice')}</button>
        <button type="button" class="btn btn--outline" id="apply-unit-cost">${t('applyUnitCost')}</button>
        <button type="button" class="btn btn--outline btn--sm" id="estimate-pricing-costs">${t('estimateCosts')}</button>
      </div>
    </section>`;
}

/** @deprecated */
function renderDynamicPricingHTML() {
  return renderPricingCalculatorHTML();
}

function showPricingCalculator(opts = {}) {
  const panel = document.getElementById('pricing-calculator');
  if (!panel) return;
  panel.hidden = false;
  panel.classList.add('pricing-calculator--open');
  if (opts.breakdown) setSmartPricingFields(opts.breakdown);
  else if (opts.product) fillPricingForProduct(opts.product);
  else renderSmartPricing();
  if (opts.scroll !== false) {
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function hidePricingCalculator() {
  const panel = document.getElementById('pricing-calculator');
  if (!panel) return;
  panel.hidden = true;
  panel.classList.remove('pricing-calculator--open');
}

function openPricingForNewProduct() {
  navigateToTab('inventory');
  document.getElementById('product-form')?.reset();
  const idEl = document.getElementById('product-id');
  if (idEl) idEl.value = '';
  updateProductImagePreview(null);
  setSmartPricingFields({
    fabric: 0,
    tailoring: 0,
    packaging: 0,
    marginPct: SmartPricingEngine.defaultMarginPct,
  });
  showPricingCalculator({ scroll: false });
  scrollToForm('product-form');
}

function getSmartPricingBreakdown() {
  const marginRaw = document.getElementById('pricing-margin-num')?.value
    ?? document.getElementById('pricing-margin')?.value;
  return {
    fabric: document.getElementById('pricing-fabric')?.value,
    tailoring: document.getElementById('pricing-tailoring')?.value,
    packaging: document.getElementById('pricing-packaging')?.value,
    marginPct: marginRaw,
  };
}

function setSmartPricingFields(breakdown) {
  const fabric = document.getElementById('pricing-fabric');
  const tailoring = document.getElementById('pricing-tailoring');
  const packaging = document.getElementById('pricing-packaging');
  const marginRange = document.getElementById('pricing-margin');
  const marginNum = document.getElementById('pricing-margin-num');
  if (fabric) fabric.value = breakdown.fabric ?? 0;
  if (tailoring) tailoring.value = breakdown.tailoring ?? 0;
  if (packaging) packaging.value = breakdown.packaging ?? 0;
  const m = breakdown.marginPct ?? SmartPricingEngine.defaultMarginPct;
  if (marginRange) marginRange.value = m;
  if (marginNum) marginNum.value = m;
  renderSmartPricing();
}

function renderSmartPricing() {
  const unitEl = document.getElementById('pricing-unit-cost');
  const priceEl = document.getElementById('pricing-suggested-price');
  const marginDisplay = document.getElementById('pricing-margin-display');
  const marginNote = document.getElementById('pricing-margin-note');
  if (!unitEl || !priceEl) return;

  const result = SmartPricingEngine.calculate(getSmartPricingBreakdown());

  unitEl.textContent = formatAUD(result.unitCost);
  priceEl.textContent = formatAUD(result.suggestedPrice);
  if (marginDisplay) marginDisplay.textContent = `${result.marginPct}%`;
  if (marginNote) {
    marginNote.textContent = result.unitCost > 0
      ? `${t('marginOnSale')}: ${result.effectiveMarginPct}%`
      : '';
  }
}

function syncSmartPricingFromProduct() {
  const id = document.getElementById('product-id')?.value;
  const p = id ? getProduct(id) : null;
  if (!p || !document.getElementById('pricing-fabric')) return;
  const active = document.activeElement;
  if (active?.classList?.contains('smart-pricing-input')) return;
  setSmartPricingFields(SmartPricingEngine.breakdownFromProduct(p));
}

function fillPricingForProduct(p) {
  if (!p) return;
  setSmartPricingFields(SmartPricingEngine.breakdownFromProduct(p));
}

function applyEstimatedPricingCosts() {
  const est = SmartPricingEngine.estimateFromExpenses();
  setSmartPricingFields({
    fabric: est.fabric,
    tailoring: est.tailoring,
    packaging: est.packaging,
    marginPct: document.getElementById('pricing-margin-num')?.value || SmartPricingEngine.defaultMarginPct,
  });
  showToast(t('estimateCosts'));
}

function applySuggestedPriceToProduct() {
  const result = SmartPricingEngine.calculate(getSmartPricingBreakdown());
  const priceField = document.getElementById('product-price');
  if (priceField && result.suggestedPrice > 0) {
    priceField.value = result.suggestedPrice;
    showToast(t('priceApplied'));
  }
}

function applyUnitCostToProduct() {
  const result = SmartPricingEngine.calculate(getSmartPricingBreakdown());
  const costField = document.getElementById('product-cost');
  if (costField) {
    costField.value = result.unitCost;
    showToast(t('costApplied'));
  }
}

/** @deprecated use renderSmartPricing */
function renderDynamicPricing() {
  renderSmartPricing();
}

function renderInventoryHTML() {
  return `
    ${renderDynamicPricingWidgetHTML()}
    <div class="card card--product-form">
      <div class="card__header card__header--product">
        <h2 class="card__title">${t('addProduct')}</h2>
        <button type="button" class="btn btn--outline btn--sm" id="product-open-pricing">${t('pricingCalculator')}</button>
      </div>
      <form id="product-form">
        <input type="hidden" id="product-id">
        <div class="form-grid">
          <div class="form-field"><label>${t('code')}</label><input id="product-code" required></div>
          <div class="form-field"><label>${t('name')}</label><input id="product-name" required></div>
          <div class="form-field"><label>${t('size')}</label><select id="product-size"><option>52</option><option>54</option><option>56</option><option>58</option><option>60</option><option>62</option></select></div>
          <div class="form-field"><label>${t('color')}</label><input id="product-color" required></div>
          <div class="form-field"><label>${t('abayaStyle')}</label>
            <select id="product-style">${ABAYA_STYLES.map((s) => `<option value="${s.id}">${t(s.key)}</option>`).join('')}</select>
          </div>
          <div class="form-field"><label>${t('costAud')}</label><input type="number" id="product-cost" min="0" step="0.01" required></div>
          <div class="form-field"><label>${t('priceAud')}</label><input type="number" id="product-price" min="0" step="0.01" required></div>
          <div class="form-field"><label>${t('qty')}</label><input type="number" id="product-qty" min="0" required></div>
          <div class="form-field form-field--wide product-image-field">
            <label>${t('productImage')}</label>
            <div class="product-image-upload">
              <div class="product-image-upload__preview">
                <img id="product-image-preview" class="product-image-upload__img" alt="" hidden>
                <div id="product-image-placeholder" class="product-image-upload__ph">—</div>
              </div>
              <div class="product-image-upload__actions">
                <label class="btn btn--outline btn--sm" for="product-image-input">${t('uploadProductImage')}</label>
                <input type="file" id="product-image-input" accept="image/*" hidden>
                <button type="button" class="btn btn--outline btn--sm" id="product-image-clear" hidden>${t('delete')}</button>
              </div>
            </div>
            <input type="hidden" id="product-image-data" value="">
          </div>
        </div>
        <div class="form-actions"><button type="submit" class="btn btn--primary">${t('save')}</button><button type="button" class="btn btn--outline" id="product-cancel">${t('cancel')}</button></div>
      </form>
      ${renderPricingCalculatorHTML()}
    </div>
    ${renderSupplierInvoiceProcessorHTML()}
    <div class="card card--inventory card--profit-tracker">
      <div class="card__header">
        <div>
          <h2 class="card__title">${t('inventory')}</h2>
          <p class="card__subtitle">${t('smartProfitTracker')}</p>
        </div>
        <div class="card__actions"><input class="search" id="inv-search" placeholder="${t('search')}"></div>
      </div>
      <div class="seasonal-mode-bar" id="inv-seasonal-bar" data-seasonal-mode="normal">
        <span class="seasonal-mode-bar__label">${t('smartSeasonalMode')}</span>
        <div class="seasonal-mode-toggle" role="group" aria-label="${t('smartSeasonalMode')}">
          <button type="button" class="seasonal-mode-toggle__btn seasonal-mode-toggle__btn--active" data-seasonal-mode="normal" aria-pressed="true">${t('seasonNormal')}</button>
          <button type="button" class="seasonal-mode-toggle__btn" data-seasonal-mode="holiday" aria-pressed="false">${t('seasonHoliday')}</button>
          <button type="button" class="seasonal-mode-toggle__btn" data-seasonal-mode="clearance" aria-pressed="false">${t('seasonClearance')}</button>
        </div>
        <span class="seasonal-mode-bar__hint" id="inv-seasonal-hint"></span>
      </div>
      <div class="stats stats--inv-profit" id="inv-profit-stats" aria-live="polite"></div>
      <p class="demand-hint demand-hint--global" id="inventory-global-forecast"></p>
      <div class="table-wrap">
        <table class="table table--inventory"><thead><tr>
          <th>${t('code')}</th><th>${t('name')}</th><th>${t('size')}</th><th>${t('color')}</th>
          <th>${t('costAud')}</th><th>${t('invSuggestedSalePrice')}</th><th>${t('qty')}</th>
          <th>${t('invUnitProfit')}</th><th>${t('invLineProfit')}</th>
          <th>${t('status')}</th><th>${t('actions')}</th>
        </tr></thead><tbody id="inv-tbody"></tbody>
        <tfoot id="inv-tfoot"></tfoot></table>
      </div>
    </div>`;
}

function renderSalesHTML() {
  return `
    <div class="card">
      <h2 class="card__title">${t('recordSale')}</h2>
      <form id="sale-form">
        <div class="form-grid">
          <div class="form-field form-field--wide product-picker-wrap">
            <label>${t('product')}</label>
            <input type="hidden" id="sale-product" value="">
            <button type="button" id="sale-product-trigger" class="product-picker__trigger" aria-haspopup="listbox" aria-expanded="false">
              <span class="product-picker__placeholder">${t('product')}</span>
            </button>
            <ul id="sale-product-menu" class="product-picker__menu" role="listbox" hidden></ul>
          </div>
          <div class="form-field"><label>${t('qty')}</label><input type="number" id="sale-qty" min="1" value="1" required></div>
          <div class="form-field"><label>${t('priceAud')}</label><input type="number" id="sale-price" min="0" step="0.01" required></div>
          <div class="form-field"><label>${t('customer')}</label><input id="sale-customer"></div>
          <div class="form-field"><label>${t('payment')}</label><select id="sale-payment"><option>Cash</option><option>Card</option><option>Transfer</option></select></div>
          <div class="form-field"><label>${t('saleColor')}</label><input id="sale-color-display" readonly placeholder="—"></div>
          <div class="form-field"><label>${t('abayaStyle')}</label><input id="sale-style-display" readonly placeholder="—"></div>
        </div>
        <div id="sale-preview" class="calc-preview"></div>
        <div class="form-actions"><button type="submit" class="btn btn--primary">${t('save')}</button></div>
      </form>
    </div>
    <div class="card">
      <div class="card__header">
        <h2 class="card__title">${t('sales')}</h2>
        <div class="card__actions"><input class="search" id="sale-search" placeholder="${t('search')}"></div>
      </div>
      <div class="table-wrap">
        <table class="table"><thead><tr>
          <th>${t('invoiceNumber')}</th><th>${t('date')}</th><th>${t('product')}</th><th>${t('saleColor')}</th><th>${t('abayaStyle')}</th><th>${t('qty')}</th><th>${t('revenueAud')}</th><th>${t('profitAud')}</th><th>${t('saleSource')}</th><th>${t('paymentMethodCol')}</th><th>${t('status')}</th><th>${t('actions')}</th>
        </tr></thead><tbody id="sale-tbody"></tbody></table>
      </div>
    </div>`;
}

function renderAnalyticsHTML() {
  return `
    <div class="insights insights--full" id="analytics-insights"></div>
    <section class="style-insights card" id="style-insights-panel">
      <div class="style-insights__head">
        <h2 class="card__title">✦ ${t('styleInsights')}</h2>
        <span class="style-insights__badge">${t('aiInsights')}</span>
      </div>
      <p class="style-insights__desc">${t('styleInsightsDesc')}</p>
      <div class="style-insights__grid" id="style-insights-content"></div>
    </section>
    <div class="charts-grid charts-grid--full">
      <div class="chart-card chart-card--wide"><h3 class="chart-card__title">${t('costDist')} — ${t('abayaShare')} vs ${t('shippingShare')}</h3><canvas id="chart-dist-full"></canvas></div>
      <div class="chart-card"><h3 class="chart-card__title">${t('profitForecast')}</h3><canvas id="chart-forecast-full"></canvas></div>
      <div class="chart-card"><h3 class="chart-card__title">${t('topProducts')}</h3><canvas id="chart-top-full"></canvas></div>
    </div>`;
}

function renderSettingsHTML() {
  return `
    <div class="card card--logo-settings">
      <h2 class="card__title">${t('logoSettings')}</h2>
      <p class="form-hint">${t('logoPreviewHint')}</p>
      <div class="logo-settings-preview">
        <img id="settings-logo-preview" class="logo-settings-preview__img" hidden>
        <div id="settings-logo-placeholder" class="logo-settings-preview__ph">PA</div>
      </div>
      <label class="btn btn--outline logo-settings-btn" for="settings-logo-input">${t('uploadLogo')}</label>
      <input type="file" id="settings-logo-input" accept="image/*" hidden>
    </div>
    <div class="card card--live-rates">
      <h2 class="card__title">${t('liveRates')}</h2>
      <p class="form-hint">${t('liveRatesDesc')}</p>
      <div id="settings-live-rates"></div>
      <button type="button" class="btn btn--outline btn--sm" id="refresh-rates">${t('refreshRates')}</button>
    </div>
    <div class="card">
      <h2 class="card__title">${t('smartNotifications')}</h2>
      <p class="form-hint">${t('notificationsHint')}</p>
      <p class="notif-status" id="notif-status"></p>
      <button type="button" class="btn btn--primary" id="enable-notifications">${t('enableNotifications')}</button>
    </div>
    <div class="card">
      <h2 class="card__title">${t('settings')}</h2>
      <div class="form-grid">
        <div class="form-field"><label>VAT %</label><input type="number" id="set-vat" min="0" max="100" value="15"></div>
      </div>
      <p class="form-hint">${t('baseCurrency')}</p>
      <span class="supabase-badge" id="supabase-status">${t('supabaseLocal')}</span>
      <div class="form-actions"><button type="button" class="btn btn--primary" id="save-settings">${t('save')}</button></div>
    </div>
    <div class="card card--maintenance">
      <h2 class="card__title">${t('maintenanceMode')}</h2>
      <p class="form-hint maintenance-mode__hint">${t('maintenanceModeDesc')}</p>
      <button type="button" class="btn btn--danger btn--reset-db" id="reset-database-btn">${t('resetDatabaseBtn')}</button>
    </div>`;
}

// ═══════════════════════════════════════════════════════════════
//  Render Data
// ═══════════════════════════════════════════════════════════════

function renderSmartDashboard() {
  const turnover = AnalyticsEngine.inventoryTurnover();
  const alerts = AnalyticsEngine.lowStockAlerts();

  const turnoverEl = document.getElementById('turnover-value');
  const turnoverSub = document.getElementById('turnover-sub');
  const metricCard = document.getElementById('turnover-metric');

  if (turnoverEl) {
    turnoverEl.textContent = `${turnover.rate} ${t('turnoverTimes')}`;
    turnoverEl.className = `smart-metric__value smart-metric__value--${turnover.rating}`;
  }
  if (turnoverSub) {
    turnoverSub.innerHTML = `
      <span>${t('unitsSold')}: <strong>${turnover.unitsSold}</strong></span>
      <span>${t('invValue')}: <strong>${formatAUD(turnover.invValue)}</strong></span>`;
  }
  if (metricCard) {
    metricCard.classList.toggle('smart-metric--pulse', turnover.rate < 1 && state.sales.length > 0);
  }

  const countEl = document.getElementById('alerts-count');
  const listEl = document.getElementById('stock-alerts-list');
  const panelEl = document.getElementById('stock-alerts-panel');

  if (countEl) countEl.textContent = alerts.length;

  if (listEl) {
    if (!alerts.length) {
      listEl.innerHTML = `<li class="smart-alerts__item smart-alerts__item--ok">✓ ${t('noAlerts')}</li>`;
      panelEl?.classList.remove('smart-alerts--active');
    } else {
      panelEl?.classList.add('smart-alerts--active');
      listEl.innerHTML = alerts.map((p) => {
        const fc = DemandForecastEngine.productForecast(p);
        return `
        <li class="smart-alerts__item smart-alerts__item--${p.severity}">
          <div class="smart-alerts__info">
            <strong>${p.name}</strong>
            <span>${p.code} · ${p.size} · ${p.color}</span>
          </div>
          <div class="smart-alerts__qty">
            <span class="smart-alerts__badge">${p.quantity}</span>
            <small>${t('piecesLeft')}</small>
          </div>
          <div class="inv-reorder-row">
            <button type="button" class="btn btn--sm btn--accent" data-goto-product="${p.id}">${t('reorder')}</button>
            <span class="demand-hint demand-hint--${fc.urgency || 'neutral'}">${DemandForecastEngine.forecastMessage(fc)}</span>
          </div>
        </li>`;
      }).join('');
    }
  }

  renderPredictiveAlerts();
}

function renderPredictiveAlerts() {
  const listEl = document.getElementById('predictive-alerts-list');
  const badgeEl = document.getElementById('predictive-shipping-badge');
  if (!listEl) return;

  const shipping = PredictiveBuyingEngine.shippingTrend();
  if (badgeEl) badgeEl.hidden = !shipping.rising;

  const alerts = PredictiveBuyingEngine.proactiveAlerts();
  if (!alerts.length) {
    listEl.innerHTML = `<li class="predictive-panel__item predictive-panel__item--ok">✓ ${t('noProactiveAlerts')}</li>`;
    return;
  }

  listEl.innerHTML = alerts.map((a) => `
    <li class="predictive-panel__item predictive-panel__item--${a.severity}">
      <div class="predictive-panel__msg">${PredictiveBuyingEngine.alertMessage(a)}</div>
      <div class="predictive-panel__meta">
        <span>${t('monthlySales')}: <strong>${a.monthly}</strong> ${t('units')}</span>
        <button type="button" class="btn btn--sm btn--accent" data-goto-product="${a.product.id}">${t('reorder')}</button>
      </div>
    </li>`).join('');
}

function renderLiveRatesPanel() {
  const fx = state.settings.exchangeRates;
  const html = !fx ? `<p class="live-rates__loading">${t('ratesLoading')}</p>` : `
    <div class="live-rates__row">
      <span class="live-rates__pair">${t('sarToAud')}</span>
      <strong>${fx.audPerSar ?? '—'} AUD</strong>
    </div>
    <div class="live-rates__row">
      <span class="live-rates__pair">${t('usdToAud')}</span>
      <strong>${fx.audPerUsd ?? '—'} AUD</strong>
    </div>
    <p class="live-rates__meta">
      <span class="live-rates__status live-rates__status--${fx.live ? 'live' : 'stale'}">${fx.live ? t('ratesLive') : t('ratesStale')}</span>
      · ${t('ratesUpdated')}: ${fx.fetchedAt ? formatDate(fx.fetchedAt) : '—'}
    </p>
    <p class="form-hint">${t('rateAutoApplied')}</p>`;

  ['live-rates-panel', 'settings-live-rates'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  });

  const liveHint = document.getElementById('expense-rate-live');
  const cur = document.getElementById('expense-currency')?.value;
  if (liveHint && cur && cur !== 'AUD' && fx) {
    const r = LiveCurrencyBridge.rateFor(cur);
    liveHint.textContent = r ? `✦ ${t('ratesLive')}: ${r} AUD` : '';
  }
}

function renderStyleInsights() {
  const el = document.getElementById('style-insights-content');
  if (!el) return;

  const colors = StyleAnalyticsEngine.colorDemand(5);
  const styles = StyleAnalyticsEngine.styleDemand(5);
  const slow = StyleAnalyticsEngine.slowMovers();

  const topColor = colors[0];
  const topStyle = styles[0];

  el.innerHTML = `
    <article class="style-insights__card">
      <h4>${t('topColor')}</h4>
      ${topColor
    ? `<p class="style-insights__hero">${topColor.color}</p><p>${topColor.qty} ${t('units')}</p>
         <ul class="style-insights__list">${colors.map((c) => `<li><span>${c.color}</span><strong>${c.qty}</strong></li>`).join('')}</ul>`
    : `<p class="empty">${t('noData')}</p>`}
    </article>
    <article class="style-insights__card">
      <h4>${t('topStyle')}</h4>
      ${topStyle
    ? `<p class="style-insights__hero">${topStyle.label}</p><p>${topStyle.qty} ${t('units')}</p>
         <ul class="style-insights__list">${styles.map((s) => `<li><span>${s.label}</span><strong>${s.qty}</strong></li>`).join('')}</ul>`
    : `<p class="empty">${t('noData')}</p>`}
    </article>
    <article class="style-insights__card style-insights__card--warn">
      <h4>${t('slowMovers')}</h4>
      ${slow.length
    ? `<ul class="style-insights__list">${slow.map((x) => `
          <li>
            <span>${x.product.name} · ${x.product.color}</span>
            <small>${t('slowMoverHint').replace('{days}', String(x.daysSince)).replace('{qty}', String(x.product.quantity))}</small>
          </li>`).join('')}</ul>`
    : `<p class="empty">✓ ${t('noAlerts')}</p>`}
    </article>`;
}

function renderNotificationStatus() {
  const el = document.getElementById('notif-status');
  if (!el) return;
  if (!('Notification' in window)) {
    el.textContent = '—';
    return;
  }
  if (Notification.permission === 'denied') el.textContent = t('notificationsDenied');
  else if (state.settings.notificationsEnabled) el.textContent = `✓ ${t('notificationsOn')}`;
  else el.textContent = t('notificationsOff');
}

function updateSaleProductMeta() {
  const p = getProduct(document.getElementById('sale-product')?.value);
  const colorEl = document.getElementById('sale-color-display');
  const styleEl = document.getElementById('sale-style-display');
  if (colorEl) colorEl.value = p?.color || '';
  if (styleEl) styleEl.value = p ? StyleAnalyticsEngine.styleLabel(p.style) : '';
}

function renderDashboard() {
  renderSmartDashboard();
  ActivityFeed.render();

  const exp = AnalyticsEngine.totalExpensesAUD();
  const rev = AnalyticsEngine.totalRevenueAUD();
  const profit = AnalyticsEngine.netProfitAUD();
  const dist = AnalyticsEngine.costDistribution();
  const forecast = AnalyticsEngine.profitForecast();

  setText('dash-stats', '');
  const statsEl = document.getElementById('dash-stats');
  if (statsEl) {
    statsEl.innerHTML = [
      { l: t('profitAud'), v: formatAUD(profit), c: 'stat-card--accent' },
      { l: t('revenueAud'), v: formatAUD(rev), c: 'stat-card--success' },
      { l: t('expensesAud'), v: formatAUD(exp), c: 'stat-card--warning' },
      { l: t('totalProducts'), v: state.products.length, c: '' },
      { l: t('totalStock'), v: state.products.reduce((s, p) => s + p.quantity, 0), c: '' },
      { l: t('totalSales'), v: state.sales.length, c: '' },
    ].map((i) => `<article class="stat-card ${i.c}"><span class="stat-card__label">${i.l}</span><strong class="stat-card__value">${i.v}</strong></article>`).join('');
  }

  const alerts = AnalyticsEngine.lowStockAlerts();
  const turnover = AnalyticsEngine.inventoryTurnover();

  const fx = state.settings.exchangeRates;
  const proactive = PredictiveBuyingEngine.proactiveAlerts();

  const insights = document.getElementById('insights-bar');
  if (insights) {
    insights.innerHTML = `
      <div class="insight-chip insight-chip--ai">✦ ${t('aiInsights')}</div>
      ${fx?.audPerSar ? `<div class="insight-chip insight-chip--live">${t('sarToAud')} <strong>${fx.audPerSar}</strong></div>` : ''}
      <div class="insight-chip">${t('inventoryTurnover')}: <strong>${turnover.rate}×</strong></div>
      ${alerts.length ? `<div class="insight-chip insight-chip--warn">⚠ ${alerts.length} ${t('stockAlerts')}</div>` : ''}
      ${proactive.length ? `<div class="insight-chip insight-chip--warn">📦 ${proactive.length} ${t('predictiveBuying')}</div>` : ''}
      ${AnalyticsEngine.totalReturnsAUD() > 0 ? `<div class="insight-chip insight-chip--warn">↩ ${formatAUD(AnalyticsEngine.totalReturnsAUD())} ${t('totalReturns')}</div>` : ''}
      <div class="insight-chip">${t('abayaShare')}: <strong>${dist.abayasPct}%</strong></div>
      <div class="insight-chip">${t('shippingShare')}: <strong>${dist.shippingPct}%</strong></div>
      <div class="insight-chip">${t('forecastNote')}: <strong>${formatAUD(forecast.projectedMonthly)}</strong></div>`;
  }

  const ai = document.getElementById('analytics-insights');
  if (ai) ai.innerHTML = insights?.innerHTML || '';
}

function renderExpensePreview() {
  const el = document.getElementById('expense-preview');
  if (!el) return;
  const fin = CurrencyEngine.calcExpense({
    amountOriginal: document.getElementById('expense-amount')?.value,
    currency: document.getElementById('expense-currency')?.value,
    exchangeRate: document.getElementById('expense-rate')?.value,
    vatRate: state.settings.vatRate,
  });
  el.innerHTML = `
    <div class="calc-preview__row"><span>${t('audValue')}</span><strong>${formatAUD(fin.audBeforeVat)}</strong></div>
    <div class="calc-preview__row"><span>${t('vat')} (15%)</span><strong class="text-info">${formatAUD(fin.vat)}</strong></div>
    <div class="calc-preview__row calc-preview__row--total"><span>${t('totalAud')}</span><strong>${formatAUD(fin.audTotal)}</strong></div>`;
}

function toggleExchangeField() {
  const cur = document.getElementById('expense-currency')?.value || 'AUD';
  const field = document.getElementById('exchange-field');
  const rate = document.getElementById('expense-rate');
  if (!field || !rate) return;
  const needs = CurrencyEngine.needsExchangeRate(cur);
  field.style.display = needs ? '' : 'none';
  if (!needs) rate.value = '1';
  else LiveCurrencyBridge.applyToExpenseForm();
  rate.required = needs;
  renderLiveRatesPanel();
}

function renderExpensesTable(filter = '') {
  const tbody = document.getElementById('expense-tbody');
  const tfoot = document.getElementById('expense-tfoot');
  if (!tbody) return;

  let list = state.expenses;
  if (filter) list = list.filter((e) => e.category === filter);

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="10" class="empty">${t('noData')}</td></tr>`;
    if (tfoot) tfoot.innerHTML = '';
    return;
  }

  let totalAud = 0;
  tbody.innerHTML = list.map((e) => {
    const f = e.financials;
    totalAud += f.audTotal;
    return `<tr>
      <td>${formatDate(e.createdAt)}</td>
      <td>${e.name}</td>
      <td><span class="tag tag--cat">${catLabel(e.category)}</span></td>
      <td><span class="tag tag--${e.currency.toLowerCase()}">${e.currency}</span></td>
      <td>${formatNum(e.amountOriginal, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      <td>${e.currency === 'AUD' ? '1' : e.exchangeRate}</td>
      <td>${formatAUD(f.audBeforeVat)}</td>
      <td class="text-info">${formatAUD(f.vat)}</td>
      <td><strong>${formatAUD(f.audTotal)}</strong></td>
      <td class="actions">
        <button class="btn btn--sm btn--outline" data-edit-expense="${e.id}">${t('edit')}</button>
        <button class="btn btn--sm btn--danger" data-del-expense="${e.id}">${t('delete')}</button>
      </td>
    </tr>`;
  }).join('');

  if (tfoot) {
    tfoot.innerHTML = `<tr><td colspan="8">${t('totalAud')}</td><td colspan="2"><strong>${formatAUD(totalAud)}</strong></td></tr>`;
  }
}

function renderInventoryTable(q = '') {
  const tbody = document.getElementById('inv-tbody');
  const globalHint = document.getElementById('inventory-global-forecast');
  if (!tbody) return;

  const query = q.toLowerCase();
  const list = state.products.filter((p) => !query || p.name.toLowerCase().includes(query) || p.code.toLowerCase().includes(query));

  const avgDailyAll = DemandForecastEngine.avgDailySales();
  const totalStock = state.products.reduce((s, p) => s + p.quantity, 0);
  if (globalHint) {
    if (avgDailyAll > 0) {
      const daysAll = Math.floor(totalStock / avgDailyAll);
      globalHint.textContent = `📊 ${t('forecastDays').replace('{days}', String(daysAll))} · ${t('unitsSold')}: ${DemandForecastEngine.salesInPeriod().reduce((s, x) => s + x.quantity, 0)} (${DemandForecastEngine.periodMonths} ${currentLang === 'ar' ? 'أشهر' : 'mo.'})`;
      globalHint.className = `demand-hint demand-hint--global demand-hint--${daysAll <= 15 ? 'warning' : 'ok'}`;
    } else {
      globalHint.textContent = t('forecastNoData');
      globalHint.className = 'demand-hint demand-hint--global';
    }
  }

  renderInventorySeasonalBar();
  renderInventoryProfitStats(state.products);

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="11" class="empty">${t('noData')}</td></tr>`;
    renderInventoryTableFooter([]);
    return;
  }

  const threshold = APP_CONFIG.stockAlertThreshold;
  const marginHint = t('invLowMarginHint').replace('{pct}', String(InventoryProfitabilityEngine.minMarginPct()));

  tbody.innerHTML = list.map((p) => {
    const st = p.quantity <= 0 ? ['out', 'badge--out'] : p.quantity < threshold ? ['low', 'badge--low'] : ['available', 'badge--ok'];
    const fc = DemandForecastEngine.productForecast(p);
    const msg = DemandForecastEngine.forecastMessage(fc);
    const hintClass = !fc.hasData ? 'neutral' : fc.urgency || 'ok';
    const m = InventoryProfitabilityEngine.calcRow(p);
    const profitCls = InventoryProfitabilityEngine.profitCellClass(m.lowMargin);
    const profitTitle = m.lowMargin ? marginHint : `${m.marginPct}%`;

    return `<tr data-inv-product-row="${p.id}">
      <td>${escapeHtml(p.code)}</td>
      <td>${escapeHtml(p.name)}</td>
      <td>${escapeHtml(String(p.size))}</td>
      <td>${escapeHtml(p.color)}</td>
      <td data-inv-cost-display>${formatAUD(m.cost)}</td>
      <td class="inv-price-cell${m.seasonalAdjusted ? ' inv-price-cell--seasonal' : ''}">
        ${invSeasonalPriceCellHtml(p, m)}
      </td>
      <td>${m.qty}</td>
      <td class="${profitCls}" data-inv-unit-profit title="${escapeHtml(profitTitle)}">${formatAUD(m.unitProfit)}</td>
      <td class="${profitCls}" data-inv-line-profit>${formatAUD(m.lineProfit)}</td>
      <td><span class="badge ${st[1]}">${t(st[0])}</span></td>
      <td class="actions actions--inventory">
        <div class="inv-reorder-row">
          <button type="button" class="btn btn--sm btn--accent" data-goto-product="${p.id}">${t('reorder')}</button>
          <span class="demand-hint demand-hint--${hintClass}" title="${escapeHtml(msg)}">${escapeHtml(msg)}</span>
        </div>
        <div class="inv-actions-row">
          <button type="button" class="btn btn--sm btn--outline" data-edit-price="${p.id}">${t('editPrice')}</button>
          <button type="button" class="btn btn--sm btn--outline" data-edit-product="${p.id}">${t('edit')}</button>
          <button type="button" class="btn btn--sm btn--danger" data-del-product="${p.id}">${t('delete')}</button>
        </div>
      </td>
    </tr>`;
  }).join('');

  renderInventoryTableFooter(list);
}

function renderSalesTable(q = '') {
  const tbody = document.getElementById('sale-tbody');
  if (!tbody) return;
  const query = q.toLowerCase();
  const list = state.sales.filter((s) => !query || s.productName?.toLowerCase().includes(query));

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="12" class="empty">${t('noData')}</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map((s) => {
    const c = CurrencyEngine.calcSale(s);
    const pc = s.returned ? 'text-muted' : (c.profit >= 0 ? 'text-success' : 'text-danger');
    const color = s.productColor || getProduct(s.productId)?.color || '—';
    const style = StyleAnalyticsEngine.styleLabel(s.productStyle || getProduct(s.productId)?.style);
    const status = s.returned
      ? `<span class="badge badge--out">${t('returned')}</span>`
      : `<span class="badge badge--ok">${t('available')}</span>`;
    const inv = InvoiceNumberEngine.saleInvoiceNumber(s);
    return `<tr class="${s.returned ? 'table-row--muted' : ''}">
      <td><strong class="sale-inv-num">${escapeHtml(inv)}</strong></td>
      <td>${formatDate(s.createdAt)}</td><td>${s.productName}</td>
      <td>${color}</td><td>${style}</td><td>${s.quantity}</td>
      <td>${formatAUD(c.revenue)}</td><td class="${pc}">${formatAUD(c.profit)}</td>
      <td><span class="tag tag--source${s.saleSource === 'off_store' ? ' tag--source-off' : ''}">${saleSourceLabel(s.saleSource)}</span></td>
      <td>${salePaymentBadge(s)}</td>
      <td>${status}</td>
      <td class="actions">${s.returned ? '—' : `<button class="btn btn--sm btn--danger" data-del-sale="${s.id}">${t('delete')}</button>`}</td>
    </tr>`;
  }).join('');
}

const SaleProductPicker = {
  closeMenu() {
    const menu = document.getElementById('sale-product-menu');
    const trigger = document.getElementById('sale-product-trigger');
    if (menu) menu.hidden = true;
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
  },

  toggleMenu(open) {
    const menu = document.getElementById('sale-product-menu');
    const trigger = document.getElementById('sale-product-trigger');
    if (!menu || !trigger) return;
    const show = open ?? menu.hidden;
    menu.hidden = !show;
    trigger.setAttribute('aria-expanded', String(show));
  },

  renderTrigger(p) {
    const trigger = document.getElementById('sale-product-trigger');
    if (!trigger) return;
    if (!p) {
      trigger.innerHTML = `<span class="product-picker__placeholder">${t('product')}</span>`;
      return;
    }
    trigger.innerHTML = `
      <span class="product-picker__option-name">${escapeHtml(p.name)}</span>
      <span class="product-picker__option-price num-digits">${formatAUD(p.price)}</span>`;
  },

  select(productId) {
    const hidden = document.getElementById('sale-product');
    if (!hidden) return;
    hidden.value = productId || '';
    const p = productId ? getProduct(productId) : null;
    this.renderTrigger(p);
    const priceEl = document.getElementById('sale-price');
    if (p && priceEl) priceEl.value = p.price;
    updateSaleProductMeta();
    renderSalePreview();
    this.closeMenu();
  },

  reset() {
    this.select('');
  },
};

function populateSaleSelect() {
  const menu = document.getElementById('sale-product-menu');
  if (!menu) return;
  const prev = document.getElementById('sale-product')?.value || '';
  const products = state.products.filter((p) => p.quantity > 0);
  menu.innerHTML = products.map((p) => `
    <li role="presentation">
      <button type="button" class="product-picker__option" role="option" data-sale-pick="${p.id}">
        <span class="product-picker__option-left">
          <span class="product-picker__option-name">${escapeHtml(p.name)}</span>
          <span class="product-picker__option-meta">${escapeHtml(p.code)} · ${escapeHtml(p.color)} · ${formatNum(p.quantity, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
        </span>
        <span class="product-picker__option-price num-digits">${formatAUD(p.price)}</span>
      </button>
    </li>`).join('');
  if (prev && products.some((p) => p.id === prev)) SaleProductPicker.select(prev);
  else {
    SaleProductPicker.select('');
    updateSaleProductMeta();
  }
}

function renderSalePreview() {
  const el = document.getElementById('sale-preview');
  if (!el) return;
  const p = getProduct(document.getElementById('sale-product')?.value);
  const qty = parseInt(document.getElementById('sale-qty')?.value, 10) || 0;
  const price = parseFloat(document.getElementById('sale-price')?.value) || 0;
  if (!p || qty <= 0) { el.innerHTML = ''; return; }
  const c = CurrencyEngine.calcSale({ unitPriceAud: price, quantity: qty, unitCostAud: p.cost });
  el.innerHTML = `<div class="calc-preview__row"><span>${t('revenueAud')}</span><strong>${formatAUD(c.revenue)}</strong></div>
    <div class="calc-preview__row calc-preview__row--total"><span>${t('profitAud')}</span><strong class="text-success">${formatAUD(c.profit)}</strong></div>`;
}

function applyLogos() {
  const src = state.settings.logo;
  const headerImg = document.getElementById('brand-logo');
  const settingsImg = document.getElementById('settings-logo-preview');
  const settingsPh = document.getElementById('settings-logo-placeholder');

  if (src) {
    if (headerImg) {
      headerImg.src = src;
      headerImg.hidden = false;
    }
    if (settingsImg) {
      settingsImg.src = src;
      settingsImg.hidden = false;
    }
    if (settingsPh) settingsPh.hidden = true;
  } else {
    if (headerImg) {
      headerImg.removeAttribute('src');
      headerImg.hidden = true;
    }
    if (settingsImg) settingsImg.hidden = true;
    if (settingsPh) settingsPh.hidden = false;
  }
}

// ═══════════════════════════════════════════════════════════════
//  Charts — debounced for performance
// ═══════════════════════════════════════════════════════════════

let chartTimer = null;

function scheduleCharts() {
  clearTimeout(chartTimer);
  chartTimer = setTimeout(renderCharts, 60);
}

function destroyCharts() {
  Object.values(charts).forEach((c) => c?.destroy());
  charts = {};
}

function renderCharts() {
  if (typeof Chart === 'undefined') return;
  destroyCharts();

  const dist = AnalyticsEngine.costDistribution();
  const forecast = AnalyticsEngine.profitForecast();
  const top = AnalyticsEngine.topProducts();
  const weekly = AnalyticsEngine.weeklySalesTrend(8);
  const profit = AnalyticsEngine.netProfitAUD();
  const exp = AnalyticsEngine.totalExpensesAUD();
  const rev = AnalyticsEngine.totalRevenueAUD();

  const chartMap = {
    'chart-weekly-sales': {
      type: 'line',
      data: {
        labels: weekly.map((w) => w.label),
        datasets: [{
          label: t('qty'),
          data: weekly.map((w) => w.qty),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.12)',
          fill: true,
          tension: 0.4,
          pointRadius: 5,
          pointHoverRadius: 8,
          pointBackgroundColor: '#3b82f6',
        }],
      },
      opts: { scales: { y: { beginAtZero: true } }, plugins: { legend: { display: false } } },
    },
    'chart-profit': {
      type: 'doughnut',
      data: {
        labels: [t('revenueAud'), t('expensesAud'), t('profitAud')],
        datasets: [{ data: [Math.max(rev, 0), Math.max(exp, 0), Math.max(profit, 0)], backgroundColor: ['#059669', '#d97706', '#b8956a'] }],
      },
      opts: { plugins: { legend: { position: 'bottom' } } },
    },
    'chart-cost-dist': {
      type: 'pie',
      data: {
        labels: [t('catImport'), t('catIntl'), t('catLocal'), t('catPack')],
        datasets: [{ data: [dist.abayas, dist.shipping, dist.other * 0.5, dist.other * 0.5], backgroundColor: ['#b8956a', '#2563eb', '#7c3aed', '#d97706'] }],
      },
      opts: { plugins: { legend: { position: 'bottom' } } },
    },
    'chart-forecast': {
      type: 'bar',
      data: {
        labels: [t('profitAud'), t('forecastNote')],
        datasets: [{ data: [forecast.monthProfit, forecast.projectedMonthly], backgroundColor: ['#059669', '#93c5fd'], borderRadius: 8 }],
      },
      opts: { scales: { y: { beginAtZero: true } } },
    },
    'chart-top': {
      type: 'bar',
      data: {
        labels: top.length ? top.map((x) => x.name) : [t('noData')],
        datasets: [{ data: top.length ? top.map((x) => x.qty) : [0], backgroundColor: '#b8956a', borderRadius: 6 }],
      },
      opts: { indexAxis: 'y' },
    },
    'chart-dist-full': {
      type: 'doughnut',
      data: {
        labels: [`${t('abayaShare')} ${dist.abayasPct}%`, `${t('shippingShare')} ${dist.shippingPct}%`],
        datasets: [{ data: [dist.abayas, dist.shipping], backgroundColor: ['#b8956a', '#2563eb'] }],
      },
      opts: { plugins: { legend: { position: 'bottom' } } },
    },
    'chart-forecast-full': {
      type: 'line',
      data: {
        labels: ['M1', 'M2', 'M3'],
        datasets: [{
          label: t('profitForecast'),
          data: [forecast.monthProfit, forecast.projectedMonthly, forecast.projectedQuarter / 3],
          borderColor: '#059669',
          backgroundColor: 'rgba(5,150,105,0.1)',
          fill: true,
          tension: 0.4,
        }],
      },
      opts: { scales: { y: { beginAtZero: true } } },
    },
    'chart-top-full': {
      type: 'bar',
      data: {
        labels: top.length ? top.map((x) => x.name) : [t('noData')],
        datasets: [{ data: top.length ? top.map((x) => x.qty) : [0], backgroundColor: '#1a1f2e', borderRadius: 6 }],
      },
      opts: {},
    },
  };

  Object.entries(chartMap).forEach(([id, cfg]) => {
    const canvas = document.getElementById(id);
    if (!canvas) return;
    charts[id] = new Chart(canvas, {
      type: cfg.type,
      data: cfg.data,
      options: {
        ...CHART_DEFAULTS,
        ...cfg.opts,
        animation: CHART_ANIMATION,
        plugins: { ...CHART_DEFAULTS.plugins, ...cfg.opts?.plugins },
      },
    });
  });
}

function navigateToTab(tab) {
  if (!tab || !NAV_TABS.includes(tab)) return;
  if (!AuthSystem.isLoggedIn()) return;
  if (!navTabsForUser().includes(tab)) tab = 'dashboard';

  document.querySelectorAll('.site-nav__btn').forEach((btn) => {
    const target = btn.dataset.target || btn.dataset.tab;
    const isActive = target === tab;
    btn.classList.toggle('site-nav__btn--active', isActive);
    btn.setAttribute('aria-current', isActive ? 'page' : 'false');
  });

  document.querySelectorAll('.panel').forEach((panel) => {
    panel.classList.remove('panel--active');
  });
  const section = document.getElementById(tab);
  if (section) section.classList.add('panel--active');

  window.scrollTo({ top: 0, behavior: tab === 'pos' ? 'auto' : 'smooth' });
  if (tab === 'pos') PosUI.initPanel();
  if (tab === 'returns') renderReturnsLog();
  if (tab === 'users') UserAdmin.renderPanel();
  if (tab === 'dashboard' || tab === 'analytics') scheduleCharts();
}

function scrollToForm(formId) {
  const form = document.getElementById(formId);
  if (form) {
    form.closest('.card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    form.querySelector('input, select')?.focus();
  }
}

function toggleFab(forceOpen) {
  const menu = document.getElementById('fab-menu');
  const btn = document.getElementById('fab-toggle');
  if (!menu || !btn) return;
  const isOpen = typeof forceOpen === 'boolean' ? forceOpen : menu.hidden;
  menu.hidden = !isOpen;
  btn.setAttribute('aria-expanded', String(isOpen));
}

function renderAll() {
  if (!AuthSystem.isLoggedIn()) return;
  renderDashboard();
  UserAdmin.renderPanel();
  if (document.getElementById('pos-search')) {
    PosEngine.warmCache();
    const hint = document.getElementById('pos-cache-hint');
    if (hint) {
      hint.textContent = PosEngine.cache.length
        ? `${PosEngine.cache.length} ${t('available')}`
        : t('posNoStock');
    }
    PosUI.renderQuickAdd();
    PosUI.renderCart();
  }
  renderExpensesTable(document.getElementById('expense-filter')?.value || '');
  renderInventoryTable(document.getElementById('inv-search')?.value || '');
  DynamicPricingUI.populateProductSelect();
  DynamicPricingUI.renderTotalPreview();
  syncSmartPricingFromProduct();
  renderSmartPricing();
  renderSalesTable(document.getElementById('sale-search')?.value || '');
  populateSaleSelect();
  toggleExchangeField();
  renderLiveRatesPanel();
  renderStyleInsights();
  renderNotificationStatus();
  renderReturnsLog();

  const vat = document.getElementById('set-vat');
  if (vat) vat.value = (state.settings.vatRate * 100).toFixed(0);


  const sb = document.getElementById('supabase-status');
  if (sb) {
    const ready = APP_CONFIG.supabase.url && APP_CONFIG.supabase.anonKey;
    sb.textContent = ready ? t('supabaseReady') : t('supabaseLocal');
    sb.classList.toggle('supabase-badge--ready', !!ready);
  }

  scheduleCharts();
  updateConnectionStatus();
  if (document.getElementById('sip-transaction-log-tbody')) {
    InvoiceOcrUI.renderTransactionLog();
  }
  enforceAutocompleteOff(document.getElementById('app') || document);
}

// ═══════════════════════════════════════════════════════════════
//  Supplier invoice processor — document-level binding (survives renderApp)
// ═══════════════════════════════════════════════════════════════

let sipProcessorEventsBound = false;

/**
 * معالجة ملف فاتورة المورد — مربوطة بزر #sip-start-process
 */
async function handleFileUpload(e) {
  console.log('Test: Processing started...');
  if (e?.preventDefault) e.preventDefault();

  const input = document.getElementById('supplier-invoice-input');
  const file = InvoiceOcrUI.pendingFile || input?.files?.[0];
  if (!file) {
    console.warn('[Invoice Processor] No file selected');
    showToast(t('sipDropHint'), 'error');
    return;
  }
  if (!InvoiceOcrUI.pendingFile) {
    InvoiceOcrUI.setPendingFile(file);
    return;
  }
  if (typeof Tesseract === 'undefined') {
    console.error('[Invoice Processor] Tesseract is not loaded (global undefined)');
    showToast(t('invoiceOcrLibMissing'), 'error');
    return;
  }
  await InvoiceOcrUI.runOcrAndFill();
}

if (typeof window !== 'undefined') {
  window.handleFileUpload = handleFileUpload;
}

function bindSupplierInvoiceProcessorEvents() {
  if (sipProcessorEventsBound) return;
  sipProcessorEventsBound = true;

  document.addEventListener('click', (e) => {
    if (e.target.closest('#sip-save-inventory')) {
      e.preventDefault();
      InvoiceOcrUI.confirmAndSaveToInventory();
      return;
    }
    if (e.target.closest('#sip-start-process')) {
      e.preventDefault();
      handleFileUpload(e);
      return;
    }
  });

  document.addEventListener('change', (e) => {
    if (e.target.id !== 'supplier-invoice-input') return;
    const file = e.target.files?.[0];
    if (file) InvoiceOcrUI.setPendingFile(file);
  });

  document.addEventListener('input', (e) => {
    if (e.target.id === 'sip-exchange-rate') {
      InvoiceOcrUI.updateFxLabel();
      InvoiceOcrUI.redistributeAllRowCosts();
      InvoiceOcrUI.saveExchangeRate();
      return;
    }
    if (e.target.closest('#sip-review-tbody [data-inv-field]')) {
      InvoiceOcrUI.syncSimpleRow(e.target.closest('tr[data-invoice-row]'));
    }
  });

  document.addEventListener('change', (e) => {
    if (e.target.id === 'sip-exchange-rate') InvoiceOcrUI.saveExchangeRate();
  });

  document.addEventListener('dragenter', (e) => {
    const zone = e.target.closest('#sip-drop-zone');
    if (!zone) return;
    e.preventDefault();
    zone.classList.add('sip-drop-zone--active');
  });
  document.addEventListener('dragover', (e) => {
    const zone = e.target.closest('#sip-drop-zone');
    if (!zone) return;
    e.preventDefault();
    zone.classList.add('sip-drop-zone--active');
  });
  document.addEventListener('dragleave', (e) => {
    const zone = e.target.closest('#sip-drop-zone');
    if (!zone || zone.contains(e.relatedTarget)) return;
    zone.classList.remove('sip-drop-zone--active');
  });
  document.addEventListener('drop', (e) => {
    const zone = e.target.closest('#sip-drop-zone');
    if (!zone) return;
    e.preventDefault();
    zone.classList.remove('sip-drop-zone--active');
    const file = e.dataTransfer?.files?.[0];
    if (file) InvoiceOcrUI.setPendingFile(file);
  });
}

// ═══════════════════════════════════════════════════════════════
//  Events — delegation (single bind, fast)
// ═══════════════════════════════════════════════════════════════

function bindEvents() {
  if (eventsBound) return;
  eventsBound = true;

  document.getElementById('lang-toggle')?.addEventListener('click', () => setLang(currentLang === 'ar' ? 'en' : 'ar'));

  const handleLogo = (file) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = (ev) => {
      state.settings.logo = ev.target.result;
      DataStore.save();
      applyLogos();
      showToast(t('saved'));
    };
    r.readAsDataURL(file);
  };

  document.getElementById('settings-logo-input')?.addEventListener('change', (e) => handleLogo(e.target.files[0]));

  bindSupplierInvoiceProcessorEvents();

  document.getElementById('product-image-input')?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast(t('invoiceFileTooLarge'), 'error');
      e.target.value = '';
      return;
    }
    const r = new FileReader();
    r.onload = (ev) => updateProductImagePreview(ev.target.result);
    r.readAsDataURL(file);
  });

  document.getElementById('fab-toggle')?.addEventListener('click', () => {
    const menu = document.getElementById('fab-menu');
    toggleFab(menu?.hidden);
  });

  document.querySelectorAll('.fab__item').forEach((btn) => {
    btn.addEventListener('click', () => {
      toggleFab(false);
      const map = {
        pos: ['pos', null],
        expense: ['expenses', 'expense-form'],
        sale: ['sales', 'sale-form'],
        product: ['inventory', 'product-form'],
      };
      const [tab, form] = map[btn.dataset.fab] || [];
      if (tab) {
        navigateToTab(tab);
        if (btn.dataset.fab === 'product') {
          setTimeout(() => openPricingForNewProduct(), 300);
        } else if (form) {
          setTimeout(() => scrollToForm(form), 300);
        }
      }
    });
  });

  document.addEventListener('click', (e) => {
    const fab = document.getElementById('fab');
    if (fab && !fab.contains(e.target)) toggleFab(false);
  });

  document.getElementById('site-nav')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.site-nav__btn');
    if (!btn) return;
    e.preventDefault();
    const target = btn.dataset.target || btn.dataset.tab;
    if (target) navigateToTab(target);
  });

  const app = document.getElementById('app');

  app?.addEventListener('click', (e) => {
    if (e.target.closest('[data-export="full"]')) ExcelExport.exportFull();

    if (e.target.id === 'product-cancel') {
      document.getElementById('product-form')?.reset();
      document.getElementById('product-id').value = '';
      updateProductImagePreview(null);
      hidePricingCalculator();
    }
    if (e.target.id === 'product-open-pricing') openPricingForNewProduct();
    if (e.target.id === 'pricing-calculator-close') hidePricingCalculator();
    if (e.target.id === 'product-image-clear') updateProductImagePreview(null);
    if (e.target.id === 'expense-cancel') {
      document.getElementById('expense-form')?.reset();
      document.getElementById('expense-id').value = '';
      renderExpensePreview();
    }
    if (e.target.id === 'save-settings') saveSettings();
    if (e.target.id === 'reset-database-btn') MaintenanceMode.requestReset();
    if (e.target.dataset.invoiceAddRow !== undefined && e.target.closest('#supplier-invoice-processor')) {
      InvoiceOcrUI.addRow();
    }

    const removeInvRow = e.target.closest('[data-invoice-remove-row]')?.dataset.invoiceRemoveRow;
    if (removeInvRow && e.target.closest('#supplier-invoice-processor')) {
      InvoiceOcrUI.removeRow(removeInvRow);
    }
    if (e.target.id === 'refresh-rates') {
      showToast(t('ratesLoading'));
      LiveCurrencyBridge.fetchRates(true).then(() => {
        LiveCurrencyBridge.applyToExpenseForm();
        renderAll();
        showToast(state.settings.exchangeRates?.error ? t('ratesError') : t('saved'));
      });
    }
    if (e.target.id === 'enable-notifications') {
      NotificationEngine.requestPermission().then((perm) => {
        renderNotificationStatus();
        if (perm === 'granted') {
          showToast(t('notificationsOn'));
          NotificationEngine.evaluate();
        } else if (perm === 'denied') showToast(t('notificationsDenied'), 'error');
      });
    }

    const delUserId = e.target.closest('[data-del-user]')?.dataset.delUser;
    if (delUserId && confirm(t('confirmDeleteUser'))) {
      UserAdmin.deleteUser(delUserId).then((r) => {
        if (r.ok) {
          showToast(t('deleted'));
          UserAdmin.renderPanel();
        } else showToast(t(r.error), 'error');
      });
      return;
    }

    const ep = e.target.dataset.editProduct;
    if (ep) fillProduct(ep);
    if (e.target.dataset.delProduct && confirm(t('confirmDelete'))) deleteProduct(e.target.dataset.delProduct);

    const ee = e.target.dataset.editExpense;
    if (ee) fillExpense(ee);
    if (e.target.dataset.delExpense && confirm(t('confirmDelete'))) deleteExpense(e.target.dataset.delExpense);

    if (e.target.dataset.delSale && confirm(t('confirmDelete'))) deleteSale(e.target.dataset.delSale);

    const gotoProduct = e.target.dataset.gotoProduct;
    if (gotoProduct) {
      fillProduct(gotoProduct);
      navigateToTab('inventory');
    }

    if (e.target.id === 'estimate-pricing-costs') applyEstimatedPricingCosts();
    if (e.target.id === 'apply-suggested-price') applySuggestedPriceToProduct();
    if (e.target.id === 'apply-unit-cost') applyUnitCostToProduct();
    if (e.target.id === 'dp-calculate') DynamicPricingUI.calculate();
    if (e.target.id === 'dp-estimate-expenses') DynamicPricingUI.estimateFromExpenses();

    const dpApply = e.target.closest('[data-dp-apply]')?.dataset.dpApply;
    if (dpApply) DynamicPricingUI.applyTier(dpApply);

    const salePick = e.target.closest('[data-sale-pick]')?.dataset.salePick;
    if (salePick) SaleProductPicker.select(salePick);

    if (e.target.id === 'sale-product-trigger') {
      SaleProductPicker.toggleMenu();
      return;
    }
    if (!e.target.closest('.product-picker-wrap')) SaleProductPicker.closeMenu();

    const posAdd = e.target.closest('[data-pos-add]')?.dataset.posAdd;
    if (posAdd) PosUI.addToCart(posAdd, 1);

    const posRemove = e.target.closest('[data-pos-cart-remove]')?.dataset.posCartRemove;
    if (posRemove) PosUI.removeFromCart(posRemove);

    const posMinus = e.target.closest('[data-pos-cart-minus]')?.dataset.posCartMinus;
    if (posMinus) PosUI.bumpCartLine(posMinus, -1);

    const posPlus = e.target.closest('[data-pos-cart-plus]')?.dataset.posCartPlus;
    if (posPlus) PosUI.bumpCartLine(posPlus, 1);

    const openLine = e.target.closest('[data-pos-open-line]')?.dataset.posOpenLine;
    if (openLine && !e.target.closest('[data-pos-stop]')) PosUI.openLineEdit(openLine);

    const posDiscLine = e.target.closest('[data-pos-discount-line]')?.dataset.posDiscountLine;
    if (posDiscLine) PosUI.openLineDiscount(posDiscLine);

    if (e.target.dataset.posEditClose !== undefined) PosUI.closeLineEdit();
    if (e.target.id === 'pos-edit-save') PosUI.saveLineEdit();

    if (e.target.dataset.posDscClose !== undefined) PosUI.closeLineDiscount();
    if (e.target.id === 'pos-dsc-save') PosUI.saveLineDiscount();

    const discTypeBtn = e.target.closest('[data-pos-disc-type]')?.dataset.posDiscType;
    if (discTypeBtn) PosUI.setEditDiscountType(discTypeBtn);

    const dscTypeBtn = e.target.closest('[data-pos-dsc-type]')?.dataset.posDscType;
    if (dscTypeBtn) PosUI.setDiscountModalType(dscTypeBtn);

    const invoicePick = e.target.closest('[data-invoice-pick]')?.dataset.invoicePick;
    if (invoicePick) ReturnsUI.openInvoice(invoicePick);

    const refundMethod = e.target.closest('[data-refund-method]')?.dataset.refundMethod;
    if (refundMethod) ReturnsUI.confirmReturn(refundMethod);

    if (e.target.id === 'pos-complete-payment') PosUI.completePayment();
    if (e.target.id === 'pos-toggle-cart') PosUI.toggleDrawer();

    if (e.target.dataset.posDrawerClose !== undefined) PosUI.toggleDrawer(false);
    if (e.target.dataset.posPaymentClose !== undefined) PosUI.closePaymentModal();

    const payMethod = e.target.closest('[data-pos-pay]')?.dataset.posPay;
    if (payMethod) PosUI.confirmPayment(payMethod);

    const editPrice = e.target.dataset.editPrice;
    if (editPrice) {
      fillProduct(editPrice);
      showPricingCalculator({ product: getProduct(editPrice), scroll: true });
    }

    const seasonalMode = e.target.closest('[data-seasonal-mode]')?.dataset.seasonalMode;
    if (seasonalMode && e.target.closest('#inv-seasonal-bar')) {
      applyInventorySeasonalMode(seasonalMode);
    }
  });

  app?.addEventListener('change', async (e) => {
    const invPriceId = e.target.dataset?.invPriceInput;
    if (invPriceId) {
      await persistInvInlinePrice(invPriceId, parseFloat(e.target.value) || 0);
      return;
    }

    const check = e.target.closest('[data-return-check]');
    if (check) ReturnsUI.toggleCheck(check.dataset.returnCheck, check.checked);
    if (e.target.id === 'pos-edit-size') {
      PosUI.updateStockHint();
      PosUI.updateLineEditPreview();
    }
  });

  app?.addEventListener('input', (e) => {
    const invPriceId = e.target.dataset?.invPriceInput;
    if (invPriceId) {
      const p = getProduct(invPriceId);
      const tr = e.target.closest('[data-inv-product-row]');
      if (p) {
        p.price = parseFloat(e.target.value) || 0;
        syncInvProfitRow(tr, p);
        refreshInventoryProfitabilityUI(document.getElementById('inv-search')?.value || '');
      }
      return;
    }
    if (e.target.id === 'product-cost' || e.target.id === 'product-price') {
      const pid = document.getElementById('product-id')?.value;
      const cost = parseFloat(document.getElementById('product-cost')?.value) || 0;
      const price = parseFloat(document.getElementById('product-price')?.value) || 0;
      if (pid) {
        const p = getProduct(pid);
        if (p) {
          p.cost = cost;
          p.price = price;
          const tr = document.querySelector(`[data-inv-product-row="${pid}"]`);
          syncInvProfitRow(tr, p);
        }
      }
      refreshInventoryProfitabilityUI(document.getElementById('inv-search')?.value || '');
      return;
    }

    const id = e.target.id;
    if (id === 'inv-search') renderInventoryTable(e.target.value);
    if (id === 'sale-search') renderSalesTable(e.target.value);
    if (id === 'expense-filter') renderExpensesTable(e.target.value);
    if (id?.startsWith('expense-')) {
      toggleExchangeField();
      renderExpensePreview();
    }
    if (id === 'sale-qty' || id === 'sale-price') renderSalePreview();
    if (id === 'expense-currency') toggleExchangeField();
    if (id === 'pos-search') PosUI.onSearchInput(e.target.value);
    if (id === 'returns-search-invoice') ReturnsUI.search(e.target.value);
    if (e.target.dataset.invField === 'cost') {
      const tr = e.target.closest('tr[data-invoice-row]');
      const priceInput = tr?.querySelector('[data-inv-field="price"]');
      const cost = parseFloat(e.target.value);
      if (priceInput && !Number.isNaN(cost)) {
        priceInput.value = CurrencyEngine.round(cost * APP_CONFIG.recordSaleMultiplier);
      }
    }
    const invField = e.target.dataset.invField;
    if (invField && e.target.closest('#sip-review-tbody')) {
      if (e.target.closest('#supplier-invoice-processor')) {
        InvoiceOcrUI.syncSimpleRow(e.target.closest('tr[data-invoice-row]'));
      }
    }
    if (id === 'pos-edit-qty' || id === 'pos-edit-shipping' || id === 'pos-edit-discount-value') {
      if (id === 'pos-edit-qty') PosUI.updateStockHint();
      PosUI.updateLineEditPreview();
    }
    if (id === 'product-cost') syncSmartPricingFromProduct();
    if (id === 'pricing-margin') {
      const num = document.getElementById('pricing-margin-num');
      if (num) num.value = e.target.value;
      renderSmartPricing();
    }
    if (id === 'pricing-margin-num') {
      const range = document.getElementById('pricing-margin');
      if (range) range.value = Math.min(75, e.target.value || 0);
      renderSmartPricing();
    }
    if (e.target.classList?.contains('smart-pricing-input') || id === 'product-cost') {
      renderSmartPricing();
    }
    if (id === 'dp-product-select') {
      DynamicPricingUI.onProductSelect(e.target.value);
    }
    if (e.target.classList?.contains('dp-input')) {
      DynamicPricingUI.renderTotalPreview();
    }
  });

  app?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (e.target.id === 'user-add-form') {
      const errEl = document.getElementById('user-add-error');
      if (errEl) {
        errEl.hidden = true;
        errEl.textContent = '';
      }
      const res = await UserAdmin.createUser({
        username: document.getElementById('user-add-username')?.value,
        password: document.getElementById('user-add-password')?.value,
      });
      if (!res.ok) {
        if (errEl) {
          errEl.textContent = t(res.error);
          errEl.hidden = false;
        } else showToast(t(res.error), 'error');
        return;
      }
      e.target.reset();
      showToast(t('userAdded'), 'success');
      UserAdmin.renderPanel();
      return;
    }
    if (e.target.id === 'product-form') {
      await saveProduct({
        id: document.getElementById('product-id').value || null,
        code: document.getElementById('product-code').value.trim(),
        name: document.getElementById('product-name').value.trim(),
        size: document.getElementById('product-size').value,
        color: document.getElementById('product-color').value.trim(),
        style: document.getElementById('product-style')?.value || 'classic',
        cost: parseFloat(document.getElementById('product-cost').value),
        price: parseFloat(document.getElementById('product-price').value),
        quantity: parseInt(document.getElementById('product-qty').value, 10),
        image: document.getElementById('product-image-data')?.value || null,
      });
      e.target.reset();
      document.getElementById('product-id').value = '';
      updateProductImagePreview(null);
      hidePricingCalculator();
    }
    if (e.target.id === 'expense-form') {
      await saveExpense({
        id: document.getElementById('expense-id').value || null,
        name: document.getElementById('expense-name').value.trim(),
        category: document.getElementById('expense-category').value,
        currency: document.getElementById('expense-currency').value,
        amountOriginal: parseFloat(document.getElementById('expense-amount').value),
        exchangeRate: parseFloat(document.getElementById('expense-rate').value) || 1,
        dueDate: document.getElementById('expense-due')?.value || null,
      });
      e.target.reset();
      toggleExchangeField();
    }
    if (e.target.id === 'sale-form') {
      const productId = document.getElementById('sale-product')?.value;
      if (!productId) {
        showToast(t('product'), 'error');
        SaleProductPicker.toggleMenu(true);
        return;
      }
      await saveSale({
        productId,
        quantity: parseInt(document.getElementById('sale-qty').value, 10),
        unitPriceAud: parseFloat(document.getElementById('sale-price').value),
        customer: document.getElementById('sale-customer').value,
        payment: document.getElementById('sale-payment').value,
      });
      e.target.reset();
      document.getElementById('sale-qty').value = '1';
      SaleProductPicker.reset();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target?.id === 'returns-search-invoice') {
      ReturnsUI.search(e.target.value);
      return;
    }

    if (!document.getElementById('pos')?.classList.contains('panel--active')) return;

    if (e.key === 'Enter' && e.target?.id === 'pos-search') {
      const first = document.querySelector('[data-pos-add]');
      if (first) {
        e.preventDefault();
        PosUI.addToCart(first.dataset.posAdd, 1);
        e.target.value = '';
        PosUI.renderResults('');
      }
    }
  });
}

function fillProduct(id) {
  const p = getProduct(id);
  if (!p) return;
  document.getElementById('product-id').value = p.id;
  document.getElementById('product-code').value = p.code;
  document.getElementById('product-name').value = p.name;
  document.getElementById('product-size').value = p.size;
  document.getElementById('product-color').value = p.color;
  const styleEl = document.getElementById('product-style');
  if (styleEl) styleEl.value = p.style || 'classic';
  document.getElementById('product-cost').value = p.cost;
  document.getElementById('product-price').value = p.price;
  document.getElementById('product-qty').value = p.quantity;
  updateProductImagePreview(p.image || null);
  const dpSel = document.getElementById('dp-product-select');
  if (dpSel) dpSel.value = p.id;
  DynamicPricingUI.setInputs(DynamicPricingEngine.inputsFromProduct(p));
  DynamicPricingUI.renderTotalPreview();
  navigateToTab('inventory');
  showPricingCalculator({ product: p, scroll: true });
  scrollToForm('product-form');
}

function fillExpense(id) {
  const e = state.expenses.find((x) => x.id === id);
  if (!e) return;
  document.getElementById('expense-id').value = e.id;
  document.getElementById('expense-name').value = e.name;
  document.getElementById('expense-category').value = e.category;
  document.getElementById('expense-currency').value = e.currency;
  document.getElementById('expense-amount').value = e.amountOriginal;
  document.getElementById('expense-rate').value = e.exchangeRate;
  const dueEl = document.getElementById('expense-due');
  if (dueEl) dueEl.value = e.dueDate ? e.dueDate.slice(0, 10) : '';
  toggleExchangeField();
  renderExpensePreview();
  navigateToTab('expenses');
  scrollToForm('expense-form');
}

async function saveSettings() {
  state.settings.vatRate = parseFloat(document.getElementById('set-vat').value) / 100;
  await DataStore.save();
  showToast(t('saved'));
  renderAll();
}

function setLang(lang) {
  currentLang = lang;
  state.settings.lang = lang;
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.getElementById('lang-toggle').textContent = lang === 'ar' ? 'EN' : 'عربي';
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const k = el.dataset.i18n;
    if (TRANSLATIONS[lang][k]) el.textContent = TRANSLATIONS[lang][k];
  });
  AuthSystem.refreshAuthI18n();
  DataStore.save();
  const activeTab = getActiveTab();
  renderSiteNav(activeTab);
  renderApp();
  renderAll();
  document.querySelectorAll('.fab__item').forEach((btn) => {
    const k = btn.dataset.i18n;
    if (k && TRANSLATIONS[lang][k]) btn.textContent = TRANSLATIONS[lang][k];
  });
}

function seedDemo() {
  if (state.products.length) return;
  [
    { code: 'PAB-001', name: 'Classic Abaya', size: '56', color: 'Black', style: 'classic', cost: 95, price: 189, quantity: 20 },
    { code: 'PAB-002', name: 'Embroidered', size: '54', color: 'Navy', style: 'embroidered', cost: 145, price: 289, quantity: 12 },
    { code: 'PAB-003', name: 'Crepe Abaya', size: '58', color: 'Beige', style: 'crepe', cost: 110, price: 219, quantity: 8 },
  ].forEach((p) => state.products.push({ ...p, id: uid(), createdAt: new Date().toISOString() }));

  state.expenses.push({
    id: uid(),
    name: 'Shipment from Dubai',
    category: 'intl_shipping',
    currency: 'USD',
    amountOriginal: 450,
    exchangeRate: 1.52,
    financials: CurrencyEngine.calcExpense({ amountOriginal: 450, currency: 'USD', exchangeRate: 1.52, vatRate: 0.15 }),
    createdAt: new Date().toISOString(),
  });

  if (!state.sales.length && state.products.length) {
    const p = state.products[0];
    const p2 = state.products[2] || state.products[1];
    [3, 5, 2, 4, 1, 6, 3, 2].forEach((qty, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i * 5);
      const prod = i % 2 ? p2 : p;
      state.sales.push({
        id: uid(),
        productId: prod.id,
        productName: prod.name,
        productCode: prod.code,
        productColor: prod.color,
        productStyle: prod.style || 'classic',
        quantity: qty,
        unitPriceAud: prod.price,
        unitCostAud: prod.cost,
        customer: '—',
        payment: 'Cash',
        createdAt: d.toISOString(),
      });
    });
    state.products[0].quantity = Math.max(2, p.quantity - 10);
    if (p2) state.products.find((x) => x.id === p2.id).quantity = 4;
  }

  DataStore.save();
}

function initDataProvider() {
  if (typeof SupabaseBridge !== 'undefined' && SupabaseBridge.isConfigured() && SupabaseBridge.getClient()) {
    DataStore.provider = 'supabase';
    if (window.SUPABASE_CONFIG?.url) {
      APP_CONFIG.supabase.url = window.SUPABASE_CONFIG.url;
      APP_CONFIG.supabase.anonKey = window.SUPABASE_CONFIG.anonKey;
    }
    console.info('[Prestige] Data provider: Supabase');
    return true;
  }
  DataStore.provider = 'local';
  return false;
}

async function init() {
  // purgeStorageForLoginPage(); — disabled: guest mode must not wipe localStorage on load
  initDataProvider();
  await AuthSystem.enterAsGuest();
  await DataStore.load();
  await AuthStore.seedBootstrapAdmin();
  AuthSystem.syncSession();
  currentLang = state.settings.lang || APP_CONFIG.defaultLang;
  document.documentElement.lang = currentLang;
  document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';

  seedDemo();
  await NotificationEngine.registerServiceWorker();
  renderApp();
  bindEvents();
  AuthSystem.bindEvents();
  setLang(currentLang);
  // await AuthSystem.ensure(); — login screen removed; enterAsGuest() runs above
  navigateToTab('dashboard');
  renderAll();
  applyLogos();
  updateConnectionStatus();

  LiveCurrencyBridge.fetchRates().then(() => {
    LiveCurrencyBridge.applyToExpenseForm();
    renderAll();
  });

  if (state.settings.notificationsEnabled && Notification.permission === 'granted') {
    NotificationEngine.evaluate();
  }
}

document.addEventListener('DOMContentLoaded', init);
