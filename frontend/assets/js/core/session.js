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
      // IE/ambientes antigos: fallback silencioso
      try {
        const ev = document.createEvent("Event");
        ev.initEvent("prontio:idle-timeout", true, true);
        ev.detail = payload || {};
        global.dispatchEvent(ev);
      } catch (_) {}
    }
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
    },

    setLastPatientId(id) {
      memoryState.lastPatientId = id || null;
      touchActivity();
    },

    getLastPatientId() {
      return memoryState.lastPatientId;
    },

    setLastAgendaDate(dateStr) {
      // string no formato YYYY-MM-DD (quem define é o backend)
      memoryState.lastAgendaDate = dateStr || null;
      touchActivity();
    },

    getLastAgendaDate() {
      return memoryState.lastAgendaDate;
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

      // Mantém compat, mas NÃO executa por padrão.
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

          // ✅ Hook profissional: evento para UI (aviso/bloqueio), sem logout.
          dispatchIdleTimeoutEvent_({
            timeoutMs,
            inactiveForMs: diff,
            lastActivityAt: memoryState.lastActivityAt || null,
            userPresent: !!memoryState.user
          });

          // Compat: só chama callback se explicitamente autorizado
          if (allowOnTimeout) {
            try {
              onTimeout();
            } catch (e) {
              console.warn("[Session] Erro no onTimeout (allowOnTimeout=true).", e);
            }
          } else {
            // log leve para debug (sem forçar saída)
            console.warn("[Session] Timeout de inatividade atingido (sem logoff automático).");
          }
        }
      }, 60 * 1000); // verifica a cada 1 minuto
    },

    /**
     * Para o timer de inatividade (se estiver rodando).
     */
    stopIdleTimer() {
      if (idleTimer) {
        clearInterval(idleTimer);
        idleTimer = null;
      }
    },

    /**
     * Registra listeners para atualizar lastActivityAt
     * sempre que o usuário interagir com a interface.
     * (somente front-end)
     */
    _setupActivityListeners() {
      const events = ["click", "keydown", "mousemove", "scroll", "touchstart"];
      events.forEach((ev) => {
        global.addEventListener(ev, touchActivity, { passive: true });
      });
    }
  };

  PRONTIO.core.session = Session;

})(window);
