// =====================================
// PRONTIO - pages/page-reset-password.js
// Pilar H: Redefinir senha via token (UX/Segurança final)
//
// Melhorias:
// - Loading "Validando link..."
// - Desabilita formulário se token ausente/inválido
// - Mantém mensagens genéricas (não vaza detalhes)
//
// ✅ Padronizado (main.js):
// - PRONTIO.pages["reset-password"].init = init
// - Fallback DOMContentLoaded só se main.js não rodar
// =====================================

(function (global, document) {
  const PRONTIO = (global.PRONTIO = global.PRONTIO || {});
  PRONTIO.pages = PRONTIO.pages || {};
  PRONTIO.pages["reset-password"] = PRONTIO.pages["reset-password"] || {};

  const $ = (id) => document.getElementById(id);

  const callApiData =
    (PRONTIO.api && typeof PRONTIO.api.callApiData === "function")
      ? PRONTIO.api.callApiData
      : (typeof global.callApiData === "function")
      ? global.callApiData
      : null;

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
    if (!callApiData) {
      const err = new Error("API não disponível.");
      err.code = "CLIENT_NO_API";
      throw err;
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

    if (btn.dataset.boundToggle === "1") return;
    btn.dataset.boundToggle = "1";

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
      try { inp.focus(); } catch (_) {}
    });
  }

  function setFormEnabled_(enabled) {
    const form = $("formReset");
    const btn = $("btnReset");
    const s1 = $("rpSenha1");
    const s2 = $("rpSenha2");
    const t1 = $("toggleSenha1");
    const t2 = $("toggleSenha2");

    const on = !!enabled;
    if (form) form.setAttribute("aria-disabled", on ? "false" : "true");
    if (btn) btn.disabled = !on;
    if (s1) s1.disabled = !on;
    if (s2) s2.disabled = !on;
    if (t1) t1.disabled = !on;
    if (t2) t2.disabled = !on;
  }

  async function validateToken_(token) {
    // valida antecipadamente para UX (sem vazar detalhes)
    try {
      assertApi();
      const res = await callApiData({
        action: "Auth_ForgotPassword_ValidateToken",
        payload: { token }
      });
      return !!(res && res.valid === true);
    } catch (_) {
      // se falhar, deixa o Reset validar (não bloqueia)
      return true;
    }
  }

  async function onSubmit(ev) {
    ev.preventDefault();
    showMsg("", "info");

    const token = getTokenFromUrl();
    if (!token) {
      showMsg("Token ausente. Abra o link do e-mail novamente.", "error");
      setFormEnabled_(false);
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
      btn.textContent = "Salvando...";
    }

    try {
      assertApi();

      await callApiData({
        action: "Auth_ForgotPassword_Reset",
        payload: { token, novaSenha: s1 }
      });

      showMsg("Senha redefinida com sucesso. Faça login novamente.", "success");
      setFormEnabled_(false);

      global.setTimeout(() => {
        try { global.location.href = "./index.html"; } catch (_) {}
      }, 2000);

    } catch (e) {
      showMsg(e?.message || "Falha ao redefinir senha. O link pode estar inválido ou expirado.", "error");
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.setAttribute("aria-busy", "false");
        btn.textContent = "Salvar nova senha";
      }
    }
  }

  async function init() {
    // idempotente
    if (PRONTIO.pages["reset-password"]._inited === true) return;
    PRONTIO.pages["reset-password"]._inited = true;

    togglePassword("toggleSenha1", "rpSenha1");
    togglePassword("toggleSenha2", "rpSenha2");

    const form = $("formReset");
    if (form) {
      if (form.dataset.boundSubmit !== "1") {
        form.dataset.boundSubmit = "1";
        form.addEventListener("submit", onSubmit);
      }
    }

    const token = getTokenFromUrl();
    if (!token) {
      showMsg("Token ausente. Abra o link do e-mail novamente.", "error");
      setFormEnabled_(false);
      return;
    }

    // UX: valida token no carregamento
    showMsg("Validando link...", "info");
    setFormEnabled_(false);

    const ok = await validateToken_(token);
    if (!ok) {
      showMsg("Este link é inválido ou expirou. Solicite um novo.", "error");
      setFormEnabled_(false);
      return;
    }

    showMsg("", "info");
    setFormEnabled_(true);
  }

  // ✅ padrão profissional: main.js chama page.init()
  PRONTIO.pages["reset-password"].init = init;

  // ✅ fallback: se por algum motivo main.js não rodar, inicializa sozinho
  if (!PRONTIO._mainBootstrapped) {
    document.addEventListener("DOMContentLoaded", () => { init(); });
  }

})(window, document);
