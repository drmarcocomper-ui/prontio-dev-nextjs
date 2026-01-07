// frontend/assets/js/pages/page-alterar-senha.js
(function (global, document) {
  const PRONTIO = (global.PRONTIO = global.PRONTIO || {});
  PRONTIO.pages = PRONTIO.pages || {};
  PRONTIO.pages["alterar-senha"] = PRONTIO.pages["alterar-senha"] || {};

  function qs(id) {
    return document.getElementById(id);
  }

  function showMessage(msg, type) {
    const el = qs("mensagemSenha");
    if (!el) return;
    el.textContent = msg || "";
    el.classList.remove("is-hidden");
    el.className = "mensagem mensagem-" + (type || "info");
  }

  async function handleSubmit(ev) {
    ev.preventDefault();

    const senhaAtual = (qs("senhaAtual") && qs("senhaAtual").value) ? qs("senhaAtual").value : "";
    const novaSenha = (qs("novaSenha") && qs("novaSenha").value) ? qs("novaSenha").value : "";
    const novaSenha2 = (qs("novaSenha2") && qs("novaSenha2").value) ? qs("novaSenha2").value : "";

    if (!senhaAtual || !novaSenha) {
      showMessage("Informe a senha atual e a nova senha.", "erro");
      return;
    }
    if (novaSenha !== novaSenha2) {
      showMessage("As novas senhas não coincidem.", "erro");
      return;
    }

    const callApiData =
      (PRONTIO.api && typeof PRONTIO.api.callApiData === "function")
        ? PRONTIO.api.callApiData
        : (typeof global.callApiData === "function")
        ? global.callApiData
        : null;

    if (!callApiData) {
      showMessage("API não disponível.", "erro");
      return;
    }

    try {
      await callApiData({
        action: "Usuarios_AlterarMinhaSenha",
        payload: { senhaAtual, novaSenha }
      });

      showMessage("Senha alterada com sucesso.", "sucesso");

      // opcional: logout após troca de senha
      global.setTimeout(() => {
        try {
          if (PRONTIO.auth && typeof PRONTIO.auth.logout === "function") {
            PRONTIO.auth.logout({ redirect: true });
          } else if (PRONTIO.auth && typeof PRONTIO.auth.forceLogoutLocal === "function") {
            PRONTIO.auth.forceLogoutLocal("AUTH_REQUIRED", { redirect: true, clearChat: true });
          } else {
            global.location.href = "/login.html";
          }
        } catch (_) {}
      }, 1500);

    } catch (err) {
      const msg = (err && err.message) ? err.message : "Erro ao alterar senha.";
      showMessage(msg, "erro");
    }
  }

  function init() {
    // idempotente
    if (PRONTIO.pages["alterar-senha"]._inited === true) return;
    PRONTIO.pages["alterar-senha"]._inited = true;

    const form = qs("formAlterarSenha");
    if (!form) return;

    if (form.dataset.boundSubmit === "1") return;
    form.dataset.boundSubmit = "1";

    form.addEventListener("submit", handleSubmit);
  }

  // ✅ padrão: main.js chama page.init()
  PRONTIO.pages["alterar-senha"].init = init;

  // ✅ fallback: se main.js não rodar
  if (!PRONTIO._mainBootstrapped) {
    document.addEventListener("DOMContentLoaded", init);
  }

})(window, document);
