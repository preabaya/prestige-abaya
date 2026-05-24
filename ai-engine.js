/**
 * Prestige Abaya — AI Engine
 * المسؤول عن تحليل البيانات وإصدار التنبيهات الذكية
 */
(function() {
  'use strict';

  window.AIEngine = {
    
    // 1. تحليل عملية بيع والبحث عن أنماط غير طبيعية
    async analyzeSale(saleData) {
      console.log('[AI Engine] Analyzing sale:', saleData.id);
      
      const alerts = [];

      // فحص القيمة العالية (High Value Transaction)
      if (saleData.line_total_aud > 5000) {
        alerts.push({
          type: 'HIGH_VALUE',
          severity: 'warning',
          message: `عملية بيع ذات قيمة عالية: ${saleData.line_total_aud} AUD`
        });
      }

      // تحليل المخزون (Inventory Logic)
      if (saleData.quantity > 10) {
        alerts.push({
          type: 'BULK_ORDER',
          severity: 'info',
          message: 'طلب كمية كبيرة (جملة)'
        });
      }

      // حفظ التنبيهات في قاعدة البيانات إذا وجدنا شيئاً
      if (alerts.length > 0) {
        await this.saveAlerts(saleData, alerts);
      }
      
      return alerts;
    },

    // 2. ربط التنبيهات بـ Supabase
    async saveAlerts(sale, alerts) {
      if (typeof window.SupabaseBridge === 'undefined') return;
      
      for (const alert of alerts) {
        await window.SupabaseBridge.logAiAlert({
          tenantId: sale.tenant_id,
          alertType: alert.type,
          message: alert.message,
          tableName: 'sales',
          recordId: sale.id,
          severity: alert.severity
        });
      }
    },

    // 3. التنبؤ بأفضل منتج مبيعاً
    async predictBestSellingProduct() {
      const client = window.SupabaseBridge.getClient();
      if (!client) return null;

      // جلب آخر 50 عملية بيع لتحليلها
      const { data, error } = await client
        .from('sales')
        .select('product_name, quantity')
        .limit(50);

      if (error || !data || data.length === 0) return null;

      // حساب مجموع الكميات لكل منتج
      const salesCount = {};
      data.forEach(sale => {
        const name = sale.product_name;
        salesCount[name] = (salesCount[name] || 0) + (parseInt(sale.quantity) || 1);
      });

      // إيجاد المنتج الأكثر مبيعاً
      let bestProduct = null;
      let maxQty = 0;
      for (const product in salesCount) {
        if (salesCount[product] > maxQty) {
          maxQty = salesCount[product];
          bestProduct = product;
        }
      }

      return { product: bestProduct, totalSold: maxQty };
    }
  };

  console.log('[AI Engine] Ready to think.');
})();