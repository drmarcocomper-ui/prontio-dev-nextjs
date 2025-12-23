// =====================================
// PRONTIO - pages/page-forgot-password.js
// Pilar H - Esqueci minha senha (UX/Segurança final)
//
// Melhorias:
// - Loading (Enviando...)
// - Cooldown de reenvio (anti-spam UX)
// - Resposta sempre genérica (não vaza existência)
// =====================================

(function (global, document) {
  const PRONTIO = (global.PRONTIO = global.PRONTIO || {});
  const api = PRONTIO.api || {};

  const UX = {
    COOLDOWN_SECONDS: 90,
    STORAGE_KEY: "prontio.forgotPassword.cooldownUntil"
  };

  function qs(id) {
    return document.getElementById(id);
  }

  function nowMs_() {
    return Date.now();
  }

  function getCooldownUntil_() {
    try {
      const raw = global.localStorage ? global.localStorage.getItem(UX.STORAGE_KEY) : null;
      const v = raw ? parseInt(raw, 10) : 0;
      return Number.isFinite(v) ? v : 0;
    } catch (_) {
      return 0;
    }
  }

  function setCooldownUntil_(ms) {
    try {
      if (!global.localStorage) return;
      global.localStorage.setItem(UX.STORAGE_KEY, String(ms || 0));
    } catch (_) {}
  }

  function clearMsg_() {
    const el = qs("mensagemForgot");
    if (!el) return;
    el.textContent = "";
    el.classList.add("is-hidden");
    el.classList.remove("mensagem-sucesso", "mensagem-erro", "mensagem-aviso", "mensagem-info");
  }

  function showMsg_(msg, type) {
    const el = qs("mensagemForgot");
    if (!el) return;

    el.textContent = msg || "";
    el.classList.remove("is-hidden");
    el.classList.remove("mensagem-sucesso", "mensagem-erro", "mensagem-aviso", "mensagem-info");

    if (type === "success") el.classList.add("mensagem-sucesso");
    else if (type === "error") el.classList.add("mensagem-erro");
    else if (type === "warning") el.classList.add("mensagem-aviso");
    else el.classList.add("mensagem-info");
  }

  function assertApi_() {
    if (!api || typeof api.callApiData !== "function") {
      throw new Error("API não disponível.");
    }
  }

  function setBusy_(busy, label) {
    const btn = qs("btnSend");
    const inp = qs("forgotIdentifier");
    if (btn) {
      btn.disabled = !!busy;
      btn.setAttribute("aria-busy", busy ? "true" : "false");
      if (label) btn.textContent = label;
      else btn.textContent = busy ? "Enviando..." : "Enviar link de redefinição";
    }
    if (inp) inp.disabled = !!busy;
  }

  function formatCountdown_(msLeft) {
    const s = Math.max(0, Math.ceil(msLeft / 1000));
    const mm = String(Math.floor(s / 60)).padStart(1, "0");
    const ss = String(s % 60).padStart(2, "0");
    return mm + ":" + ss;
  }

  let cooldownTimer = null;

  function startCooldownUI_() {
    const btn = qs("btnSend");
    if (!btn) return;

    const until = getCooldownUntil_();
    const tick = () => {
      const left = until - nowMs_();
      if (left <= 0) {
        if (cooldownTimer) {
          clearInterval(cooldownTimer);
          cooldownTimer = null;
        }
        btn.disabled = false;
        btn.setAttribute("aria-busy", "false");
        btn.textContent = "Enviar link de redefinição";
        return;
      }
      btn.disabled = true;
      btn.textContent = "Aguarde " + formatCountdown_(left) + " para reenviar";
    };

    // já começa
    tick();

    if (cooldownTimer) clearInterval(cooldownTimer);
    cooldownTimer = setInterval(tick, 500);
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    clearMsg_();

    const identifier = String(qs("forgotIdentifier")?.value || "").trim().toLowerCase();
    if (!identifier) {
      showMsg_("Informe seu login ou e-mail.", "error");
      return;
    }

    // se ainda estiver em cooldown, só informa
    const until = getCooldownUntil_();
    if (until && until > nowMs_()) {
      showMsg_("Aguarde um pouco antes de reenviar. " + "Tente novamente em " + formatCountdown_(until - nowMs_()) + ".", "warning");
      startCooldownUI_();
      return;
    }

    setBusy_(true, "Enviando...");

    try {
      assertApi_();

      await api.callApiData({
        action: "Auth_ForgotPassword_Request",
        payload: { identifier }
      });

      // resposta sempre genérica (Pilar H)
      showMsg_("Se existir uma conta válida, você receberá um e-mail com instruções em alguns minutos.", "success");

      // inicia cooldown (UX anti-spam)
      const newUntil = nowMs_() + UX.COOLDOWN_SECONDS * 1000;
      setCooldownUntil_(newUntil);
      startCooldownUI_();

    } catch (e) {
      // Mesmo no erro, mantém mensagem genérica (não vaza)
      showMsg_("Se existir uma conta válida, você receberá um e-mail com instruções em alguns minutos.", "success");

      const newUntil = nowMs_() + UX.COOLDOWN_SECONDS * 1000;
      setCooldownUntil_(newUntil);
      startCooldownUI_();
    } finally {
      // não libera imediatamente por causa do cooldown
      setBusy_(false, null);
      startCooldownUI_();
    }
  }

  function init() {
    const form = qs("formForgotPassword");
    if (!form) return;

    // se voltar para a página e estava em cooldown, aplica UI
    startCooldownUI_();

    form.addEventListener("submit", handleSubmit);
  }

  // compat: tanto standalone quanto lazy-load
  document.addEventListener("DOMContentLoaded", init);
  if (PRONTIO.registerPage) {
    PRONTIO.registerPage("forgot-password", init);
  }
})(window, document);
