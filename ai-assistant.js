/**
 * Prestige Abaya — AI Executive Assistant (floating chat)
 * Future: Supabase Edge Function `ai-executive-assistant`
 */
(function (global) {
  'use strict';

  const EDGE_FUNCTION_NAME = 'ai-executive-assistant';
  const WELCOME =
    'أهلاً بك يا مدير، كيف يمكنني مساعدتك في تحليل بيانات الشركة اليوم؟';

  let isOpen = false;
  let isSending = false;
  const messages = [];

  function $(id) {
    return document.getElementById(id);
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getConfig() {
    return global.SUPABASE_CONFIG || {};
  }

  function getClient() {
    const core = global.prestigeCore || global.PrestigeCore;
    if (core?.getClient) return core.getClient();
    if (global.DbHelper?.getClient) return global.DbHelper.getClient();
    return null;
  }

  async function ensureAdmin() {
    if (global.AuthGuard?.checkAccess) {
      const res = await global.AuthGuard.checkAccess('admin');
      if (res?.bypassed) return true;
      return res?.ok === true && res?.role === 'admin';
    }
    return true;
  }

  function setWidgetVisible(visible) {
    const root = $('ai-assistant-root');
    if (!root) return;
    if (visible) {
      root.removeAttribute('hidden');
      root.classList.add('ai-assistant--ready');
    } else {
      root.setAttribute('hidden', '');
      root.classList.remove('ai-assistant--ready');
    }
  }

  function renderMessages() {
    const list = $('ai-assistant-messages');
    if (!list) return;

    list.innerHTML = messages
      .map((m) => {
        const roleClass = m.role === 'user' ? 'ai-assistant-msg--user' : 'ai-assistant-msg--assistant';
        const time = m.time
          ? new Intl.DateTimeFormat('ar-AE', { hour: '2-digit', minute: '2-digit' }).format(m.time)
          : '';
        return `
          <div class="ai-assistant-msg ${roleClass}">
            <div class="ai-assistant-msg__bubble">
              <p class="ai-assistant-msg__text">${escapeHtml(m.text)}</p>
              ${time ? `<time class="ai-assistant-msg__time">${time}</time>` : ''}
            </div>
          </div>`;
      })
      .join('');

    list.scrollTop = list.scrollHeight;
  }

  function pushMessage(role, text) {
    messages.push({ role, text, time: new Date() });
    renderMessages();
  }

  function setTyping(show) {
    const el = $('ai-assistant-typing');
    if (el) el.hidden = !show;
    if (show) {
      const list = $('ai-assistant-messages');
      if (list) list.scrollTop = list.scrollHeight;
    }
  }

  /**
   * Placeholder until Edge Function is deployed.
   * @param {{ message: string, history?: object[] }} payload
   */
  async function invokeExecutiveAssistant(payload) {
    const cfg = getConfig();
    const client = getClient();

    if (!cfg.url || !client?.functions?.invoke) {
      return {
        ok: true,
        mock: true,
        reply:
          'وضع العرض التجريبي: سيتم ربط المساعد بـ Supabase Edge Function قريباً. يمكنك السؤال عن المبيعات، المخزون، أو أداء الفروع.',
      };
    }

    try {
      const { data, error } = await client.functions.invoke(EDGE_FUNCTION_NAME, {
        body: {
          message: payload.message,
          history: payload.history || [],
          tenant_id: global.DbHelper?.resolveTenantId?.() || cfg.defaultTenantId || null,
        },
      });

      if (error) {
        return { ok: false, error: error.message || String(error) };
      }

      const reply =
        data?.reply ||
        data?.message ||
        data?.content ||
        (typeof data === 'string' ? data : null);

      if (!reply) {
        return { ok: false, error: 'استجابة فارغة من Edge Function' };
      }

      return { ok: true, reply: String(reply) };
    } catch (err) {
      console.warn('[AIAssistant] edge invoke', err);
      return {
        ok: true,
        mock: true,
        reply:
          'تعذّر الاتصال بالخادم الذكي حالياً. جرّب لاحقاً بعد تفعيل Edge Function.',
      };
    }
  }

  async function sendUserMessage(text) {
    const trimmed = String(text || '').trim();
    if (!trimmed || isSending) return;

    pushMessage('user', trimmed);
    isSending = true;
    setTyping(true);

    const input = $('ai-assistant-input');
    const sendBtn = $('ai-assistant-send');
    if (input) input.disabled = true;
    if (sendBtn) sendBtn.disabled = true;

    const history = messages.map((m) => ({ role: m.role, content: m.text }));
    const res = await invokeExecutiveAssistant({ message: trimmed, history });

    setTyping(false);
    isSending = false;
    if (input) {
      input.disabled = false;
      input.focus();
    }
    if (sendBtn) sendBtn.disabled = false;

    if (res.ok) {
      pushMessage('assistant', res.reply);
    } else {
      pushMessage('assistant', res.error || 'حدث خطأ. حاول مرة أخرى.');
    }
  }

  function openPanel() {
    const panel = $('ai-assistant-panel');
    const toggle = $('ai-assistant-fab');
    if (!panel) return;
    isOpen = true;
    panel.removeAttribute('hidden');
    panel.classList.add('ai-assistant-panel--open');
    if (toggle) {
      toggle.setAttribute('aria-expanded', 'true');
      toggle.classList.add('ai-assistant-fab--active');
    }
    $('ai-assistant-input')?.focus();
  }

  function closePanel() {
    const panel = $('ai-assistant-panel');
    const toggle = $('ai-assistant-fab');
    if (!panel) return;
    isOpen = false;
    panel.setAttribute('hidden', '');
    panel.classList.remove('ai-assistant-panel--open');
    if (toggle) {
      toggle.setAttribute('aria-expanded', 'false');
      toggle.classList.remove('ai-assistant-fab--active');
    }
  }

  function togglePanel() {
    if (isOpen) closePanel();
    else openPanel();
  }

  function bindUi() {
    $('ai-assistant-fab')?.addEventListener('click', togglePanel);
    $('ai-assistant-close')?.addEventListener('click', closePanel);

    const form = $('ai-assistant-form');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = $('ai-assistant-input');
      const val = input?.value || '';
      if (input) input.value = '';
      sendUserMessage(val);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) closePanel();
    });
  }

  async function boot() {
    const allowed = await ensureAdmin();
    if (!allowed) {
      setWidgetVisible(false);
      return;
    }

    setWidgetVisible(true);
    bindUi();

    if (!messages.length) {
      pushMessage('assistant', WELCOME);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => boot().catch(console.warn));
  } else {
    boot().catch(console.warn);
  }

  global.AIExecutiveAssistant = {
    open: openPanel,
    close: closePanel,
    send: sendUserMessage,
    invokeExecutiveAssistant,
    WELCOME,
  };
})(typeof window !== 'undefined' ? window : global);
