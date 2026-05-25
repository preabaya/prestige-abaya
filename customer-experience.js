/**
 * Prestige Abaya — Customer Experience (feedback & sentiment)
 * Requires: customer_feedback table — run supabase/migrate-customer-feedback.sql
 */
(function (global) {
  'use strict';

  const TENANT_STORAGE_KEY = 'current_tenant_id';

  function getClient() {
    if (global.DbHelper?.getClient) return global.DbHelper.getClient();
    if (global.SupabaseBridge?.getClient) return global.SupabaseBridge.getClient();
    return null;
  }

  function resolveTenantId(explicit) {
    if (explicit) return String(explicit).trim();
    if (global.DbHelper?.resolveTenantId) return global.DbHelper.resolveTenantId();
    try {
      const stored = global.localStorage?.getItem(TENANT_STORAGE_KEY);
      if (stored && String(stored).trim()) return String(stored).trim();
    } catch (_) { /* ignore */ }
    const cfg = global.SUPABASE_CONFIG || {};
    return cfg.defaultTenantId ? String(cfg.defaultTenantId).trim() : null;
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function analyzeSentiment(text) {
    if (global.AIEngine?.analyzeTextSentiment) {
      return global.AIEngine.analyzeTextSentiment(text);
    }

    const raw = String(text || '').trim();
    if (!raw) return { sentiment: 'neutral', score: 0, label: 'محايد' };

    const lower = raw.toLowerCase();
    if (/سيء|رديء|غاضب|شكوى|مشكلة|bad|angry/.test(lower)) {
      return { sentiment: 'angry', score: -1, label: 'غاضب' };
    }
    if (/ممتاز|رائع|شكر|راض|good|great|happy/.test(lower)) {
      return { sentiment: 'happy', score: 1, label: 'راضٍ' };
    }
    return { sentiment: 'neutral', score: 0, label: 'محايد' };
  }

  function feedbackTypeFromData(data) {
    const type = String(data?.feedback_type || data?.type || 'general').toLowerCase();
    if (['rating', 'complaint', 'note', 'general'].includes(type)) return type;
    return 'general';
  }

  /**
   * Save customer feedback to public.customer_feedback.
   * @param {{ customer_id: string, customer_name?: string, rating?: number, message?: string, feedback_type?: string }} feedbackData
   */
  async function logCustomerFeedback(feedbackData) {
    const core = global.PrestigeCore || global.prestigeCore;
    if (core?.probeTable && (await core.probeTable('customer_feedback')) === false) {
      return { ok: true, skipped: true, reason: 'customer_feedback table not deployed' };
    }

    const client = getClient();
    if (!client) {
      return { ok: false, error: 'Supabase غير مهيأ' };
    }

    const customerId = String(feedbackData?.customer_id || feedbackData?.customerId || '').trim();
    if (!customerId) {
      return { ok: false, error: 'customer_id مطلوب' };
    }

    const tenantId = resolveTenantId(feedbackData?.tenant_id ?? feedbackData?.tenantId);
    if (!tenantId) {
      return { ok: false, error: 'tenant_id غير مضبوط' };
    }

    const message = String(feedbackData?.message || '').trim();
    const ratingRaw = feedbackData?.rating;
    const rating = ratingRaw != null && ratingRaw !== ''
      ? Math.min(5, Math.max(1, parseInt(ratingRaw, 10) || 0))
      : null;

    const sentimentResult = analyzeSentiment(message);
    const row = {
      tenant_id: tenantId,
      customer_id: customerId,
      customer_name: String(feedbackData?.customer_name || feedbackData?.customerName || '').trim() || null,
      rating: Number.isFinite(rating) ? rating : null,
      feedback_type: feedbackTypeFromData(feedbackData),
      message: message || null,
      sentiment: sentimentResult.sentiment,
    };

    const { data, error } = await client
      .from('customer_feedback')
      .insert(row)
      .select('id, customer_id, rating, message, sentiment, created_at')
      .single();

    if (error) {
      if (core?.isRelationMissingError?.(error)) {
        return { ok: true, skipped: true, reason: error.message };
      }
      return { ok: false, error: error.message };
    }
    return { ok: true, data, sentiment: sentimentResult };
  }

  /**
   * Tenant-wide average customer satisfaction from all feedback.
   */
  async function getOverallCustomerSatisfaction() {
    const core = global.PrestigeCore || global.prestigeCore;
    if (core?.isTableAvailable && core.isTableAvailable('customer_feedback') === false) {
      return {
        ok: true,
        skipped: true,
        averageRating: null,
        feedbackCount: 0,
        reason: 'customer_feedback table not deployed',
      };
    }

    const client = getClient();
    if (!client) {
      return { ok: false, error: 'Supabase غير مهيأ', averageRating: null, feedbackCount: 0 };
    }

    const tenantId = resolveTenantId();
    let query = client
      .from('customer_feedback')
      .select('rating, sentiment')
      .order('created_at', { ascending: false })
      .limit(200);

    if (tenantId) query = query.eq('tenant_id', tenantId);

    const { data, error } = await query;
    if (error) {
      if (core?.isRelationMissingError?.(error)) {
        return {
          ok: true,
          skipped: true,
          averageRating: null,
          feedbackCount: 0,
          reason: error.message,
        };
      }
      return { ok: false, error: error.message, averageRating: null, feedbackCount: 0 };
    }

    const rows = data || [];
    if (!rows.length) {
      return {
        ok: true,
        averageRating: null,
        feedbackCount: 0,
        sentiment: 'neutral',
        label: 'لا توجد تقييمات',
      };
    }

    const ratings = rows
      .map((r) => parseInt(r.rating, 10))
      .filter((n) => Number.isFinite(n) && n >= 1 && n <= 5);

    const averageRating = ratings.length
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
      : null;

    const storedCounts = { happy: 0, angry: 0, neutral: 0 };
    rows.forEach((r) => {
      const s = r.sentiment || 'neutral';
      if (storedCounts[s] != null) storedCounts[s] += 1;
    });

    let sentiment = 'neutral';
    if (storedCounts.happy > storedCounts.angry) sentiment = 'happy';
    if (storedCounts.angry > storedCounts.happy) sentiment = 'angry';
    if (averageRating != null) {
      if (averageRating >= 4) sentiment = 'happy';
      if (averageRating <= 2.5) sentiment = 'angry';
    }

    const label = sentiment === 'happy' ? 'راضٍ' : sentiment === 'angry' ? 'غاضب' : 'محايد';

    return {
      ok: true,
      averageRating,
      feedbackCount: rows.length,
      sentiment,
      label,
      storedCounts,
    };
  }

  /**
   * Aggregate sentiment for a customer from their feedback history.
   */
  async function getCustomerSentiment(customerId) {
    const core = global.PrestigeCore || global.prestigeCore;
    if (core?.isTableAvailable && core.isTableAvailable('customer_feedback') === false) {
      return {
        ok: true,
        customerId: String(customerId || '').trim(),
        sentiment: 'neutral',
        label: 'جدول feedback غير مفعّل',
        feedbackCount: 0,
        skipped: true,
      };
    }

    const client = getClient();
    if (!client) {
      return { ok: false, error: 'Supabase غير مهيأ' };
    }

    const cid = String(customerId || '').trim();
    if (!cid) {
      return { ok: false, error: 'customer_id مطلوب' };
    }

    const tenantId = resolveTenantId();
    let query = client
      .from('customer_feedback')
      .select('id, message, rating, sentiment, feedback_type, created_at')
      .eq('customer_id', cid)
      .order('created_at', { ascending: false })
      .limit(50);

    if (tenantId) query = query.eq('tenant_id', tenantId);

    const { data, error } = await query;
    if (error) {
      if (core?.isRelationMissingError?.(error)) {
        return {
          ok: true,
          customerId: cid,
          sentiment: 'neutral',
          label: 'جدول feedback غير مفعّل',
          feedbackCount: 0,
          skipped: true,
        };
      }
      return { ok: false, error: error.message };
    }

    const rows = data || [];
    if (!rows.length) {
      return {
        ok: true,
        customerId: cid,
        sentiment: 'neutral',
        label: 'لا توجد ملاحظات',
        feedbackCount: 0,
        averageRating: null,
        samples: [],
      };
    }

    const combinedText = rows
      .map((r) => r.message)
      .filter(Boolean)
      .join(' ');

    const analyzed = analyzeSentiment(combinedText);

    const ratings = rows
      .map((r) => parseInt(r.rating, 10))
      .filter((n) => Number.isFinite(n) && n >= 1 && n <= 5);

    const averageRating = ratings.length
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
      : null;

    const storedCounts = { happy: 0, angry: 0, neutral: 0 };
    rows.forEach((r) => {
      const s = r.sentiment || 'neutral';
      if (storedCounts[s] != null) storedCounts[s] += 1;
    });

    let sentiment = analyzed.sentiment;
    if (averageRating != null) {
      if (averageRating >= 4 && sentiment !== 'angry') sentiment = 'happy';
      if (averageRating <= 2) sentiment = 'angry';
    }

    const label = sentiment === 'happy' ? 'راضٍ' : sentiment === 'angry' ? 'غاضب' : 'محايد';

    return {
      ok: true,
      customerId: cid,
      sentiment,
      label,
      feedbackCount: rows.length,
      averageRating,
      aiAnalysis: analyzed,
      storedCounts,
      samples: rows.slice(0, 5),
    };
  }

  /**
   * Render a simple customer rating / feedback form into a container.
   */
  function renderFeedbackWidget(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn('[CustomerExperience] container not found:', containerId);
      return false;
    }

    const widgetId = `cx-feedback-${containerId}`;
    container.innerHTML = `
      <div class="cx-feedback card" id="${widgetId}">
        <h3 class="cx-feedback__title">تقييم تجربتك</h3>
        <p class="cx-feedback__hint">شاركنا رأيك — نقدّر ملاحظاتك</p>
        <form class="cx-feedback__form" id="${widgetId}-form" novalidate>
          <label class="cx-feedback__label" for="${widgetId}-customer">اسمك أو رقم العميل</label>
          <input class="cx-feedback__input" id="${widgetId}-customer" name="customer_id" type="text" required maxlength="80" placeholder="مثال: سارة / C-1024">
          <fieldset class="cx-feedback__rating">
            <legend class="cx-feedback__label">التقييم</legend>
            <div class="cx-feedback__stars">
              ${[5, 4, 3, 2, 1].map((n) => `
                <label class="cx-feedback__star">
                  <input type="radio" name="rating" value="${n}" ${n === 5 ? 'checked' : ''}>
                  <span aria-hidden="true">★</span>
                </label>
              `).join('')}
            </div>
          </fieldset>
          <label class="cx-feedback__label" for="${widgetId}-message">ملاحظتك</label>
          <textarea class="cx-feedback__textarea" id="${widgetId}-message" name="message" rows="3" maxlength="1000" placeholder="اكتب تعليقك أو شكواك هنا…"></textarea>
          <button type="submit" class="btn btn--primary cx-feedback__submit">إرسال التقييم</button>
          <p class="cx-feedback__status" id="${widgetId}-status" role="status" aria-live="polite"></p>
        </form>
      </div>
    `;

    const form = document.getElementById(`${widgetId}-form`);
    const statusEl = document.getElementById(`${widgetId}-status`);

    form?.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!statusEl) return;

      const customerId = document.getElementById(`${widgetId}-customer`)?.value?.trim();
      const message = document.getElementById(`${widgetId}-message`)?.value?.trim();
      const ratingInput = form.querySelector('input[name="rating"]:checked');
      const rating = ratingInput ? parseInt(ratingInput.value, 10) : null;

      if (!customerId) {
        statusEl.textContent = 'أدخل اسمك أو رقم العميل';
        statusEl.className = 'cx-feedback__status cx-feedback__status--error';
        return;
      }

      statusEl.textContent = 'جاري الإرسال…';
      statusEl.className = 'cx-feedback__status';

      const result = await logCustomerFeedback({
        customer_id: customerId,
        customer_name: customerId,
        rating,
        message,
        feedback_type: rating && rating <= 2 ? 'complaint' : 'rating',
      });

      if (!result.ok) {
        statusEl.textContent = result.error || 'فشل الحفظ';
        statusEl.className = 'cx-feedback__status cx-feedback__status--error';
        return;
      }

      const mood = result.sentiment?.label || result.data?.sentiment || 'neutral';
      statusEl.textContent = `شكراً! تم الحفظ — المشاعر: ${mood}`;
      statusEl.className = 'cx-feedback__status cx-feedback__status--ok';
      form.reset();
      const fiveStar = form.querySelector('input[name="rating"][value="5"]');
      if (fiveStar) fiveStar.checked = true;
    });

    return true;
  }

  const CustomerExperience = {
    logCustomerFeedback,
    getCustomerSentiment,
    getOverallCustomerSatisfaction,
    renderFeedbackWidget,
    analyzeSentiment,
  };

  global.CustomerExperience = CustomerExperience;

  function bootWidget() {
    const host = document.getElementById('customer-feedback-host');
    if (host) renderFeedbackWidget('customer-feedback-host');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootWidget);
  } else {
    bootWidget();
  }
})(typeof window !== 'undefined' ? window : global);
