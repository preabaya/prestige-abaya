/**
 * Prestige Abaya — AI Command Bar (data-entry.html)
 */
(function (global) {
  'use strict';

  const KPI_IDS = ['de-kpi-revenue', 'de-kpi-profit', 'de-kpi-tax', 'de-kpi-inventory'];
  const SOURCE_LABELS = {
    openai: 'OpenAI',
    simulation: 'محاكاة ذكية',
  };

  let parseTimer = null;
  let currentParsed = null;
  let currentJson = null;
  let currentSource = 'simulation';
  let kpiRefreshInFlight = false;

  function $(id) {
    return document.getElementById(id);
  }

  function formatAud(n) {
    const v = Number(n);
    if (!Number.isFinite(v)) return '—';
    return v.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  function showError(el, msg) {
    if (!el) return;
    if (msg) {
      el.textContent = msg;
      el.hidden = false;
    } else {
      el.textContent = '';
      el.hidden = true;
    }
  }

  function setKpiLoading(cardId, loading) {
    const card = $(cardId);
    if (!card) return;
    card.classList.toggle('exec-kpi-card--loading', loading);
    const spinner = card.querySelector('.exec-kpi-spinner');
    const val = card.querySelector('.data-entry-kpi-pill__value');
    if (spinner) spinner.hidden = !loading;
    if (val) val.hidden = loading;
  }

  function setKpiValue(cardId, value) {
    const card = $(cardId);
    if (!card) return;
    setKpiLoading(cardId, false);
    const val = card.querySelector('.data-entry-kpi-pill__value');
    if (val) {
      val.hidden = false;
      val.textContent = value;
    }
    card.classList.add('data-entry-kpi-pill--pulse');
    setTimeout(function () {
      card.classList.remove('data-entry-kpi-pill--pulse');
    }, 900);
  }

  async function refreshBackgroundKpis() {
    if (kpiRefreshInFlight || !global.DashboardService) return;
    kpiRefreshInFlight = true;
    KPI_IDS.forEach((id) => setKpiLoading(id, true));
    try {
      const snap = await global.DashboardService.getDashboardSnapshot({
        countryCode: global.DashboardService.getDefaultCountryCode(),
      });
      if (!snap?.ok) return;
      if (snap.revenue?.ok) setKpiValue('de-kpi-revenue', formatAud(snap.revenue.totalRevenue));
      if (snap.profit?.ok) setKpiValue('de-kpi-profit', formatAud(snap.profit.netProfit));
      if (snap.tax?.ok) setKpiValue('de-kpi-tax', formatAud(snap.tax.taxAmount));
      if (snap.inventory?.ok) {
        setKpiValue(
          'de-kpi-inventory',
          String((snap.inventory.lowCount || 0) + (snap.inventory.outOfStockCount || 0))
        );
      }
    } catch (err) {
      console.warn('[data-entry] KPI:', err);
    } finally {
      kpiRefreshInFlight = false;
    }
  }

  function readPreviewFields() {
    return {
      entryType: $('preview-edit-type')?.value,
      productName: $('preview-edit-product')?.value?.trim(),
      product: $('preview-edit-slug')?.value?.trim(),
      amount: $('preview-edit-price')?.value,
      currency: $('preview-edit-currency')?.value,
      quantity: $('preview-edit-qty')?.value,
      branchName: $('preview-edit-branch')?.value?.trim(),
      rawText: $('ai-command-input')?.value?.trim() || 'edited',
    };
  }

  function fillPreview(parsed, json, source) {
    currentParsed = parsed;
    currentJson = json;
    currentSource = source || 'simulation';

    const panel = $('smart-preview');
    if (panel) {
      panel.hidden = false;
      panel.classList.add('data-entry-smart-preview--reveal');
    }

    const badge = $('parse-source-badge');
    if (badge) {
      badge.textContent = SOURCE_LABELS[source] || source;
      badge.dataset.source = source;
    }

    if ($('preview-edit-type')) $('preview-edit-type').value = parsed.entryType || 'sale';
    if ($('preview-edit-product')) $('preview-edit-product').value = parsed.productName || '';
    if ($('preview-edit-slug')) {
      $('preview-edit-slug').value = parsed.productSlug || json?.product || '';
    }
    if ($('preview-edit-price')) $('preview-edit-price').value = parsed.amount != null ? parsed.amount : '';
    if ($('preview-edit-currency')) $('preview-edit-currency').value = parsed.currency || 'SAR';
    if ($('preview-edit-qty')) $('preview-edit-qty').value = String(parsed.quantity != null ? parsed.quantity : 1);
    if ($('preview-edit-branch')) {
      $('preview-edit-branch').value = parsed.branchName || json?.branch || '';
    }

    const jsonEl = $('preview-json');
    if (jsonEl) {
      jsonEl.textContent = JSON.stringify(json || global.DashboardService?.toCommandJson?.(parsed) || parsed, null, 2);
    }
  }

  function hidePreview() {
    const panel = $('smart-preview');
    if (panel) {
      panel.hidden = true;
      panel.classList.remove('data-entry-smart-preview--reveal');
    }
    currentParsed = null;
    currentJson = null;
  }

  function setAnalyzeLoading(loading) {
    const btn = $('ai-command-analyze');
    const spinner = $('analyze-spinner');
    const label = $('analyze-label');
    if (btn) btn.disabled = loading;
    if (spinner) spinner.hidden = !loading;
    if (label) label.textContent = loading ? 'جاري التحليل…' : 'تحليل';
    const bar = $('data-entry-command-bar');
    if (bar) bar.classList.toggle('data-entry-command-bar--thinking', loading);
  }

  function setSaveLoading(loading) {
    const btn = $('smart-save');
    const spinner = $('save-spinner');
    const label = $('save-label');
    if (btn) btn.disabled = loading;
    if (spinner) spinner.hidden = !loading;
    if (label) label.textContent = loading ? 'جاري الحفظ…' : 'حفظ في Supabase';
  }

  async function runAnalyze() {
    const input = $('ai-command-input');
    const text = input?.value?.trim() || '';
    if (!text) {
      showError($('ai-command-error'), 'اكتب أمراً في شريط الأوامر');
      return;
    }
    if (!global.DashboardService?.parseCommandWithAI) {
      showError($('ai-command-error'), 'DashboardService غير متاح');
      return;
    }

    setAnalyzeLoading(true);
    showError($('ai-command-error'), '');

    try {
      const res = await global.DashboardService.parseCommandWithAI(text);
      if (!res.ok) {
        hidePreview();
        showError($('ai-command-error'), res.error || 'فشل التحليل');
        return;
      }
      const json = res.json || global.DashboardService.toCommandJson(res.parsed);
      fillPreview(res.parsed, json, res.source);
      $('smart-preview')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (err) {
      showError($('ai-command-error'), err.message || String(err));
    } finally {
      setAnalyzeLoading(false);
    }
  }

  function scheduleAnalyze() {
    clearTimeout(parseTimer);
    const text = $('ai-command-input')?.value?.trim() || '';
    if (text.length < 6) {
      hidePreview();
      showError($('ai-command-error'), '');
      return;
    }
    parseTimer = setTimeout(runAnalyze, 480);
  }

  function buildParsedFromPreview() {
    if (!global.DashboardService?.parsedFromEditableFields) return null;
    const fields = readPreviewFields();
    const res = global.DashboardService.parsedFromEditableFields(fields);
    if (!res.ok) return res;
    if (fields.product) res.parsed.productSlug = fields.product;
    return res;
  }

  function triggerSuccessMicro(parsed, saved) {
    const wrap = $('data-entry-command-wrap');
    const bar = $('data-entry-command-bar');
    wrap?.classList.add('data-entry-command-wrap--success');
    bar?.classList.add('data-entry-command-bar--success-flash');
    setTimeout(function () {
      wrap?.classList.remove('data-entry-command-wrap--success');
      bar?.classList.remove('data-entry-command-bar--success-flash');
    }, 1400);

    launchConfetti();

    const toast = $('data-entry-toast');
    const title = $('toast-title');
    const detail = $('toast-detail');
    if (title) title.textContent = 'تم الحفظ بنجاح';
    if (detail) {
      detail.textContent =
        (parsed.productName || '') +
        ' · ' +
        formatAud(parsed.amountAud) +
        ' AUD · ' +
        (saved?.table || '');
    }
    if (toast) {
      toast.hidden = false;
      toast.classList.add('data-entry-toast--show');
      setTimeout(function () {
        toast.classList.remove('data-entry-toast--show');
        setTimeout(function () {
          toast.hidden = true;
        }, 400);
      }, 4200);
    }

    const saveBtn = $('smart-save');
    saveBtn?.classList.add('data-entry-save-btn--success');
    setTimeout(function () {
      saveBtn?.classList.remove('data-entry-save-btn--success');
    }, 1200);
  }

  function launchConfetti() {
    const root = $('data-entry-confetti');
    if (!root) return;
    root.innerHTML = '';
    const colors = ['#D4AF37', '#1E293B', '#059669', '#E8C96A', '#64748B'];
    for (let i = 0; i < 28; i++) {
      const p = document.createElement('span');
      p.className = 'data-entry-confetti__particle';
      p.style.setProperty('--x', String((Math.random() - 0.5) * 280) + 'px');
      p.style.setProperty('--y', String(-80 - Math.random() * 220) + 'px');
      p.style.setProperty('--r', String(Math.random() * 720) + 'deg');
      p.style.setProperty('--d', String(0.6 + Math.random() * 0.7) + 's');
      p.style.background = colors[i % colors.length];
      root.appendChild(p);
    }
    root.classList.add('data-entry-confetti--active');
    setTimeout(function () {
      root.classList.remove('data-entry-confetti--active');
      root.innerHTML = '';
    }, 1600);
  }

  async function handleSave() {
    const built = buildParsedFromPreview();
    if (!built?.ok) {
      showError($('ai-command-error'), built?.error || 'أكمل Smart Preview أولاً');
      return;
    }

    if (!global.DashboardService?.submitParsedCommand) {
      showError($('ai-command-error'), 'لا يمكن الحفظ');
      return;
    }

    setSaveLoading(true);
    showError($('ai-command-error'), '');

    try {
      const res = await global.DashboardService.submitParsedCommand(built.parsed);
      if (!res.ok) {
        showError($('ai-command-error'), res.error || 'فشل الحفظ');
        return;
      }

      triggerSuccessMicro(res.parsed, res.saved);
      $('ai-command-input').value = '';
      hidePreview();
      await refreshBackgroundKpis();
      if (global.refreshUI) global.refreshUI();
    } catch (err) {
      showError($('ai-command-error'), err.message || String(err));
    } finally {
      setSaveLoading(false);
    }
  }

  function syncSlugFromProduct() {
    const name = $('preview-edit-product')?.value || '';
    if (global.DashboardService?.slugifyProduct && $('preview-edit-slug')) {
      $('preview-edit-slug').value = global.DashboardService.slugifyProduct(name);
    }
    updateJsonPreview();
  }

  function updateJsonPreview() {
    const built = buildParsedFromPreview();
    if (built?.ok && $('preview-json')) {
      $('preview-json').textContent = JSON.stringify(
        built.json || global.DashboardService?.toCommandJson?.(built.parsed),
        null,
        2
      );
    }
  }

  function openModal() {
    $('data-entry-modal').hidden = false;
    $('manual-product')?.focus();
  }

  function closeModal() {
    $('data-entry-modal').hidden = true;
    showError($('manual-form-error'), '');
  }

  async function handleManualSubmit(e) {
    e.preventDefault();
    if (!global.DashboardService?.saveManualEntry) return;

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
      triggerSuccessMicro(res.parsed, res.saved);
      await refreshBackgroundKpis();
      if (global.refreshUI) global.refreshUI();
      e.target.reset();
      if ($('manual-qty')) $('manual-qty').value = '1';
    } catch (err) {
      showError($('manual-form-error'), err.message || String(err));
    }
  }

  function bindPreviewEditors() {
    [
      'preview-edit-type',
      'preview-edit-product',
      'preview-edit-slug',
      'preview-edit-price',
      'preview-edit-currency',
      'preview-edit-qty',
      'preview-edit-branch',
    ].forEach(function (id) {
      $(id)?.addEventListener('input', updateJsonPreview);
      $(id)?.addEventListener('change', updateJsonPreview);
    });
    $('preview-edit-product')?.addEventListener('input', syncSlugFromProduct);
  }

  function bindEvents() {
    $('ai-command-analyze')?.addEventListener('click', runAnalyze);
    $('ai-command-input')?.addEventListener('input', scheduleAnalyze);
    $('ai-command-input')?.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        runAnalyze();
      }
      if (e.key === 'Enter' && !e.shiftKey && currentParsed) {
        e.preventDefault();
        handleSave();
      }
    });

    $('smart-save')?.addEventListener('click', handleSave);
    $('smart-reparse')?.addEventListener('click', runAnalyze);

    document.querySelectorAll('.data-entry-example-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        const ex = chip.getAttribute('data-example') || '';
        const input = $('ai-command-input');
        if (input) {
          input.value = ex;
          input.focus();
          runAnalyze();
        }
      });
    });

    $('data-entry-fab')?.addEventListener('click', openModal);
    $('data-entry-modal-close')?.addEventListener('click', closeModal);
    $('data-entry-modal-backdrop')?.addEventListener('click', closeModal);
    $('manual-cancel')?.addEventListener('click', closeModal);
    $('manual-entry-form')?.addEventListener('submit', handleManualSubmit);

    bindPreviewEditors();

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
    $('ai-command-input')?.focus();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  global.DataEntryPage = { refreshBackgroundKpis, runAnalyze };
})(typeof window !== 'undefined' ? window : global);
