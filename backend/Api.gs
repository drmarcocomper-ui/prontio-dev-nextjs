/**
 * ============================================================
 * PRONTIO - Api.gs (FASE 0 + atualização FASE 5 – AUTH)
 * ============================================================
 * - doPost recebe JSON { action, payload }
 * - gera requestId
 * - cria ctx (timestamp, requestId, user se existir)
 * - chama Registry para obter handler + metadados
 * - aplica AUTH/ROLES via Auth.gs quando configurado no Registry
 * - try/catch global e retorna JSON padrão
 *
 * Retorno padrão (novo):
 * { success:boolean, data:any, errors:[{code,message,details?}], requestId }
 *
 * Compatibilidade (legado opcional):
 * também inclui meta.request_id, meta.action, meta.api_version, meta.env
 */

var PRONTIO_API_VERSION = typeof PRONTIO_API_VERSION !== "undefined" ? PRONTIO_API_VERSION : "1.0.0-DEV";
var PRONTIO_ENV = typeof PRONTIO_ENV !== "undefined" ? PRONTIO_ENV : "DEV";

// CORS (DEV)
var CORS_ALLOW_ORIGIN = typeof CORS_ALLOW_ORIGIN !== "undefined" ? CORS_ALLOW_ORIGIN : "*";
var CORS_ALLOW_METHODS = typeof CORS_ALLOW_METHODS !== "undefined" ? CORS_ALLOW_METHODS : "GET,POST,OPTIONS";
var CORS_ALLOW_HEADERS = typeof CORS_ALLOW_HEADERS !== "undefined" ? CORS_ALLOW_HEADERS : "Content-Type, Authorization";

// ======================
// WebApp entrypoints
// ======================

function doOptions(e) {
  var requestId = _makeRequestId_();
  return _withCors_(
    _jsonOutput_(Errors ? Errors.ok({ requestId: requestId, action: "OPTIONS" }, { ok: true, preflight: true }) : _ok_(requestId, { ok: true, preflight: true }, { action: "OPTIONS" }))
  );
}

function doGet(e) {
  var requestId = _makeRequestId_();
  var data = {
    name: "PRONTIO API",
    version: PRONTIO_API_VERSION,
    env: PRONTIO_ENV,
    time: new Date().toISOString()
  };
  return _withCors_(_jsonOutput_(_ok_(requestId, data, { action: "GET" })));
}

function doPost(e) {
  var requestId = _makeRequestId_();
  var startedAt = new Date();

  try {
    var req = _parseRequestBody_(e);
    var action = String(req.action || "").trim();
    var payload = req.payload || {};

    if (!action) {
      return _withCors_(_jsonOutput_(_err_(requestId, [
        { code: "VALIDATION_ERROR", message: 'Campo "action" é obrigatório.', details: { field: "action" } }
      ])));
    }

    var ctx = {
      requestId: requestId,
      timestamp: startedAt.toISOString(),
      startedAtMs: startedAt.getTime(),
      action: action,
      env: PRONTIO_ENV,
      apiVersion: PRONTIO_API_VERSION,
      user: null
    };

    // Resolve user (se Auth.gs existir)
    if (typeof Auth_getUserContext_ === "function") {
      ctx.user = Auth_getUserContext_(payload);
    } else {
      // fallback dev: aceita payload.user sem enforcement
      ctx.user = (payload && payload.user) ? payload.user : null;
    }

    // Registry (obrigatório)
    var entry = Registry_getAction_(action);

    if (!entry) {
      // fallback legado opcional (mantém compatibilidade)
      if (typeof routeAction_ === "function") {
        var legacyData = routeAction_(action, payload);
        var okLegacy = _ok_(requestId, legacyData, { action: action, legacy: true });
        return _withCors_(_jsonOutput_(okLegacy));
      }

      return _withCors_(_jsonOutput_(_err_(requestId, [
        { code: "NOT_FOUND", message: "Action não registrada.", details: { action: action } }
      ], { action: action })));
    }

    // AUTH enforcement por action (FASE 5)
    if (entry.requiresAuth) {
      if (typeof Auth_requireAuth_ === "function" && typeof Errors !== "undefined") {
        var authRes = Auth_requireAuth_(ctx, payload);
        if (!authRes.success) return _withCors_(_jsonOutput_(authRes));
      } else if (typeof requireAuthIfEnabled_ === "function") {
        // fallback legado (se existir)
        requireAuthIfEnabled_(action, payload);
      } else {
        return _withCors_(_jsonOutput_(_err_(requestId, [
          { code: "INTERNAL_ERROR", message: "Auth requerido, mas Auth.gs não disponível.", details: { action: action } }
        ], { action: action })));
      }
    }

    // ROLES enforcement por action (FASE 5)
    if (entry.roles && entry.roles.length) {
      if (typeof Auth_requireRoles_ === "function" && typeof Errors !== "undefined") {
        var roleRes = Auth_requireRoles_(ctx, entry.roles);
        if (!roleRes.success) return _withCors_(_jsonOutput_(roleRes));
      } else {
        return _withCors_(_jsonOutput_(_err_(requestId, [
          { code: "INTERNAL_ERROR", message: "Roles requeridas, mas Auth.gs/Errors.gs não disponível.", details: { action: action, roles: entry.roles } }
        ], { action: action })));
      }
    }

    // Validations (FASE 2) se estiverem configuradas no Registry
    if (entry.validations && entry.validations.length && typeof Validators_run_ === "function") {
      var vRes = Validators_run_(ctx, entry.validations, payload);
      if (!vRes.success) return _withCors_(_jsonOutput_(vRes));
    }

    // Locks (FASE 1) se estiverem configurados no Registry
    var data;
    if (entry.requiresLock && typeof Locks_withLock_ === "function") {
      data = Locks_withLock_(ctx, entry.lockKey || action, function () {
        return entry.handler(ctx, payload);
      });
    } else {
      data = entry.handler(ctx, payload);
    }

    var ok = _ok_(requestId, data, { action: action });
    try {
      if (typeof Audit_log_ === "function") {
        Audit_log_(ctx, { outcome: "SUCCESS", durationMs: (new Date().getTime() - startedAt.getTime()) });
      }
    } catch (_) {}

    return _withCors_(_jsonOutput_(ok));

  } catch (err) {
    // Normaliza erro no envelope padrão
    var out;
    if (typeof Errors !== "undefined" && Errors && typeof Errors.fromException === "function") {
      out = Errors.fromException({ requestId: requestId, action: null }, err, "Erro interno.");
      // garantir compatibilidade meta
      if (!out.meta) out.meta = { request_id: requestId, api_version: PRONTIO_API_VERSION, env: PRONTIO_ENV };
    } else {
      out = _exceptionToErrorResponse_(requestId, err);
    }

    try {
      if (typeof Audit_log_ === "function") {
        Audit_log_({ requestId: requestId, action: null, env: PRONTIO_ENV, apiVersion: PRONTIO_API_VERSION }, { outcome: "ERROR", error: out.errors ? out.errors[0] : null });
      }
    } catch (_) {}

    return _withCors_(_jsonOutput_(out));
  }
}

// ======================
// Parsing + Response helpers
// ======================

function _makeRequestId_() {
  try {
    return Utilities.getUuid();
  } catch (e) {
    return "req_" + String(new Date().getTime());
  }
}

function _parseRequestBody_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    if (e && e.parameter && (e.parameter.action || e.parameter.payload)) {
      var payloadObj = {};
      try {
        payloadObj = e.parameter.payload ? JSON.parse(e.parameter.payload) : {};
      } catch (err) {
        throw { code: "VALIDATION_ERROR", message: "payload inválido em e.parameter.payload", details: String(err) };
      }
      return { action: e.parameter.action || "", payload: payloadObj || {} };
    }
    throw { code: "VALIDATION_ERROR", message: "Corpo da requisição vazio.", details: { reason: "EMPTY_BODY" } };
  }

  var raw = String(e.postData.contents || "").trim();
  if (!raw) throw { code: "VALIDATION_ERROR", message: "Corpo da requisição vazio.", details: { reason: "EMPTY_BODY" } };

  try {
    var json = JSON.parse(raw);
    return { action: json.action, payload: json.payload || {} };
  } catch (err) {
    throw { code: "VALIDATION_ERROR", message: "JSON inválido.", details: String(err) };
  }
}

function _jsonOutput_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function _withCors_(textOutput) {
  try {
    textOutput.setHeader("Access-Control-Allow-Origin", CORS_ALLOW_ORIGIN);
    textOutput.setHeader("Access-Control-Allow-Methods", CORS_ALLOW_METHODS);
    textOutput.setHeader("Access-Control-Allow-Headers", CORS_ALLOW_HEADERS);
  } catch (e) {}
  return textOutput;
}

function _ok_(requestId, data, meta) {
  meta = meta || {};
  return {
    success: true,
    data: (data === undefined ? null : data),
    errors: [],
    requestId: requestId,
    meta: {
      request_id: requestId,
      action: meta.action || null,
      api_version: PRONTIO_API_VERSION,
      env: PRONTIO_ENV,
      legacy: meta.legacy === true
    }
  };
}

function _err_(requestId, errors, meta) {
  meta = meta || {};
  return {
    success: false,
    data: null,
    errors: errors || [],
    requestId: requestId,
    meta: {
      request_id: requestId,
      action: meta.action || null,
      api_version: PRONTIO_API_VERSION,
      env: PRONTIO_ENV
    }
  };
}

function _exceptionToErrorResponse_(requestId, err) {
  var code = "INTERNAL_ERROR";
  var message = "Erro interno.";
  var details = null;

  if (err && typeof err === "object") {
    if (err.code) code = String(err.code);
    if (err.message) message = String(err.message);
    if (err.details !== undefined) details = err.details;
    else if (err.stack) details = String(err.stack).slice(0, 4000);
  } else if (err !== undefined) {
    message = String(err);
  }

  return _err_(requestId, [{ code: code, message: message, details: details }]);
}
