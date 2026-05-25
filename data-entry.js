/**
 * Prestige Abaya — AI Command Bar (data-entry.html)
 * تحليل عبر parseNaturalLanguageEntry — حفظ عبر saveEntry بعد التأكيد فقط.
 */
(function (global) {
  'use strict';

  const KPI_IDS = ['de-kpi-revenue', 'de-kpi-profit', 'de-kpi-tax', 'de-kpi-inventory'];
  const ACTION_LABELS = {
    sale: 'مبيعات (sale_update)',
    expense: 'مصروف (expense_update)',
    inventory: 'مخزون (inventory_update)',
  };
  const INTENT_LABELS = {
    sale_update: 'مبيعات · sale_update',
    inventory_update: 'مخزون · inventory_update',
    expense_update: 'مصروف · expense_update',
  };
  const MODE_PLACEHOLDERS = {
    sale: 'بعنا 3 عباءات بـ 2000 ريال فرع جدة',
    expense: 'مصروف شحن 450 ريال فرع دبي',
    inventory: 'إضافة 50 عباءة مطرزة لفرع الرياض بسعر 800 ريال',
  };
  const MODE_HINTS = {
    sale: 'بعنا 3 عباءات بـ 2000 ريال فرع جدة',
    expense: 'مصروف شحن 450 ريال فرع دبي',
    inventory: 'إضافة 50 عباءة مطرزة لفرع الرياض بسعر 800 ريال',
  };

  let commandMode = 'sale';

  let parseTimer = null;
  let currentParsed = null;
  let currentJson = null;
  let kpiRefreshInFlight = false;

  function $(id) {
    return document.getElementById(id);
  }

  function getService() {
    return global.prestigeCore || global.PrestigeCore || global.DashboardService || global.dashboardService;
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
    const svc = getService();
    if (kpiRefreshInFlight || !svc) return;
    kpiRefreshInFlight = true;
    KPI_IDS.forEach((id) => setKpiLoading(id, true));
    try {
      const snap = await svc.getDashboardSnapshot({ countryCode: svc.getDefaultCountryCode() });
      if (!snap?.ok) return;
      if (snap.revenue?.ok) setKpiValue('de-kpi-revenue', formatAud(snap.revenue.totalRevenue));
      if (snap.profit?.ok) setKpiValue('de-kpi-profit', formatAud(snap.profit.netProfit));
      if (snap.tax?.ok) setKpiValue('de-kpi-tax', formatAud(snap.tax.taxAmount));
      if (snap.inventory?.ok) {
        const invAlerts =
          snap.inventory.stockAlertCount != null
            ? snap.inventory.stockAlertCount
            : (snap.inventory.lowCount || 0) + (snap.inventory.outOfStockCount || 0);
        setKpiValue('de-kpi-inventory', String(invAlerts));
        const invCard = $('de-kpi-inventory');
        if (invCard) {
          invCard.classList.toggle(
            'data-entry-kpi-pill--alert',
            !!(snap.inventory.alertFlag || snap.stockLevels?.alertFlag)
          );
        }
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
      action: $('preview-edit-type')?.value,
      productName: $('preview-edit-product')?.value?.trim(),
      product: $('preview-edit-slug')?.value?.trim(),
      amount: $('preview-edit-price')?.value,
      currency: $('preview-edit-currency')?.value,
      quantity: $('preview-edit-qty')?.value,
      branchName: $('preview-edit-branch')?.value?.trim(),
      rawText: $('ai-command-input')?.value?.trim() || 'edited',
    };
  }

  function updateConfirmTable(parsed, json) {
    const svc = getService();
    const branchId = parsed.branchId || svc?.resolveBranchId?.() || '—';
    const ts = parsed.recordedAt || new Date().toISOString();
    const userId = parsed.userId || svc?.resolveEntryUserId?.() || '—';

    const set = function (id, text) {
      const el = $(id);
      if (el) el.textContent = text != null ? String(text) : '—';
    };

    set(
      'preview-table-action',
      ACTION_LABELS[parsed.entryType] || json?.action || json?.type
    );
    set(
      'preview-table-intent',
      parsed.intent || json?.action || json?.type || INTENT_LABELS[intentFromEntry(parsed)] || '—'
    );
    set('preview-table-product', parsed.productName || json?.product_display || json?.product);
    set(
      'preview-table-price',
      (parsed.amount != null ? parsed.amount : '—') + ' ' + (parsed.currency || '')
    );
    set('preview-table-qty', parsed.quantity != null ? parsed.quantity : json?.quantity);
    set('preview-table-branch', parsed.branchName || json?.branch || 'افتراضي');
    set('preview-table-branch-id', branchId);
    set('preview-table-ts', ts);
    set('preview-table-user', userId);
  }

  function intentFromEntry(parsed) {
    const svc = getService();
    if (parsed?.intent) return parsed.intent;
    if (svc?.intentFromEntryType) return svc.intentFromEntryType(parsed?.entryType);
    const map = { sale: 'sale_update', inventory: 'inventory_update', expense: 'expense_update' };
    return map[parsed?.entryType] || 'sale_update';
  }

  function fillPreview(parsed, json, message, source) {
    currentParsed = parsed;
    currentJson = json;

    const panel = $('smart-preview');
    if (panel) {
      panel.hidden = false;
      panel.classList.add('data-entry-smart-preview--reveal');
      panel.classList.remove('data-entry-smart-preview--success-pop');
    }

    const svc = getService();
    const confirmMsg =
      message ||
      svc?.buildConfirmationMessage?.(parsed) ||
      'راجع التفاصيل ثم اضغط تأكيد.';

    const msgEl = $('preview-confirm-message');
    if (msgEl) msgEl.textContent = confirmMsg;

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

    updateConfirmTable(parsed, json);

    const jsonEl = $('preview-json');
    if (jsonEl) {
      jsonEl.textContent = JSON.stringify(json || svc?.toCommandJson?.(parsed) || parsed, null, 2);
    }

    const badge = $('parse-source-badge');
    if (badge) {
      badge.textContent =
        source === 'openai' ? 'OpenAI' : source === 'heuristic' ? 'تحليل ذكي' : 'جاهز للتأكيد';
    }

    const classifier =
      global.prestigeCore?.DataEntryClassifier ||
      global.PrestigeCore?.DataEntryClassifier ||
      global.DataEntryClassifier;
    if (classifier?.classify) {
      classifier.classify($('ai-command-input')?.value?.trim() || '');
    }
  }

  function hidePreview() {
    const panel = $('smart-preview');
    if (panel) {
      panel.hidden = true;
      panel.classList.remove('data-entry-smart-preview--reveal', 'data-entry-smart-preview--success-pop');
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
    $('data-entry-command-bar')?.classList.toggle('data-entry-command-bar--thinking', loading);
  }

  function setConfirmLoading(loading) {
    const btn = $('smart-confirm');
    const spinner = $('confirm-spinner');
    const label = $('confirm-label');
    if (btn) btn.disabled = loading;
    if (spinner) spinner.hidden = !loading;
    if (label) label.textContent = loading ? 'جاري الحفظ…' : 'تأكيد الحفظ';
  }

  function setCommandMode(mode) {
    commandMode = mode || 'sale';
    document.querySelectorAll('.data-entry-mode-btn').forEach(function (btn) {
      const active = btn.getAttribute('data-mode') === commandMode;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    const input = $('ai-command-input');
    const hint = document.querySelector('.data-entry-command-hint em');
    if (input) input.placeholder = MODE_PLACEHOLDERS[commandMode] || MODE_PLACEHOLDERS.sale;
    if (hint) hint.textContent = MODE_HINTS[commandMode] || MODE_HINTS.sale;
    $('data-entry-command-bar')?.setAttribute('data-entry-mode', commandMode);
    if ($('preview-edit-type')) $('preview-edit-type').value = commandMode;
  }

  function formatRecentDate(iso) {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString('ar-SA', {
        dateStyle: 'short',
        timeStyle: 'short',
      });
    } catch (_) {
      return String(iso);
    }
  }

  async function refreshInventoryOverview() {
    const svc = getService();
    const tbody = $('inventory-recent-tbody');
    const badge = $('inventory-stock-alert-badge');
    if (!tbody || !svc?.getRecentInventoryEntries) return;

    try {
      const [recentRes, stockRes] = await Promise.all([
        svc.getRecentInventoryEntries({ limit: 5 }),
        svc.checkStockLevels ? svc.checkStockLevels() : Promise.resolve(null),
      ]);

      if (badge) {
        const showAlert = !!(stockRes?.ok && (stockRes.alert_flag || stockRes.alertFlag));
        badge.hidden = !showAlert;
        if (showAlert) {
          badge.textContent =
            'تنبيه · ' +
            (stockRes.alertCount || 0) +
            ' صنف · alert_flag';
        }
      }

      tbody.innerHTML = '';
      if (!recentRes?.ok || !recentRes.recent?.length) {
        const tr = document.createElement('tr');
        tr.innerHTML =
          '<td colspan="6" class="data-entry-inventory-table__empty">' +
          (recentRes?.error || 'لا توجد عمليات مخزون بعد') +
          '</td>';
        tbody.appendChild(tr);
        return;
      }

      recentRes.recent.forEach(function (row) {
        const tr = document.createElement('tr');
        if (row.alertFlag) tr.classList.add('data-entry-inventory-table__row--alert');
        const alertCell = row.alertFlag
          ? '<span class="data-entry-inventory-table__flag">تنبيه</span>'
          : '—';
        tr.innerHTML =
          '<td class="data-entry-inventory-table__product">' +
          (row.product_name || '—') +
          '</td>' +
          '<td>' +
          (row.stock_quantity != null ? row.stock_quantity : '—') +
          '</td>' +
          '<td>' +
          (row.selling_price != null ? row.selling_price : '—') +
          '</td>' +
          '<td dir="ltr">' +
          (row.branch_id || '—') +
          '</td>' +
          '<td dir="ltr">' +
          formatRecentDate(row.last_updated) +
          '</td>' +
          '<td>' +
          alertCell +
          '</td>';
        tbody.appendChild(tr);
      });
    } catch (err) {
      tbody.innerHTML =
        '<tr><td colspan="6" class="data-entry-inventory-table__empty">' +
        (err.message || String(err)) +
        '</td></tr>';
    }
  }

  /** تحليل فقط — لا حفظ */
  async function runAnalyze() {
    const svc = getService();
    const input = $('ai-command-input');
    const text = input?.value?.trim() || '';

    if (!text) {
      showError($('ai-command-error'), 'اكتب أمراً في AI Command Bar');
      return;
    }
    if (!svc?.parseNaturalLanguageEntry) {
      showError($('ai-command-error'), 'parseNaturalLanguageEntry غير متاحة');
      return;
    }

    setAnalyzeLoading(true);
    showError($('ai-command-error'), '');

    try {
      const res = await svc.parseNaturalLanguageEntry(text);
      if (!res.ok) {
        hidePreview();
        showError($('ai-command-error'), res.error || 'فشل التحليل');
        return;
      }
      if (res.parsed) {
        const clf =
          res.classification ||
          (svc.classifyCommandIntent ? svc.classifyCommandIntent(text) : null);
        if (clf?.entryType && commandMode === 'sale') {
          res.parsed.entryType = clf.entryType;
          res.parsed.intent = clf.intent;
        } else if (commandMode === 'inventory') {
          res.parsed.entryType = 'inventory';
          res.parsed.intent = 'inventory_update';
        } else if (commandMode === 'expense') {
          res.parsed.entryType = 'expense';
          res.parsed.intent = 'expense_update';
        } else if (clf) {
          res.parsed.intent = clf.intent || svc.intentFromEntryType?.(res.parsed.entryType);
        }
        res.json = svc.toCommandJson(res.parsed);
        res.message = svc.buildConfirmationMessage?.(res.parsed) || res.message;
      }
      const json = res.json || svc.toCommandJson(res.parsed);
      fillPreview(res.parsed, json, res.message, res.source);
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
    if (text.length < 8) {
      hidePreview();
      showError($('ai-command-error'), '');
      return;
    }
    parseTimer = setTimeout(runAnalyze, 550);
  }

  function buildParsedFromPreview() {
    const svc = getService();
    if (!svc?.parsedFromEditableFields) return null;
    const fields = readPreviewFields();
    const res = svc.parsedFromEditableFields(fields);
    if (!res.ok) return res;
    if (fields.product) res.parsed.productSlug = fields.product;
    res.json = svc.toCommandJson(res.parsed);
    res.message = svc.buildConfirmationMessage(res.parsed);
    return res;
  }

  function updateJsonPreview() {
    const built = buildParsedFromPreview();
    if (built?.ok) {
      currentParsed = built.parsed;
      currentJson = built.json;
      const msgEl = $('preview-confirm-message');
      if (msgEl) msgEl.textContent = built.message;
      updateConfirmTable(built.parsed, built.json);
      if ($('preview-json')) {
        $('preview-json').textContent = JSON.stringify(built.json, null, 2);
      }
    }
  }

  function triggerSuccessMicro(parsed, saved) {
    $('data-entry-main-card')?.classList.add('data-entry-luxury-card--pulse');
    $('data-entry-command-wrap')?.classList.add('data-entry-command-wrap--success');
    $('data-entry-command-bar')?.classList.add('data-entry-command-bar--success-flash');

    const preview = $('smart-preview');
    preview?.classList.add('data-entry-smart-preview--success-pop');

    launchConfetti();

    const toast = $('data-entry-toast');
    if ($('toast-title')) $('toast-title').textContent = 'تم الحفظ بنجاح';
    if ($('toast-detail')) {
      $('toast-detail').textContent =
        (ACTION_LABELS[parsed.entryType] || '') +
        ' · ' +
        (parsed.productName || '') +
        ' · ' +
        formatAud(parsed.amountAud) +
        ' AUD · فرع ' +
        (parsed.branchId || '—');
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

    $('smart-confirm')?.classList.add('data-entry-confirm-btn--success');

    setTimeout(function () {
      $('data-entry-main-card')?.classList.remove('data-entry-luxury-card--pulse');
      $('data-entry-command-wrap')?.classList.remove('data-entry-command-wrap--success');
      $('data-entry-command-bar')?.classList.remove('data-entry-command-bar--success-flash');
      preview?.classList.remove('data-entry-smart-preview--success-pop');
      $('smart-confirm')?.classList.remove('data-entry-confirm-btn--success');
    }, 1400);
  }

  function launchConfetti() {
    const root = $('data-entry-confetti');
    if (!root) return;
    root.innerHTML = '';
    const colors = ['#D4AF37', '#1E293B', '#059669', '#E8C96A'];
    for (let i = 0; i < 24; i++) {
      const p = document.createElement('span');
      p.className = 'data-entry-confetti__particle';
      p.style.setProperty('--x', String((Math.random() - 0.5) * 260) + 'px');
      p.style.setProperty('--y', String(-60 - Math.random() * 200) + 'px');
      p.style.setProperty('--r', String(Math.random() * 720) + 'deg');
      p.style.setProperty('--d', String(0.55 + Math.random() * 0.6) + 's');
      p.style.background = colors[i % colors.length];
      root.appendChild(p);
    }
    root.classList.add('data-entry-confetti--active');
    setTimeout(function () {
      root.classList.remove('data-entry-confetti--active');
      root.innerHTML = '';
    }, 1500);
  }

  async function handleConfirm() {
    const svc = getService();
    const built = buildParsedFromPreview();
    if (!built?.ok) {
      showError($('ai-command-error'), built?.error || 'أكمل المعاينة أولاً');
      return;
    }
    if (!svc?.saveEntry) {
      showError($('ai-command-error'), 'saveEntry غير متاحة');
      return;
    }

    setConfirmLoading(true);
    showError($('ai-command-error'), '');

    try {
      let res;
      const p = built.parsed;
      if (
        (p.entryType === 'inventory' || p.intent === 'inventory_update') &&
        svc.addInventoryItem
      ) {
        res = await svc.addInventoryItem(
          p.productName,
          p.quantity,
          p.branchName,
          p.amount
        );
        if (res?.ok) res = { ok: true, parsed: res.parsed || p, saved: res.saved, stockLevels: res.stockLevels };
      } else {
        res = await svc.saveEntry(p);
      }
      if (!res.ok) {
        showError($('ai-command-error'), res.error || 'فشل الحفظ');
        return;
      }

      triggerSuccessMicro(res.parsed, res.saved);
      $('ai-command-input').value = '';
      hidePreview();
      await refreshBackgroundKpis();
      await refreshInventoryOverview();
      if (global.refreshUI) global.refreshUI();
    } catch (err) {
      showError($('ai-command-error'), err.message || String(err));
    } finally {
      setConfirmLoading(false);
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
    const svc = getService();
    if (!svc?.saveEntry) return;

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
      const manual = svc.saveManualEntry ? await svc.saveManualEntry(fields) : null;
      if (!manual?.ok) {
        showError($('manual-form-error'), manual?.error || 'فشل الحفظ');
        return;
      }
      closeModal();
      triggerSuccessMicro(manual.parsed, manual.saved);
      await refreshBackgroundKpis();
      await refreshInventoryOverview();
      if (global.refreshUI) global.refreshUI();
      e.target.reset();
      if ($('manual-qty')) $('manual-qty').value = '1';
    } catch (err) {
      showError($('manual-form-error'), err.message || String(err));
    }
  }

  function bindEvents() {
    $('ai-command-analyze')?.addEventListener('click', runAnalyze);
    $('ai-command-input')?.addEventListener('input', scheduleAnalyze);
    $('ai-command-input')?.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        runAnalyze();
      }
    });

    $('smart-confirm')?.addEventListener('click', handleConfirm);
    $('smart-cancel-preview')?.addEventListener('click', hidePreview);
    $('smart-reparse')?.addEventListener('click', runAnalyze);

    document.querySelectorAll('.data-entry-mode-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setCommandMode(btn.getAttribute('data-mode') || 'sale');
        hidePreview();
        showError($('ai-command-error'), '');
      });
    });

    document.querySelectorAll('.data-entry-example-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        const ex = chip.getAttribute('data-example') || '';
        const mode = chip.getAttribute('data-mode');
        if (mode) setCommandMode(mode);
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
    $('preview-edit-product')?.addEventListener('input', function () {
      const svc = getService();
      const name = $('preview-edit-product')?.value || '';
      if (svc?.slugifyProduct && $('preview-edit-slug')) {
        $('preview-edit-slug').value = svc.slugifyProduct(name);
      }
      updateJsonPreview();
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
    setCommandMode('sale');
    refreshBackgroundKpis();
    refreshInventoryOverview();
    $('ai-command-input')?.focus();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  global.DataEntryPage = {
    refreshBackgroundKpis,
    refreshInventoryOverview,
    runAnalyze,
    handleConfirm,
    setCommandMode,
  };
})(typeof window !== 'undefined' ? window : global);
