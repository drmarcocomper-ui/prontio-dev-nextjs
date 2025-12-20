/**
 * ============================================================
 * PRONTIO - Errors.gs (FASE 2)
 * ============================================================
 * Catálogo de códigos de erro + helpers padronizados.
 *
 * Envelope padrão esperado:
 * { success:boolean, data:any, errors:[{code,message,details?}], requestId }
 */

var Errors = (function () {
  var CODES = {
    VALIDATION_ERROR: "VALIDATION_ERROR",
    NOT_FOUND: "NOT_FOUND",
    CONFLICT: "CONFLICT",
    PERMISSION_DENIED: "PERMISSION_DENIED",
    INTERNAL_ERROR: "INTERNAL_ERROR",

    // ✅ NOVOS (não quebram legado; só padronizam AUTH)
    AUTH_REQUIRED: "AUTH_REQUIRED",
    AUTH_INVALID_CREDENTIALS: "AUTH_INVALID_CREDENTIALS"
  };

  function make(code, message, details) {
    return {
      code: code || CODES.INTERNAL_ERROR,
      message: message || "Erro.",
      details: (details === undefined ? null : details)
    };
  }

  /**
   * Builder de resposta de erro no envelope padrão.
   * ctx pode ser null; requestId pode ser passado explicitamente.
   */
  function response(ctx, code, message, details) {
    var requestId = (ctx && ctx.requestId) ? ctx.requestId : null;
    var out = {
      success: false,
      data: null,
      errors: [make(code, message, details)],
      requestId: requestId
    };

    // Compatibilidade legada (se Api.gs estiver incluindo meta)
    if (typeof PRONTIO_API_VERSION !== "undefined" || typeof PRONTIO_ENV !== "undefined") {
      out.meta = {
        request_id: requestId,
        action: (ctx && ctx.action) ? ctx.action : null,
        api_version: (typeof PRONTIO_API_VERSION !== "undefined") ? PRONTIO_API_VERSION : null,
        env: (typeof PRONTIO_ENV !== "undefined") ? PRONTIO_ENV : null
      };
    }

    return out;
  }

  /**
   * Builder de resposta de sucesso no envelope padrão.
   */
  function ok(ctx, data) {
    var requestId = (ctx && ctx.requestId) ? ctx.requestId : null;
    var out = {
      success: true,
      data: (data === undefined ? null : data),
      errors: [],
      requestId: requestId
    };

    if (typeof PRONTIO_API_VERSION !== "undefined" || typeof PRONTIO_ENV !== "undefined") {
      out.meta = {
        request_id: requestId,
        action: (ctx && ctx.action) ? ctx.action : null,
        api_version: (typeof PRONTIO_API_VERSION !== "undefined") ? PRONTIO_API_VERSION : null,
        env: (typeof PRONTIO_ENV !== "undefined") ? PRONTIO_ENV : null
      };
    }

    return out;
  }

  /**
   * Converte exception (objeto {code,message,details} ou Error/string)
   * em resposta INTERNAL_ERROR (ou usa code se existir).
   */
  function fromException(ctx, err, fallbackMessage) {
    var code = CODES.INTERNAL_ERROR;
    var message = fallbackMessage || "Erro interno.";
    var details = null;

    if (err && typeof err === "object") {
      if (err.code) code = String(err.code);
      if (err.message) message = String(err.message);
      if (err.details !== undefined) details = err.details;
      else if (err.stack) details = String(err.stack).slice(0, 4000);
    } else if (err !== undefined) {
      message = String(err);
    }

    return response(ctx, code, message, details);
  }

  return {
    CODES: CODES,
    make: make,
    response: response,
    ok: ok,
    fromException: fromException
  };
})();

/**
 * Helper procedural (para uso direto, sem depender do objeto Errors)
 */
function Errors_build_(ctx, code, message, details) {
  return Errors.response(ctx, code, message, details);
}
