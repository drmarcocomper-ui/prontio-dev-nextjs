// =====================================
// PRONTIO - pages/page-login.js
// Página de Login (FRONT-END)
// =====================================
//
// Responsabilidades:
// - Capturar usuário e senha do formulário
// - Chamar Auth_Login via PRONTIO.auth.login (centralizado)
// - Redirecionar (prioridade: destino salvo; fallback: HOME do sistema)
// =====================================

(function (global, document) {
  const PRONTIO = (global.PRONTIO = global.PRONTIO || {});

  // ✅ Defina aqui a "home" pós-login (módulo principal)
  const DEFAULT_HOME = "atendimento.html";

  function qs(id) {
    return document.getElementById(id);
  }

  function setMessageClass_(el, type) {
    if (!el) return;
    el.classList.remove("mensagem-sucesso", "mensagem-erro", "mensagem-aviso", "mensagem-info");
    switch (type) {
      case "success": el.classList.add("mensagem-sucesso"); break;
      case "warning": el.classList.add("mensagem-aviso"); break;
      case "error": el.classList.add("mensagem-erro"); break;
      default: el.classList.add("mensagem-info"); break;
    }
  }

  function showMessage(msg, type) {
    const el = qs("mensagemLogin");
    if (!el) return;
    el.textContent = msg || "";
    el.classList.remove("is-hidden");
    setMessageClass_(el, type || "info");
  }

  function hideMessage() {
    const el = qs("mensagemLogin");
    if (!el) return;
    el.textContent = "";
    el.classList.add("is-hidden");
    setMessageClass_(el, "info");
  }

  function setYear() {
    const el = qs("login-year");
    if (el) el.textContent = new Date().getFullYear();
  }

  function resolvePostLoginUrl_() {
    try {
      if (PRONTIO.auth && typeof PRONTIO.auth.popPostLoginRedirect === "function") {
        const u = PRONTIO.auth.popPostLoginRedirect();
        if (u) return u;
      }
    } catch (e) {}
    return DEFAULT_HOME;
  }

  function setFormBusy_(busy) {
    const form = qs("formLogin");
    if (!form) return;

    const btn = form.querySelector('button[type="submit"]');
    const inpUser = qs("loginUsuario");
    const inpPass = qs("loginSenha");

    if (btn) {
      btn.disabled = !!busy;
      btn.setAttribute("aria-busy", busy ? "true" : "false");
    }
    if (inpUser) inpUser.disabled = !!busy;
    if (inpPass) inpPass.disabled = !!busy;
  }

  function cleanLoginErrorMessage_(msg) {
    // Opcional: remove prefixo "[CODE]" se vier do api.js
    const s = String(msg || "").trim();
    const m = s.match(/^\[[A-Z0-9_\-]+\]\s+(.*)$/);
    return m ? m[1] : s;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    hideMessage();

    const usuario = (qs("loginUsuario")?.value || "").trim();
    const senha = qs("loginSenha")?.value || "";

    if (!usuario || !senha) {
      showMessage("Informe usuário e senha.", "error");
      return;
    }

    if (!PRONTIO.auth || typeof PRONTIO.auth.login !== "function") {
      showMessage("Módulo de autenticação não disponível.", "error");
      return;
    }

    setFormBusy_(true);

    try {
      await PRONTIO.auth.login({ login: usuario, senha });
      global.location.href = resolvePostLoginUrl_();
    } catch (err) {
      // log técnico opcional (sem poluir UI)
      try { console.warn("[PRONTIO.login] erro:", err); } catch (e) {}

      const msg = err && err.message ? err.message : "Falha no login.";
      showMessage(cleanLoginErrorMessage_(msg), "error");
    } finally {
      setFormBusy_(false);
    }
  }

  function init() {
    setYear();

    // ✅ Se já estiver logado (token), não fica preso no login
    // Melhor: respeita redirect pendente (se existir)
    try {
      if (PRONTIO.auth && typeof PRONTIO.auth.isAuthenticated === "function" && PRONTIO.auth.isAuthenticated()) {
        global.location.href = resolvePostLoginUrl_();
        return;
      }
    } catch (e) {}

    const form = qs("formLogin");
    if (!form) return;

    form.addEventListener("submit", handleSubmit);
  }

  document.addEventListener("DOMContentLoaded", init);
})(window, document);
