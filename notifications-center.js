/**
 * Prestige Abaya — Notifications Center (ai_alerts)
 * Requires: db-helper.js or supabase-bridge.js, supabase.config.js
 */
(function (global) {
  'use strict';

  const POLL_MS = 60_000;
  const ALERTS_LIMIT = 40;
  const TOAST_DURATION_MS = 9_000;

  let pollTimer = null;
  const seenToastIds = new Set();

  function getClient() {
    if (global.DbHelper?.getClient) return global.DbHelper.getClient();
    if (global.SupabaseBridge?.getClient) return global.SupabaseBridge.getClient();
    return null;
  }

  function resolveTenantId() {
    if (global.DbHelper?.resolveTenantId) return global.DbHelper.resolveTenantId();
    try {
      const stored = global.localStorage?.getItem('current_tenant_id');
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

  function formatTime(iso) {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' });
    } catch (_) {
      return String(iso);
    }
  }

  function normalizeSeverity(severity) {
    const s = String(severity || 'info').toLowerCase();
    if (s === 'error') return 'critical';
    return s;
  }

  function isUrgent(severity) {
    const s = normalizeSeverity(severity);
    return s === 'warning' || s === 'critical';
  }

  async function fetchAlerts() {
    const core = global.PrestigeCore || global.prestigeCore;
    if (core?.probeTable && (await core.probeTable('ai_alerts')) === false) {
      return { ok: true, data: [], skipped: true, reason: 'ai_alerts table not deployed' };
    }

    const client = getClient();
    if (!client) {
      return { ok: false, data: [], error: 'Supabase غير مهيأ' };
    }

    let query = client
      .from('ai_alerts')
      .select('id, alert_type, severity, message, created_at, table_name, record_id')
      .order('created_at', { ascending: false })
      .limit(ALERTS_LIMIT);

    const tenantId = resolveTenantId();
    if (tenantId) query = query.eq('tenant_id', tenantId);

    const { data, error } = await query;
    if (error) {
      if (core?.isRelationMissingError?.(error)) {
        return { ok: true, data: [], skipped: true, reason: error.message };
      }
      return { ok: false, data: [], error: error.message };
    }
    return { ok: true, data: data || [] };
  }

  function updateBadge(count) {
    const badge = document.getElementById('notifications-count');
    if (!badge) return;
    badge.textContent = String(count);
    badge.hidden = count <= 0;
  }

  function showUrgentToast(alert) {
    if (!isUrgent(alert.severity)) return;
    if (seenToastIds.has(alert.id)) return;

    const stack = document.getElementById('notifications-toast-stack');
    if (!stack) return;

    seenToastIds.add(alert.id);
    if (seenToastIds.size > 100) {
      const oldest = seenToastIds.values().next().value;
      seenToastIds.delete(oldest);
    }

    const severity = normalizeSeverity(alert.severity);
    const toast = document.createElement('div');
    toast.className = `notifications-toast notifications-toast--${severity}`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
      <strong class="notifications-toast__title">${escapeHtml(alert.alert_type || 'تنبيه')}</strong>
      <p class="notifications-toast__message">${escapeHtml(alert.message)}</p>
      <button type="button" class="notifications-toast__close" aria-label="إغلاق">×</button>
    `;

    toast.querySelector('.notifications-toast__close')?.addEventListener('click', () => {
      toast.classList.remove('notifications-toast--show');
      setTimeout(() => toast.remove(), 280);
    });

    stack.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('notifications-toast--show'));

    setTimeout(() => {
      toast.classList.remove('notifications-toast--show');
      setTimeout(() => toast.remove(), 320);
    }, TOAST_DURATION_MS);
  }

  async function renderNotifications() {
    const list = document.getElementById('notifications-list');
    if (!list) {
      return { ok: false, error: 'notifications-list not found' };
    }

    list.innerHTML = '<li class="notifications-list__status">جاري التحميل…</li>';

    const result = await fetchAlerts();
    if (!result.ok) {
      list.innerHTML = `<li class="notifications-list__status notifications-list__status--error">${escapeHtml(result.error || 'فشل التحميل')}</li>`;
      updateBadge(0);
      return result;
    }

    const alerts = result.data;
    updateBadge(alerts.length);

    if (!alerts.length) {
      list.innerHTML = '<li class="notifications-list__status">لا توجد تنبيهات</li>';
      return result;
    }

    list.innerHTML = alerts
      .map((alert) => {
        const severity = normalizeSeverity(alert.severity);
        return `<li class="notifications-list__item notifications-list__item--${severity}" data-alert-id="${escapeHtml(alert.id)}">
          <div class="notifications-list__meta">
            <span class="notifications-list__type">${escapeHtml(alert.alert_type || 'ALERT')}</span>
            <span class="notifications-list__severity">${escapeHtml(severity)}</span>
          </div>
          <p class="notifications-list__message">${escapeHtml(alert.message)}</p>
          <time class="notifications-list__time" datetime="${escapeHtml(alert.created_at || '')}">${escapeHtml(formatTime(alert.created_at))}</time>
        </li>`;
      })
      .join('');

    alerts.filter(isUrgent).forEach(showUrgentToast);

    return result;
  }

  async function startPolling() {
    stopPolling();
    const core = global.PrestigeCore || global.prestigeCore;
    if (core?.probeTable) await core.probeTable('ai_alerts');
    if (core?.isTableAvailable && !core.isTableAvailable('ai_alerts')) {
      const list = document.getElementById('notifications-list');
      if (list) {
        list.innerHTML =
          '<li class="notifications-list__status">جدول ai_alerts غير مفعّل — تم تخطي التنبيهات</li>';
      }
      updateBadge(0);
      return;
    }
    void renderNotifications();
    pollTimer = global.setInterval(() => {
      void renderNotifications();
    }, POLL_MS);
  }

  function stopPolling() {
    if (pollTimer) {
      global.clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  function bindToggle() {
    const toggle = document.getElementById('notifications-center-toggle');
    const panel = document.getElementById('notifications-list-wrap');
    if (!toggle || !panel) return;

    toggle.addEventListener('click', () => {
      const hidden = panel.hasAttribute('hidden');
      if (hidden) {
        panel.removeAttribute('hidden');
        toggle.setAttribute('aria-expanded', 'true');
      } else {
        panel.setAttribute('hidden', '');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  const NotificationsCenter = {
    fetchAlerts,
    renderNotifications,
    startPolling,
    stopPolling,
  };

  global.NotificationsCenter = NotificationsCenter;

  function boot() {
    bindToggle();
    startPolling();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(typeof window !== 'undefined' ? window : global);
