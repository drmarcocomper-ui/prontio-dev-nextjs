(function (global, document) {
  const PRONTIO = (global.PRONTIO = global.PRONTIO || {});
  PRONTIO.features = PRONTIO.features || {};
  PRONTIO.features.prontuario = PRONTIO.features.prontuario || {};

  const callApiData =
    (PRONTIO.api && PRONTIO.api.callApiData) ||
    global.callApiData ||
    function () {
      return Promise.reject(
        new Error(
          "API não disponível (callApiData indefinido). Verifique se assets/js/core/api.js foi carregado antes."
        )
      );
    };

  // ✅ P4: AbortController para cancelamento de requisições
  let currentAbortController = null;

  /**
   * Cria um novo AbortController e retorna o signal
   * Use para cancelar requisições em andamento quando usuário navega
   */
  function createAbortSignal_() {
    // Cancela requisição anterior se existir
    if (currentAbortController) {
      try { currentAbortController.abort(); } catch (_) {}
    }
    currentAbortController = new AbortController();
    return currentAbortController.signal;
  }

  /**
   * Cancela todas as requisições em andamento
   */
  function cancelPendingRequests_() {
    if (currentAbortController) {
      try { currentAbortController.abort(); } catch (_) {}
      currentAbortController = null;
    }
  }

  /**
   * Tenta chamar uma lista de actions até uma funcionar
   * @param {string|string[]} actions - Action ou lista de actions para tentar
   * @param {object} payload - Payload da requisição
   * @param {object} opts - Opções: { signal?: AbortSignal }
   */
  async function callApiDataTry_(actions, payload, opts) {
    const list = Array.isArray(actions) ? actions : [actions];
    const signal = opts && opts.signal ? opts.signal : null;
    let lastErr = null;

    for (let i = 0; i < list.length; i++) {
      const action = list[i];

      // ✅ P4: Verifica se foi cancelado antes de cada tentativa
      if (signal && signal.aborted) {
        const err = new Error("Requisição cancelada");
        err.name = "AbortError";
        throw err;
      }

      try {
        const data = await callApiData({ action, payload: payload || {}, signal });
        return data;
      } catch (e) {
        // ✅ P4: Se foi cancelado, propaga o erro imediatamente
        if (e && e.name === "AbortError") throw e;
        lastErr = e;
      }
    }

    throw lastErr || new Error("Falha ao chamar API (todas as actions falharam).");
  }

  PRONTIO.features.prontuario.api = {
    callApiData,
    callApiDataTry_,
    createAbortSignal_,
    cancelPendingRequests_,
  };
})(window, document);
