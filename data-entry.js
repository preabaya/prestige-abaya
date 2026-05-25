/**
 * Prestige Abaya — Smart Data Entry page
 */
(function (global) {
  'use strict';

  const TYPE_LABELS = {
    sale: 'مبيعة',
    expense: 'مصروف',
    inventory: 'مخزون',
  };

  const KPI_IDS = ['de-kpi-revenue', 'de-kpi-profit', 'de-kpi-tax', 'de-kpi-inventory'];
  let parseTimer = null;
  let kpiRefreshInFlight = false;

  function $(id) {
    return document.getElementById(id);
  }

  function formatAud(n) {
    const v = Number(n);
    if (!Number.isFinite(v)) return '—';
    return v.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  function setKpiLoading(cardId, loading) {
    const card = $(cardId);
    if (!card) return;
    card.classList.toggle('exec-kpi-card--loading', loading);
    card.setAttribute('aria-busy', loading ? 'true' : 'false');
    const spinner = card.querySelector('.exec-kpi-spinner');
    const val = card.querySelector('.exec-kpi-card__value');
    if (spinner) spinner.hidden = !loading;
    if (val) val.hidden = loading;
  }

  function setKpiValue(cardId, value) {
    const card = $(cardId);
    if (!card) return;
    setKpiLoading(cardId, false);
    const val = card.querySelector('.exec-kpi-card__value');
    if (val) {
      val.hidden = false;
      val.textContent = value;
    }
  }

  async function refreshBackgroundKpis() {
    if (kpiRefreshInFlight || !global.DashboardService) return;
    kpiRefreshInFlight = true;
    KPI_IDS.forEach((id) => setKpiLoading(id, true));

    try {
      const countryCode = global.DashboardService.getDefaultCountryCode();
      const snap = await global.DashboardService.getDashboardSnapshot({ countryCode });
      if (!snap?.ok) return;

      if (snap.revenue?.ok) setKpiValue('de-kpi-revenue', formatAud(snap.revenue.totalRevenue));
      if (snap.profit?.ok) setKpiValue('de-kpi-profit', formatAud(snap.profit.netProfit));
      if (snap.tax?.ok) setKpiValue('de-kpi-tax', formatAud(snap.tax.taxAmount));
      if (snap.inventory?.ok) {
        const alerts = (snap.inventory.lowCount || 0) + (snap.inventory.outOfStockCount || 0);
        setKpiValue('de-kpi-inventory', String(alerts));
      }
    } catch (err) {
      console.warn('[data-entry] KPI refresh:', err);
    } finally {
      kpiRefreshInFlight = false;
    }
  }

  function showError(el, message) {
    if (!el) return;
    if (message) {
      el.textContent = message;
      el.hidden = false;
    } else {
      el.textContent = '';
      el.hidden = true;
    }
  }

  function renderPreview(parsed) {
    const panel = $('data-entry-preview');
    if (!panel) return;
    if (!parsed) {
      panel.hidden = true;
      return;
    }
    panel.hidden = false;
    const typeEl = $('preview-type');
    const productEl = $('preview-product');
    const amountEl = $('preview-amount');
    const branchEl = $('preview-branch');
    const qtyEl = $('preview-qty');
    const audEl = $('preview-aud');
    if (typeEl) typeEl.textContent = TYPE_LABELS[parsed.entryType] || parsed.entryType;
    if (productEl) productEl.textContent = parsed.productName || '—';
    if (amountEl) {
      amountEl.textContent =
        (parsed.amount != null ? parsed.amount : '—') + ' ' + (parsed.currency || '');
    }
    if (branchEl) branchEl.textContent = parsed.branchName || 'افتراضي';
    if (qtyEl) qtyEl.textContent = String(parsed.quantity != null ? parsed.quantity : 1);
    if (audEl) audEl.textContent = formatAud(parsed.amountAud) + ' AUD';
  }

  function scheduleParse(text) {
    clearTimeout(parseTimer);
    parseTimer = setTimeout(function () {
      if (!global.DashboardService?.parseNaturalLanguageEntry) return;
      const res = global.DashboardService.parseNaturalLanguageEntry(text);
      if (res.ok) {
        renderPreview(res.parsed);
        showError($('smart-input-error'), '');
      } else if (text.trim().length > 8) {
        renderPreview(null);
        showError($('smart-input-error'), res.error || '');
      } else {
        renderPreview(null);
        showError($('smart-input-error'), '');
      }
    }, 320);
  }

  function showSuccess(parsed, saved) {
    const banner = $('data-entry-success');
    const title = $('data-entry-success-title');
    const detail = $('data-entry-success-detail');
    if (!banner) return;

    const typeLabel = TYPE_LABELS[parsed.entryType] || parsed.entryType;
    if (title) title.textContent = 'تم الحفظ بنجاح';
    if (detail) {
      detail.textContent =
        typeLabel +
        ' · ' +
        (parsed.productName || '') +
        ' · ' +
        formatAud(parsed.amountAud) +
        ' AUD' +
        (parsed.branchName ? ' · فرع ' + parsed.branchName : '') +
        (saved?.table ? ' → ' + saved.table : '');
    }
    banner.hidden = false;
    banner.classList.add('data-entry-success--visible');
    setTimeout(function () {
      banner.classList.remove('data-entry-success--visible');
    }, 5200);
  }

  function setSubmitLoading(loading) {
    const btn = $('smart-submit');
    const spinner = $('smart-submit-spinner');
    const label = $('smart-submit-label');
    if (btn) btn.disabled = loading;
    if (spinner) spinner.hidden = !loading;
    if (label) label.textContent = loading ? 'جاري الحفظ…' : 'حفظ ذكي';
  }

  async function handleSmartSubmit() {
    const input = $('smart-input');
    const text = input?.value?.trim() || '';
    if (!text) {
      showError($('smart-input-error'), 'اكتب وصف العملية أولاً');
      return;
    }
    if (!global.DashboardService?.submitNaturalLanguageEntry) {
      showError($('smart-input-error'), 'DashboardService غير متاح');
      return;
    }

    setSubmitLoading(true);
    showError($('smart-input-error'), '');

    try {
      const res = await global.DashboardService.submitNaturalLanguageEntry(text);
      if (!res.ok) {
        showError($('smart-input-error'), res.error || 'فشل الحفظ');
        return;
      }
      showSuccess(res.parsed, res.saved);
      if (input) input.value = '';
      renderPreview(null);
      await refreshBackgroundKpis();
      if (global.refreshUI) global.refreshUI();
    } catch (err) {
      showError($('smart-input-error'), err.message || String(err));
    } finally {
      setSubmitLoading(false);
    }
  }

  function openModal() {
    const modal = $('data-entry-modal');
    if (modal) modal.hidden = false;
    $('manual-product')?.focus();
  }

  function closeModal() {
    const modal = $('data-entry-modal');
    if (modal) modal.hidden = true;
    showError($('manual-form-error'), '');
  }

  async function handleManualSubmit(e) {
    e.preventDefault();
    if (!global.DashboardService?.saveManualEntry) {
      showError($('manual-form-error'), 'DashboardService غير متاح');
      return;
    }

    const fields = {
      entryType: $('manual-type')?.value,
      productName: $('manual-product')?.value?.trim(),
      amount: $('manual-amount')?.value,
      currency: $('manual-currency')?.value,
      quantity: $('manual-qty')?.value,
      branchName: $('manual-branch')?.value?.trim(),
    };

    showError($('manual-form-error'), '');
    try {
      const res = await global.DashboardService.saveManualEntry(fields);
      if (!res.ok) {
        showError($('manual-form-error'), res.error || 'فشل الحفظ');
        return;
      }
      closeModal();
      showSuccess(res.parsed, res.saved);
      await refreshBackgroundKpis();
      if (global.refreshUI) global.refreshUI();
      e.target.reset();
      if ($('manual-qty')) $('manual-qty').value = '1';
    } catch (err) {
      showError($('manual-form-error'), err.message || String(err));
    }
  }

  function bindEvents() {
    $('smart-submit')?.addEventListener('click', handleSmartSubmit);
    $('smart-clear')?.addEventListener('click', function () {
      const input = $('smart-input');
      if (input) input.value = '';
      renderPreview(null);
      showError($('smart-input-error'), '');
    });
    $('smart-input')?.addEventListener('input', function (e) {
      scheduleParse(e.target.value);
    });
    $('smart-input')?.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSmartSubmit();
      }
    });

    document.querySelectorAll('.data-entry-example-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        const ex = chip.getAttribute('data-example') || '';
        const input = $('smart-input');
        if (input) {
          input.value = ex;
          scheduleParse(ex);
          input.focus();
        }
      });
    });

    $('data-entry-fab')?.addEventListener('click', openModal);
    $('data-entry-modal-close')?.addEventListener('click', closeModal);
    $('data-entry-modal-backdrop')?.addEventListener('click', closeModal);
    $('manual-cancel')?.addEventListener('click', closeModal);
    $('manual-entry-form')?.addEventListener('submit', handleManualSubmit);
    $('data-entry-success-close')?.addEventListener('click', function () {
      const banner = $('data-entry-success');
      if (banner) banner.hidden = true;
    });

    try {
      const ch = new BroadcastChannel('prestige-erp-sales');
      ch.onmessage = function () {
        refreshBackgroundKpis();
      };
    } catch (_) { /* ignore */ }
  }

  function boot() {
    bindEvents();
    refreshBackgroundKpis();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  global.DataEntryPage = { refreshBackgroundKpis };
})(typeof window !== 'undefined' ? window : global);
