/**
 * Prestige Abaya ERP — Sales dashboard (Supabase + Chart.js)
 */
(function () {
  'use strict';

  const CURRENT_TENANT_KEY = 'current_tenant_id';
  const CHART_DAYS = 7;
  const TABLE_LIMIT = 10;

  let supabase = null;
  let salesChart = null;

  const $ = (id) => document.getElementById(id);

  function getConfig() {
    return typeof window !== 'undefined' ? window.SUPABASE_CONFIG || {} : {};
  }

  function getTenantId() {
    try {
      const stored = localStorage.getItem(CURRENT_TENANT_KEY);
      if (stored && String(stored).trim()) return String(stored).trim();
    } catch (_) { /* ignore */ }
    const cfg = getConfig();
    return cfg.defaultTenantId ? String(cfg.defaultTenantId).trim() : null;
  }

  function initSupabase() {
    const cfg = getConfig();
    if (!cfg.url || !cfg.anonKey) {
      throw new Error('أكمل إعداد supabase.config.js (url و anonKey)');
    }
    if (typeof window.supabase === 'undefined' || !window.supabase.createClient) {
      throw new Error('مكتبة supabase-js غير محمّلة');
    }
    return window.supabase.createClient(cfg.url, cfg.anonKey);
  }

  function saleAmount(row) {
    const v = row.line_total_aud ?? row.lineTotalAud;
    if (v != null && Number.isFinite(Number(v))) return Number(v);
    const price = Number(row.price) || 0;
    const qty = Math.max(1, parseInt(row.quantity, 10) || 1);
    return Math.round(price * qty * 100) / 100;
  }

  function parseDate(row) {
    const raw = row.created_at ?? row.createdAt ?? row.sale_date;
    if (!raw) return null;
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function formatAud(n) {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(n || 0);
  }

  function formatDateTime(d) {
    if (!d) return '—';
    return new Intl.DateTimeFormat('ar-AE', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(d);
  }

  function formatShortDate(d) {
    return new Intl.DateTimeFormat('ar-AE', { weekday: 'short', day: 'numeric', month: 'short' }).format(d);
  }

  function startOfDay(d) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }

  function dayKey(d) {
    return startOfDay(d).toISOString().slice(0, 10);
  }

  function buildLast7DayBuckets() {
    const buckets = [];
    const today = startOfDay(new Date());
    for (let i = CHART_DAYS - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      buckets.push({ date: d, key: dayKey(d), total: 0 });
    }
    return buckets;
  }

  function aggregateByDay(rows) {
    const buckets = buildLast7DayBuckets();
    const map = Object.fromEntries(buckets.map((b) => [b.key, b]));

    rows.forEach((row) => {
      const d = parseDate(row);
      if (!d) return;
      const key = dayKey(d);
      if (!map[key]) return;
      map[key].total += saleAmount(row);
    });

    return buckets.map((b) => ({
      label: formatShortDate(b.date),
      total: Math.round(b.total * 100) / 100,
    }));
  }

  function statusBadge(status) {
    const s = (status || 'completed').toLowerCase();
    const map = {
      completed: 'status-pill--completed',
      returned: 'status-pill--returned',
      pending: 'status-pill--pending',
    };
    const labels = { completed: 'مكتمل', returned: 'مرتجع', pending: 'قيد الانتظار' };
    const cls = map[s] || 'status-pill--default';
    const label = labels[s] || status || '—';
    return `<span class="status-pill ${cls}">${escapeHtml(label)}</span>`;
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function showBanner(type, message, title) {
    const el = $('status-banner');
    const msgEl = $('status-banner-message');
    const titleEl = $('status-banner-title');
    if (!el) return;
    el.classList.remove('hidden', 'alert-banner--error');
    if (type === 'warning') {
      el.classList.remove('alert-banner--error');
      if (titleEl) titleEl.textContent = title || 'تنبيه';
    } else {
      el.classList.add('alert-banner--error');
      if (titleEl) titleEl.textContent = title || 'تعذّر الاتصال بقاعدة البيانات';
    }
    if (msgEl) msgEl.textContent = message;
    el.classList.remove('hidden');
  }

  function hideBanner() {
    const el = $('status-banner');
    if (el) el.classList.add('hidden');
  }

  function setConnectionState(state) {
    const badge = $('connection-badge');
    const text = $('connection-badge-text');
    if (!badge) return;
    badge.classList.remove('conn-badge--online', 'conn-badge--offline');
    badge.classList.add('is-visible');
    if (state === 'online') {
      badge.classList.add('conn-badge--online');
      if (text) text.textContent = 'متصل';
    } else {
      badge.classList.add('conn-badge--offline');
      if (text) text.textContent = 'غير متصل';
    }
  }

  async function fetchSales() {
    let query = supabase
      .from('sales')
      .select('id, created_at, customer_name, customer, product_name, price, quantity, line_total_aud, invoice_number, status, tenant_id')
      .order('id', { ascending: false });

    const tenantId = getTenantId();
    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const { data, error } = await query.limit(500);
    if (error) throw new Error(error.message);
    return data || [];
  }

  function updateKpis(rows) {
    const amounts = rows.map(saleAmount);
    const totalRevenue = amounts.reduce((s, n) => s + n, 0);
    const count = rows.length;
    const avg = count ? totalRevenue / count : 0;

    const weekStart = startOfDay(new Date());
    weekStart.setDate(weekStart.getDate() - (CHART_DAYS - 1));
    const weekRevenue = rows.reduce((sum, row) => {
      const d = parseDate(row);
      if (!d || d < weekStart) return sum;
      return sum + saleAmount(row);
    }, 0);

    $('kpi-revenue').textContent = formatAud(totalRevenue);
    $('kpi-count').textContent = String(count);
    $('kpi-week-revenue').textContent = formatAud(weekRevenue);
    $('kpi-avg').textContent = formatAud(avg);
  }

  function renderChart(rows) {
    const series = aggregateByDay(rows);
    const labels = series.map((s) => s.label);
    const values = series.map((s) => s.total);

    const ctx = $('sales-chart');
    if (!ctx) return;

    if (salesChart) {
      salesChart.destroy();
      salesChart = null;
    }

    const EMERALD_500 = '#10b981';
    const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(16, 185, 129, 0.25)');
    gradient.addColorStop(1, 'rgba(16, 185, 129, 0.02)');

    salesChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'الإيرادات (AUD)',
          data: values,
          borderColor: EMERALD_500,
          backgroundColor: gradient,
          borderWidth: 2.5,
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: EMERALD_500,
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            rtl: true,
            backgroundColor: '#ffffff',
            titleColor: '#0f172a',
            bodyColor: '#475569',
            borderColor: '#e2e8f0',
            borderWidth: 1,
            padding: 12,
            callbacks: {
              label(ctx) {
                return ` ${formatAud(ctx.parsed.y)}`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { color: 'rgba(226, 232, 240, 0.9)' },
            ticks: { color: '#64748b', font: { family: 'Tajawal' } },
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(226, 232, 240, 0.9)' },
            ticks: {
              color: '#64748b',
              font: { family: 'Tajawal' },
              callback: (v) => `$${v}`,
            },
          },
        },
      },
    });

    const legend = $('chart-legend');
    if (legend) {
      const peak = Math.max(...values, 0);
      legend.innerHTML = `أعلى يوم: <strong class="text-emerald-500" style="color:#10b981">${formatAud(peak)}</strong>`;
    }
  }

  function renderTable(rows) {
    const tbody = $('sales-tbody');
    const empty = $('table-empty');
    if (!tbody) return;

    const latest = rows.slice(0, TABLE_LIMIT);

    if (!latest.length) {
      tbody.innerHTML = '';
      if (empty) empty.classList.remove('hidden');
      return;
    }
    if (empty) empty.classList.add('hidden');

    tbody.innerHTML = latest
      .map((row) => {
        const d = parseDate(row);
        const customer = row.customer_name ?? row.customer ?? '—';
        const product = row.product_name ?? '—';
        const qty = parseInt(row.quantity, 10) || 1;
        const total = saleAmount(row);
        return `
          <tr>
            <td class="dash-table__id">${escapeHtml(row.id)}</td>
            <td class="dash-table__muted whitespace-nowrap">${escapeHtml(formatDateTime(d))}</td>
            <td>${escapeHtml(customer)}</td>
            <td class="dash-table__muted max-w-[180px] truncate">${escapeHtml(product)}</td>
            <td class="tabular-nums">${qty}</td>
            <td class="dash-table__amount">${escapeHtml(formatAud(total))}</td>
            <td>${statusBadge(row.status)}</td>
          </tr>
        `;
      })
      .join('');

    const updated = $('table-updated');
    if (updated) {
      updated.textContent = `آخر تحديث: ${formatDateTime(new Date())}`;
    }
  }

  function setLoadingTable() {
    const tbody = $('sales-tbody');
    const empty = $('table-empty');
    if (empty) empty.classList.add('hidden');
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="7" class="dash-empty">جاري تحميل البيانات…</td></tr>`;
    }
  }

  /** Keep UI visible with empty data when Supabase is unreachable */
  function renderFallbackDashboard(errorMessage) {
    const emptyRows = [];
    updateKpis(emptyRows);
    renderChart(emptyRows);

    const empty = $('table-empty');
    if (empty) empty.classList.add('hidden');

    const tbody = $('sales-tbody');
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="dash-empty">
            <p class="text-2xl mb-2" aria-hidden="true">☁️</p>
            <p class="dash-empty__title">لا تتوفر بيانات حالياً</p>
            <p class="text-sm text-slate-600">تحقق من supabase.config.js وسياسات RLS، ثم اضغط «تحديث».</p>
          </td>
        </tr>
      `;
    }

    setConnectionState('offline');
    showBanner(
      'error',
      errorMessage || 'تعذّر جلب البيانات. تعرض اللوحة قيماً افتراضية حتى يعود الاتصال.',
      'تعذّر الاتصال بقاعدة البيانات'
    );
  }

  async function loadDashboard() {
    setLoadingTable();
    const btn = $('refresh-btn');
    if (btn) btn.disabled = true;

    try {
      if (!supabase) supabase = initSupabase();
      const rows = await fetchSales();

      const sorted = [...rows].sort((a, b) => {
        const da = parseDate(a)?.getTime() ?? 0;
        const db = parseDate(b)?.getTime() ?? 0;
        return db - da;
      });

      hideBanner();
      updateKpis(sorted);
      renderChart(sorted);
      renderTable(sorted);
      setConnectionState('online');

      const updated = $('table-updated');
      if (updated) {
        updated.textContent = `آخر تحديث: ${formatDateTime(new Date())}`;
      }
    } catch (err) {
      console.error('[Dashboard]', err);
      renderFallbackDashboard(
        `${err.message || err}. يمكنك متابعة استخدام الصفحة وإعادة المحاولة لاحقاً.`
      );
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  function initSidebar() {
    const sidebar = $('sidebar');
    const overlay = $('sidebar-overlay');
    const toggle = $('sidebar-toggle');

    function open() {
      sidebar?.classList.remove('-translate-x-full', 'rtl:translate-x-full');
      overlay?.classList.remove('hidden');
    }
    function close() {
      sidebar?.classList.add('-translate-x-full', 'rtl:translate-x-full');
      overlay?.classList.add('hidden');
    }

    toggle?.addEventListener('click', open);
    overlay?.addEventListener('click', close);
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 1024) close();
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    $('footer-year').textContent = String(new Date().getFullYear());
    initSidebar();
    $('refresh-btn')?.addEventListener('click', () => loadDashboard());
    $('status-banner-close')?.addEventListener('click', hideBanner);
    loadDashboard();
  });
})();
