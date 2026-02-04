// frontend/assets/js/pages/page-usuarios.js
// =====================================
// PRONTIO - pages/page-usuarios.js
// Pilar F: Gestão de Usuários (Admin)
// Compatível com usuarios.html atual
//
// Ações usadas (Registry):
// - Usuarios_Listar
// - Usuarios_Criar
// - Usuarios_Atualizar
// - Usuarios_ResetSenhaAdmin
//
// ✅ Padronizado (main.js):
// - PRONTIO.pages.usuarios.init = initUsuariosPage
// - Fallback DOMContentLoaded só se main.js não rodar
// =====================================

(function (global, document) {
  "use strict";

  const PRONTIO = (global.PRONTIO = global.PRONTIO || {});
  PRONTIO.pages = PRONTIO.pages || {};
  PRONTIO.pages.usuarios = PRONTIO.pages.usuarios || {};

  const api = PRONTIO.api || {};

  // ---------- helpers ----------
  const $ = (id) => document.getElementById(id);

  function showMsg_(id, msg, type) {
    const el = $(id);
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

  function escHtml_(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getCallApiData_() {
    if (api && typeof api.callApiData === "function") return api.callApiData;
    if (typeof global.callApiData === "function") return global.callApiData;
    throw new Error("PRONTIO.api.callApiData não está disponível.");
  }

  function isHidden_(el) {
    if (!el) return true;
    if (el.hidden === true) return true;
    if (el.getAttribute("aria-hidden") === "true") return true;
    if (el.classList.contains("is-hidden")) return true; // legado
    return false;
  }

  function openModalById_(id) {
    const el = $(id);
    if (!el) return;

    el.hidden = false;
    el.classList.add("is-open");
    el.classList.remove("is-hidden");
    el.setAttribute("aria-hidden", "false");

    try {
      const focusable = el.querySelector("input,select,textarea,button");
      if (focusable) focusable.focus();
    } catch (_) {}
  }

  function closeModalById_(id) {
    const el = $(id);
    if (!el) return;

    el.classList.remove("is-open");
    el.classList.add("is-hidden"); // compat visual antiga
    el.hidden = true;
    el.setAttribute("aria-hidden", "true");
  }

  function bindModalClosersCompat_() {
    // main.js já faz bindTriggers, mas mantemos este compat como best-effort
    document.querySelectorAll("[data-modal-close]").forEach((el) => {
      if (el.dataset._boundCloseUsuarios === "1") return;
      el.dataset._boundCloseUsuarios = "1";
      el.addEventListener("click", () => {
        const target = el.getAttribute("data-modal-close");
        if (target) closeModalById_(target);
      });
    });
  }

  function setButtonBusy_(btnId, busy) {
    const btn = $(btnId);
    if (!btn) return;
    btn.disabled = !!busy;
    btn.setAttribute("aria-busy", busy ? "true" : "false");
  }

  function setTableLoading_(text) {
    const tbody = $("usuariosTbody");
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="6" class="text-muted">${escHtml_(text || "Carregando...")}</td></tr>`;
  }

  function setTableEmpty_(text) {
    const tbody = $("usuariosTbody");
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="6" class="text-muted">${escHtml_(text || "Nenhum usuário encontrado.")}</td></tr>`;
  }

  function isAuthOrPermissionError_(err) {
    const code = String(err && err.code ? err.code : "").toUpperCase();
    if (!code) return false;
    return (
      code === "AUTH_REQUIRED" ||
      code === "AUTH_EXPIRED" ||
      code === "AUTH_TOKEN_EXPIRED" ||
      code === "AUTH_NO_TOKEN" ||
      code === "PERMISSION_DENIED"
    );
  }

  function looksLikeEmail_(email) {
    email = String(email || "").trim();
    if (!email) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  }

  async function ensureAuthenticated_() {
    // ✅ Guard oficial do core
    try {
      if (PRONTIO.core && PRONTIO.core.session && typeof PRONTIO.core.session.ensureAuthenticated === "function") {
        const ok = await PRONTIO.core.session.ensureAuthenticated({ redirect: true });
        return !!ok;
      }
    } catch (_) {}

    // fallback compat
    try {
      if (PRONTIO.auth && typeof PRONTIO.auth.requireAuth === "function") {
        const ok = PRONTIO.auth.requireAuth({ redirect: true });
        return !!ok;
      }
    } catch (_) {}

    return true;
  }

  // ---------- state ----------
  let USERS = [];
  let FILTER_TEXT = "";
  let FILTER_ATIVO = "todos"; // todos | ativos | inativos
  let IN_FLIGHT = false;

  function setInFlight_(v) {
    IN_FLIGHT = !!v;
    setButtonBusy_("btnRecarregar", IN_FLIGHT);
  }

  // ---------- API wrappers ----------
  async function apiList_() {
    const callApiData = getCallApiData_();
    return await callApiData({ action: "Usuarios_Listar", payload: {} });
  }

  async function apiCreate_(payload) {
    const callApiData = getCallApiData_();
    return await callApiData({ action: "Usuarios_Criar", payload });
  }

  async function apiUpdate_(payload) {
    const callApiData = getCallApiData_();
    return await callApiData({ action: "Usuarios_Atualizar", payload });
  }

  async function apiResetSenha_(payload) {
    const callApiData = getCallApiData_();
    return await callApiData({ action: "Usuarios_ResetSenhaAdmin", payload });
  }

  // ---------- filtering ----------
  function matches_(u) {
    if (!u) return false;

    if (FILTER_ATIVO === "ativos" && !u.ativo) return false;
    if (FILTER_ATIVO === "inativos" && u.ativo) return false;

    const t = (FILTER_TEXT || "").trim().toLowerCase();
    if (!t) return true;

    const hay = [
      u.id, u.nome, u.nomeCompleto, u.login, u.email, u.perfil,
      u.ativo ? "ativo" : "inativo"
    ].map(v => String(v || "").toLowerCase()).join(" ");

    return hay.includes(t);
  }

  function getFiltered_() {
    return (USERS || []).filter(matches_);
  }

  // ---------- render ----------
  function render_() {
    const tbody = $("usuariosTbody");
    const countEl = $("usuariosCount");
    if (!tbody) return;

    const rows = getFiltered_();
    tbody.innerHTML = "";

    if (!rows.length) {
      setTableEmpty_("Nenhum usuário encontrado.");
      if (countEl) countEl.textContent = "0 usuário(s)";
      return;
    }

    rows.forEach((u) => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>
          <div class="cell-title">${escHtml_(u.nome || u.nomeCompleto || "")}</div>
          <div class="cell-sub text-muted text-small">${escHtml_(u.id || "")}</div>
        </td>
        <td>${escHtml_(u.login || "")}</td>
        <td>${escHtml_(u.email || "")}</td>
        <td><span class="badge">${escHtml_(u.perfil || "")}</span></td>
        <td>
          <span class="status ${u.ativo ? "status-ok" : "status-bad"}">
            ${u.ativo ? "Ativo" : "Inativo"}
          </span>
        </td>
        <td class="col-actions">
          <button class="btn btn-secondary btn-sm" type="button" data-act="edit">Editar</button>
          <button class="btn btn-secondary btn-sm" type="button" data-act="reset">Reset senha</button>
          <button class="btn btn-secondary btn-sm" type="button" data-act="toggle">${u.ativo ? "Desativar" : "Ativar"}</button>
        </td>
      `;

      const btnEdit = tr.querySelector('[data-act="edit"]');
      const btnReset = tr.querySelector('[data-act="reset"]');
      const btnToggle = tr.querySelector('[data-act="toggle"]');

      if (btnEdit) btnEdit.addEventListener("click", () => openEdit_(u));
      if (btnReset) btnReset.addEventListener("click", () => openReset_(u));
      if (btnToggle) btnToggle.addEventListener("click", () => toggleAtivo_(u));

      tbody.appendChild(tr);
    });

    if (countEl) countEl.textContent = `${rows.length} usuário(s)`;
  }

  // ---------- load ----------
  async function refresh_() {
    if (IN_FLIGHT) return;
    setInFlight_(true);

    showMsg_("usuariosMsg", "", "info");

    const okAuth = await ensureAuthenticated_();
    if (!okAuth) {
      setInFlight_(false);
      return;
    }

    setTableLoading_("Carregando...");

    try {
      const list = await apiList_();
      USERS = Array.isArray(list) ? list : [];
      render_();
      showMsg_("usuariosMsg", "", "info");
    } catch (e) {
      USERS = [];
      const countEl = $("usuariosCount");
      if (countEl) countEl.textContent = "";

      if (isAuthOrPermissionError_(e)) {
        setTableEmpty_("Apenas administradores podem gerenciar usuários.");
        showMsg_("usuariosMsg", e.message || "Sem permissão para listar usuários.", "warning");
        return;
      }

      setTableEmpty_("Erro ao carregar usuários.");
      showMsg_("usuariosMsg", e && e.message ? e.message : "Falha ao carregar usuários.", "error");
    } finally {
      setInFlight_(false);
    }
  }

  // ---------- modal: create/edit ----------
  function setSenhaMode_(isCreate) {
    const senhaEl = $("usuarioSenha");
    if (!senhaEl) return;

    if (isCreate) {
      senhaEl.disabled = false;
      senhaEl.placeholder = "Defina a senha inicial";
      senhaEl.setAttribute("autocomplete", "new-password");
    } else {
      senhaEl.value = "";
      senhaEl.disabled = true;
      senhaEl.placeholder = "Senha é definida no reset (admin)";
    }
  }

  function openCreate_() {
    showMsg_("modalUsuarioMsg", "", "info");
    if ($("modalUsuarioTitle")) $("modalUsuarioTitle").textContent = "Novo usuário";

    if ($("usuarioId")) $("usuarioId").value = "";
    if ($("usuarioNome")) $("usuarioNome").value = "";
    if ($("usuarioLogin")) $("usuarioLogin").value = "";
    if ($("usuarioEmail")) $("usuarioEmail").value = "";
    if ($("usuarioPerfil")) $("usuarioPerfil").value = "secretaria";
    if ($("usuarioAtivo")) $("usuarioAtivo").value = "true";
    if ($("usuarioSenha")) $("usuarioSenha").value = "";

    setSenhaMode_(true);
    openModalById_("modalUsuario");
  }

  // ✅ P0: Adicionado try-catch para evitar erros não tratados
  function openEdit_(u) {
    try {
      showMsg_("modalUsuarioMsg", "", "info");
      if ($("modalUsuarioTitle")) $("modalUsuarioTitle").textContent = "Editar usuário";

      if ($("usuarioId")) $("usuarioId").value = u.id || "";
      if ($("usuarioNome")) $("usuarioNome").value = u.nome || u.nomeCompleto || "";
      if ($("usuarioLogin")) $("usuarioLogin").value = u.login || "";
      if ($("usuarioEmail")) $("usuarioEmail").value = u.email || "";
      if ($("usuarioPerfil")) $("usuarioPerfil").value = u.perfil || "secretaria";
      if ($("usuarioAtivo")) $("usuarioAtivo").value = u.ativo ? "true" : "false";
      if ($("usuarioSenha")) $("usuarioSenha").value = "";

      setSenhaMode_(false);
      openModalById_("modalUsuario");
    } catch (err) {
      console.error("[Usuarios] Erro ao abrir modal de edição:", err);
      showMsg_("usuariosMsg", "Erro ao abrir formulário de edição.", "error");
    }
  }

  async function saveUser_() {
    if (IN_FLIGHT) return;
    setInFlight_(true);

    showMsg_("modalUsuarioMsg", "", "info");
    setButtonBusy_("btnSalvarUsuario", true);

    try {
      const id = String(($("usuarioId") && $("usuarioId").value) || "").trim();
      const nome = String(($("usuarioNome") && $("usuarioNome").value) || "").trim();
      const login = String(($("usuarioLogin") && $("usuarioLogin").value) || "").trim();
      const email = String(($("usuarioEmail") && $("usuarioEmail").value) || "").trim();
      const perfil = String(($("usuarioPerfil") && $("usuarioPerfil").value) || "").trim() || "secretaria";
      const ativo = String(($("usuarioAtivo") && $("usuarioAtivo").value) || "true") === "true";
      const senha = String(($("usuarioSenha") && $("usuarioSenha").value) || "");

      if (!nome || !login) {
        showMsg_("modalUsuarioMsg", "Informe nome e login.", "error");
        return;
      }

      if (!looksLikeEmail_(email)) {
        showMsg_("modalUsuarioMsg", "E-mail inválido.", "error");
        return;
      }

      if (!id) {
        if (!senha) {
          showMsg_("modalUsuarioMsg", "Informe a senha inicial para criar o usuário.", "error");
          return;
        }
        await apiCreate_({ nome, login, email, perfil, senha });
        showMsg_("usuariosMsg", "Usuário criado com sucesso.", "success");
      } else {
        await apiUpdate_({ id, nome, login, email, perfil, ativo });
        showMsg_("usuariosMsg", "Usuário atualizado com sucesso.", "success");
      }

      closeModalById_("modalUsuario");
      await refresh_();
    } catch (e) {
      if (isAuthOrPermissionError_(e)) {
        showMsg_("modalUsuarioMsg", e.message || "Sem permissão para esta ação.", "warning");
      } else {
        showMsg_("modalUsuarioMsg", e && e.message ? e.message : "Falha ao salvar usuário.", "error");
      }
    } finally {
      setButtonBusy_("btnSalvarUsuario", false);
      setInFlight_(false);
    }
  }

  // ---------- modal: reset senha ----------
  // ✅ P0: Adicionado try-catch para evitar erros não tratados
  // ✅ P4: Dados do usuário escapados para segurança
  function openReset_(u) {
    try {
      showMsg_("modalResetMsg", "", "info");

      if ($("resetUserId")) $("resetUserId").value = u.id || "";

      // ✅ P4: Escapa dados do usuário antes de exibir
      const displayName = escHtml_(u.nome || u.nomeCompleto || "Usuário");
      const displayId = escHtml_(u.login || u.email || u.id || "");
      if ($("resetUserLabel")) $("resetUserLabel").textContent = `${displayName} (${displayId})`;

      if ($("resetNovaSenha")) $("resetNovaSenha").value = "";
      if ($("resetAtivar")) $("resetAtivar").checked = true;

      openModalById_("modalResetSenha");
    } catch (err) {
      console.error("[Usuarios] Erro ao abrir modal de reset:", err);
      showMsg_("usuariosMsg", "Erro ao abrir formulário de reset de senha.", "error");
    }
  }

  async function confirmReset_() {
    if (IN_FLIGHT) return;
    setInFlight_(true);

    showMsg_("modalResetMsg", "", "info");
    setButtonBusy_("btnConfirmarReset", true);

    try {
      const id = String(($("resetUserId") && $("resetUserId").value) || "").trim();
      const senha = String(($("resetNovaSenha") && $("resetNovaSenha").value) || "");
      const ativar = !!($("resetAtivar") && $("resetAtivar").checked);

      if (!id) return showMsg_("modalResetMsg", "Usuário inválido para reset.", "error");
      if (!senha) return showMsg_("modalResetMsg", "Informe a nova senha.", "error");
      if (String(senha || "").length < 6) return showMsg_("modalResetMsg", "Senha deve ter pelo menos 6 caracteres.", "error");

      await apiResetSenha_({ id, senha, ativar });
      showMsg_("usuariosMsg", "Senha resetada com sucesso.", "success");

      closeModalById_("modalResetSenha");
      await refresh_();
    } catch (e) {
      if (isAuthOrPermissionError_(e)) {
        showMsg_("modalResetMsg", e.message || "Sem permissão para esta ação.", "warning");
      } else {
        showMsg_("modalResetMsg", e && e.message ? e.message : "Falha ao resetar senha.", "error");
      }
    } finally {
      setButtonBusy_("btnConfirmarReset", false);
      setInFlight_(false);
    }
  }

  // ---------- actions ----------
  // ✅ P0: try-catch envolvendo confirm() e operações
  // ✅ P4: Dados do usuário escapados no confirm
  async function toggleAtivo_(u) {
    if (IN_FLIGHT) return;

    showMsg_("usuariosMsg", "", "info");

    const novoAtivo = !u.ativo;

    // ✅ P4: Escapa dados do usuário antes de usar no confirm
    const displayName = escHtml_(u.nome || u.nomeCompleto || u.id || "usuário");

    // ✅ P0: Envolve confirm em try-catch
    let ok = false;
    try {
      ok = global.confirm(`Confirma ${novoAtivo ? "ATIVAR" : "DESATIVAR"} o usuário "${displayName}"?`);
    } catch (err) {
      console.error("[Usuarios] Erro no diálogo de confirmação:", err);
      showMsg_("usuariosMsg", "Erro ao exibir confirmação.", "error");
      return;
    }

    if (!ok) return;

    setInFlight_(true);
    try {
      await apiUpdate_({
        id: u.id,
        nome: u.nome || u.nomeCompleto || "",
        login: u.login,
        email: u.email,
        perfil: u.perfil,
        ativo: novoAtivo
      });

      showMsg_("usuariosMsg", `Usuário ${novoAtivo ? "ativado" : "desativado"} com sucesso.`, "success");
      await refresh_();
    } catch (e) {
      // ✅ P1: Mensagem de erro mais detalhada
      const errorContext = novoAtivo ? "ativar" : "desativar";
      if (isAuthOrPermissionError_(e)) {
        showMsg_("usuariosMsg", e.message || "Sem permissão para esta ação.", "warning");
      } else {
        showMsg_("usuariosMsg", e && e.message ? e.message : `Falha ao ${errorContext} usuário.`, "error");
      }
    } finally {
      setInFlight_(false);
    }
  }

  // ---------- init ----------
  function bind_() {
    bindModalClosersCompat_();

    const btnRecarregar = $("btnRecarregar");
    const btnNovoUsuario = $("btnNovoUsuario");
    const btnSalvarUsuario = $("btnSalvarUsuario");
    const btnConfirmarReset = $("btnConfirmarReset");

    if (btnRecarregar) btnRecarregar.addEventListener("click", refresh_);
    if (btnNovoUsuario) btnNovoUsuario.addEventListener("click", openCreate_);
    if (btnSalvarUsuario) btnSalvarUsuario.addEventListener("click", saveUser_);
    if (btnConfirmarReset) btnConfirmarReset.addEventListener("click", confirmReset_);

    const busca = $("usuariosBusca");
    const filtroAtivo = $("usuariosFiltroAtivo");

    // ✅ P0: Corrige race condition com guard de versão
    if (busca) {
      let t = null;
      let searchVersion = 0; // Guard para evitar renders com estado stale
      busca.addEventListener("input", (ev) => {
        const v = String(ev.target.value || "");
        if (t) clearTimeout(t);
        const myVersion = ++searchVersion;
        t = setTimeout(() => {
          // ✅ P0: Só renderiza se esta é a versão mais recente
          if (myVersion !== searchVersion) return;
          FILTER_TEXT = v;
          render_();
        }, 120);
      });
    }

    if (filtroAtivo) {
      filtroAtivo.addEventListener("change", (ev) => {
        FILTER_ATIVO = String(ev.target.value || "todos");
        render_();
      });
    }

    // Enter salva no modal de usuário
    const modalUsuario = $("modalUsuario");
    if (modalUsuario && modalUsuario.getAttribute("data-usuarios-enter-bound") !== "1") {
      modalUsuario.setAttribute("data-usuarios-enter-bound", "1");
      modalUsuario.addEventListener("keydown", (ev) => {
        if (ev.key !== "Enter") return;
        const tag = String(ev.target && ev.target.tagName ? ev.target.tagName : "").toLowerCase();
        if (tag === "textarea") return;
        if (isHidden_(modalUsuario)) return;
        ev.preventDefault();
        saveUser_();
      });
    }

    // Enter confirma reset
    const modalReset = $("modalResetSenha");
    if (modalReset && modalReset.getAttribute("data-usuarios-enter-bound") !== "1") {
      modalReset.setAttribute("data-usuarios-enter-bound", "1");
      modalReset.addEventListener("keydown", (ev) => {
        if (ev.key !== "Enter") return;
        const tag = String(ev.target && ev.target.tagName ? ev.target.tagName : "").toLowerCase();
        if (tag === "textarea") return;
        if (isHidden_(modalReset)) return;
        ev.preventDefault();
        confirmReset_();
      });
    }
  }

  function initUsuariosPage() {
    // idempotente
    if (PRONTIO.pages.usuarios._inited === true) return;
    PRONTIO.pages.usuarios._inited = true;

    bind_();
    refresh_();
  }

  // ✅ padrão profissional: main.js chama page.init()
  PRONTIO.pages.usuarios.init = initUsuariosPage;

  // ✅ fallback: se main.js não rodar
  if (!PRONTIO._mainBootstrapped) {
    document.addEventListener("DOMContentLoaded", initUsuariosPage);
  }

})(window, document);
