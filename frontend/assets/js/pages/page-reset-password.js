// =====================================
// PRONTIO - pages/page-reset-password.js
// Pilar H: Redefinir senha via token
//
// Fluxo:
// - Lê token da URL (?token=...)
// - (Opcional) valida token chamando Auth_ForgotPassword_ValidateToken
// - Envia nova senha para Auth_ForgotPassword_Reset
// =====================================

(function (global, document) {
  const PRONTIO = (global.PRONTIO = global.PRONTIO || {});
  const $ = (id) => document.getElementById(id);

  function showMsg(msg, type) {
    const el = $("msgReset");
    if (!el) return;

    if (!msg) {
      el.textContent = "";
      el.classList.add("is-hidden");
      el.classList.remove("mensagem-sucesso", "mensagem-erro", "mensagem-aviso", "mensagem-info");
      return;
    }

    el.textContent = String(msg);
    el.classList.remove("is-hidden");
    el.classList.remove("mensagem-sucesso", "mensagem-erro", "mensagem-aviso", "mensagem-info");

    if (type === "success") el.classList.add("mensagem-sucesso");
    else if (type === "warning") el.classList.add("mensagem-aviso");
    else if (type === "error") el.classList.add("mensagem-erro");
    else el.classList.add("mensagem-info");
  }

  function assertApi() {
    if (!PRONTIO.api || typeof PRONTIO.api.callApiData !== "function") {
      throw new Error("API não disponível.");
    }
  }

  function getTokenFromUrl() {
    try {
      const u = new URL(global.location.href);
      return String(u.searchParams.get("token") || "").trim();
    } catch (_) {
      return "";
    }
  }

  function togglePassword(btnId, inputId) {
    const btn = $(btnId);
    const inp = $(inputId);
    if (!btn || !inp) return;

    const apply = () => {
      const visible = inp.type === "text";
      btn.setAttribute("aria-pressed", visible ? "true" : "false");
      btn.textContent = visible ? "Ocultar" : "Mostrar";
    };

    apply();

    btn.addEventListener("click", (ev) => {
      ev.preventDefault();
      inp.type = (inp.type === "password") ? "text" : "password";
      apply();
    });
  }

  async function validateTokenIfPossible_(token) {
    // Opcional: valida antecipadamente (melhor UX)
    try {
      assertApi();
      const res = await PRONTIO.api.callApiData({
        action: "Auth_ForgotPassword_ValidateToken",
        payload: { token }
      });
      return !!(res && res.valid === true);
    } catch (_) {
      // Se falhar, não bloqueia (o Reset vai validar de qualquer forma)
      return true;
    }
  }

  async function onSubmit(ev) {
    ev.preventDefault();
    showMsg("", "info");

    const token = getTokenFromUrl();
    if (!token) {
      showMsg("Token ausente. Abra o link do e-mail novamente.", "error");
      return;
    }

    const s1 = String($("rpSenha1")?.value || "");
    const s2 = String($("rpSenha2")?.value || "");

    if (!s1 || !s2) {
      showMsg("Preencha a nova senha e a confirmação.", "error");
      return;
    }
    if (s1 !== s2) {
      showMsg("As senhas não coincidem.", "error");
      return;
    }
    if (s1.length < 6) {
      showMsg("A nova senha deve ter pelo menos 6 caracteres.", "error");
      return;
    }

    const btn = $("btnReset");
    if (btn) {
      btn.disabled = true;
      btn.setAttribute("aria-busy", "true");
    }

    try {
      assertApi();

      const okToken = await validateTokenIfPossible_(token);
      if (!okToken) {
        showMsg("Este link é inválido ou expirou. Solicite um novo.", "error");
        return;
      }

      await PRONTIO.api.callApiData({
        action: "Auth_ForgotPassword_Reset",
        payload: { token, novaSenha: s1 }
      });

      showMsg("Senha redefinida com sucesso. Faça login novamente.", "success");

      // Opcional: redireciona para login após 2s
      global.setTimeout(() => {
        try { global.location.href = "./index.html"; } catch (_) {}
      }, 2000);

    } catch (e) {
      // Mensagem intencionalmente genérica
      showMsg(e?.message || "Falha ao redefinir senha. O link pode estar inválido ou expirado.", "error");
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.setAttribute("aria-busy", "false");
      }
    }
  }

  function init() {
    togglePassword("toggleSenha1", "rpSenha1");
    togglePassword("toggleSenha2", "rpSenha2");

    const token = getTokenFromUrl();
    if (!token) {
      showMsg("Token ausente. Abra o link do e-mail novamente.", "error");
    }

    $("formReset")?.addEventListener("submit", onSubmit);
  }

  document.addEventListener("DOMContentLoaded", init);
})(window, document);
