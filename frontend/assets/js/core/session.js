// frontend/assets/js/core/session.js
// Controle da sessão do usuário no front-end.
// - guarda usuário logado
// - guarda últimos IDs acessados (ex.: último paciente)
// - controla timeout de inatividade (somente no front)
//
// Observação: regras de negócio de sessão e autenticação REAL
// continuam no backend (Apps Script). Aqui é apenas estado de interface.
//
// ✅ Opção 2 (produto): mantém controle de inatividade, SEM logoff automático.
// - startIdleTimer NÃO chama mais callbacks que executem logout por padrão.
// - Ao estourar o timeout, dispara um evento "prontio:idle-timeout" (hook futuro).
//
// ✅ PASSO 2 (padronização global - front):
// - Adiciona ensureAuthenticated(): bloqueio local + validação server-side via PRONTIO.auth.me()
// - Dispara eventos "prontio:session-changed" quando user muda/limpa.

(function (global) {
  "use strict";

  const PRONTIO = global.PRONTIO = global.PRONTIO || {};
  PRONTIO.core = PRONTIO.core || {};

  const STORAGE_KEY = "prontio.session.v1";

  let memoryState = {
    user: null,
    lastPatientId: null,
    lastAgendaDate: null,
    lastActivityAt: Date.now()
  };

  let idleTimer = null;

  function loadFromStorage() {
    try {
      const raw = global.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      memoryState = Object.assign(memoryState, parsed);
    } catch (err) {
      console.warn("[Session] Erro ao ler localStorage", err);
    }
  }

  function saveToStorage() {
    try {
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryState));
    } catch (err) {
      console.warn("[Session] Erro ao gravar localStorage", err);
    }
  }

  function touchActivity() {
    memoryState.lastActivityAt = Date.now();
    saveToStorage();
  }

  function dispatchIdleTimeoutEvent_(payload) {
    try {
      const detail = payload || {};
      const ev = new CustomEvent("prontio:idle-timeout", { detail });
      global.dispatchEvent(ev);
    } catch (e) {
      try {
        const ev = document.createEvent("Event");
        ev.initEvent("prontio:idle-timeout", true, true);
        ev.detail = payload || {};
        global.dispatchEvent(ev);
      } catch (_) {}
    }
  }

  function dispatchSessionChanged_(payload) {
    try {
      const detail = payload || {};
      const ev = new CustomEvent("prontio:session-changed", { detail });
      global.dispatchEvent(ev);
    } catch (e) {
      try {
        const ev = document.createEvent("Event");
        ev.initEvent("prontio:session-changed", true, true);
        ev.detail = payload || {};
        global.dispatchEvent(ev);
      } catch (_) {}
    }
  }

  function getAuth_() {
    return PRONTIO.auth || null;
  }

  const Session = {
    /**
     * Inicializa sessão (chamar em main.js, assim que possível)
     */
    init() {
      loadFromStorage();
      this._setupActivityListeners();
    },

    /**
     * Define usuário logado
     * @param {Object|null} user
     */
    setUser(user) {
      memoryState.user = user || null;
      touchActivity();
      dispatchSessionChanged_({ type: "setUser", user: memoryState.user });
    },

    /**
     * Retorna usuário logado (objeto ou null)
     */
    getUser() {
      return memoryState.user;
    },

    /**
     * Remove dados de sessão (ex.: logout)
     */
    clear() {
      memoryState = {
        user: null,
        lastPatientId: null,
        lastAgendaDate: null,
        lastActivityAt: Date.now()
      };
      saveToStorage();
      dispatchSessionChanged_({ type: "clear", user: null });
    },

    setLastPatientId(id) {
      memoryState.lastPatientId = id || null;
      touchActivity();
      dispatchSessionChanged_({ type: "setLastPatientId", lastPatientId: memoryState.lastPatientId });
    },

    getLastPatientId() {
      return memoryState.lastPatientId;
    },

    setLastAgendaDate(dateStr) {
      // string no formato YYYY-MM-DD (quem define é o backend)
      memoryState.lastAgendaDate = dateStr || null;
      touchActivity();
      dispatchSessionChanged_({ type: "setLastAgendaDate", lastAgendaDate: memoryState.lastAgendaDate });
    },

    getLastAgendaDate() {
      return memoryState.lastAgendaDate;
    },

    /**
     * ✅ PASSO 2: guard oficial (UI-first) para garantir sessão válida
     * - Bloqueia localmente se não houver token (requireAuth).
     * - Valida no backend via auth.me() (que já trata AUTH_* e pode redirecionar).
     *
     * @param {Object} opts
     * @param {boolean} [opts.redirect=true] - permite redirecionar para /login.html
     * @returns {Promise<boolean>} true se ok, false se redirecionou/negou
     */
    async ensureAuthenticated(opts) {
      opts = opts || {};
      const redirect = opts.redirect !== false;

      const auth = getAuth_();
      if (!auth || typeof auth.requireAuth !== "function") {
        console.warn("[Session] ensureAuthenticated: PRONTIO.auth.requireAuth não disponível.");
        return true; // não bloqueia para não quebrar páginas offline/dev
      }

      // 1) Bloqueio local imediato
      const okLocal = auth.requireAuth({ redirect: redirect });
      if (!okLocal) return false;

      // 2) Validação server-side (canônica)
      if (typeof auth.me === "function") {
        try {
          const res = await auth.me();
          // auth.me já chama session.setUser internamente (via auth.js), mas garantimos se vier user aqui:
          if (res && res.user) this.setUser(res.user);
          return true;
        } catch (e) {
          // auth.me já costuma redirecionar em AUTH_*; se não redirecionou, aplica fallback
          if (redirect && auth.forceLogoutLocal && e && e.code) {
            try { auth.forceLogoutLocal(String(e.code), { redirect: true, clearChat: true }); } catch (_) {}
            return false;
          }
          return false;
        }
      }

      return true;
    },

    /**
     * Inicia controle de inatividade no front.
     *
     * ✅ IMPORTANTE (Opção 2):
     * - NÃO faz logoff automático.
     * - Ao estourar, apenas:
     *    1) dispara evento global "prontio:idle-timeout"
     *    2) (opcional) chama onTimeout APENAS se explicitamente permitido
     *
     * @param {Object} options
     * @param {number} options.timeoutMs - tempo em ms (ex.: 30 * 60 * 1000)
     * @param {Function} [options.onTimeout] - callback (não recomendado para logout)
     * @param {boolean} [options.allowOnTimeout=false] - se true, permite chamar onTimeout
     */
    startIdleTimer(options) {
      const timeoutMs = (options && options.timeoutMs) || 30 * 60 * 1000;

      const onTimeout = (options && options.onTimeout) || function () {};
      const allowOnTimeout = !!(options && options.allowOnTimeout === true);

      if (idleTimer) {
        clearInterval(idleTimer);
      }

      idleTimer = global.setInterval(() => {
        const now = Date.now();
        const diff = now - (memoryState.lastActivityAt || now);

        if (diff >= timeoutMs) {
          clearInterval(idleTimer);
          idleTimer = null;

          dispatchIdleTimeoutEvent_({
            timeoutMs,
            inactiveForMs: diff,
            lastActivityAt: memoryState.lastActivityAt || null,
            userPresent: !!memoryState.user
          });

          if (allowOnTimeout) {
            try {
              onTimeout();
            } catch (e) {
              console.warn("[Session] Erro no onTimeout (allowOnTimeout=true).", e);
            }
          } else {
            console.warn("[Session] Timeout de inatividade atingido (sem logoff automático).");
          }
        }
      }, 60 * 1000);
    },

    stopIdleTimer() {
      if (idleTimer) {
        clearInterval(idleTimer);
        idleTimer = null;
      }
    },

    _setupActivityListeners() {
      const events = ["click", "keydown", "mousemove", "scroll", "touchstart"];
      events.forEach((ev) => {
        global.addEventListener(ev, touchActivity, { passive: true });
      });
    }
  };

  PRONTIO.core.session = Session;

})(window);
