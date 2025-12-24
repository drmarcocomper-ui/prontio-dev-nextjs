/**
 * ============================================================
 * PRONTIO - Api.gs (FASE 0 + atualização FASE 5 – AUTH)
 * ============================================================
 * - doPost recebe JSON { action, payload }
 * - doGet: mantém status/info, MAS se receber query action/payload,
 *   executa action e pode responder em JSONP (callback=...).
 *
 * Retorno padrão (novo):
 * { success:boolean, data:any, errors:[{code,message,details?}], requestId }
 *
 * ✅ Ajuste (CORS + GitHub Pages):
 * - Mantém _parseRequestBody_ com:
 *   1) JSON body
 *   2) form-urlencoded body
 *   3) fallback via e.parameter.action / e.parameter.payload
 *
 * ✅ NOVO (CORS definitivo):
 * - Suporte a JSONP via doGet quando e.parameter.action existir:
 *     ?action=...&payload=...&callback=cb123
 * - Responde JavaScript: cb123(<JSON>);
 * - Evita CORS/preflight completamente.
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
    _jsonOutput_(
      (typeof Errors !== "undefined" && Errors && typeof Errors.ok === "function")
        ? Errors.ok({ requestId: requestId, action: "OPTIONS" }, { ok: true, preflight: true })
        : _ok_(requestId, { ok: true, preflight: true }, { action: "OPTIONS" })
    )
  );
}

function doGet(e) {
  // ✅ Se vier action/payload por querystring, executa action (JSONP opcional)
  try {
    if (e && e.parameter && e.parameter.action) {
      var requestId = _makeRequestId_();
      var startedAt = new Date();

      var req = _parseRequestBody_(e); // usa e.parameter.action/payload
      var action = String(req.action || "").trim();
      var payload = req.payload || {};

      if (!action) {
        var errRes = _err_(requestId, [
          { code: "VALIDATION_ERROR", message: 'Campo "action" é obrigatório.', details: { field: "action" } }
        ], { action: action });
        return _respondMaybeJsonp_(e, errRes);
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

      var entry = Registry_getAction_(action);
      if (!entry) {
        var nf = _err_(requestId, [
          { code: "NOT_FOUND", message: "Action não registrada.", details: { action: action } }
        ], { action: action });
        return _respondMaybeJsonp_(e, nf);
      }

      // Resolve user (Auth via payload.token)
      if (typeof Auth_getUserContext_ === "function") {
        ctx.user = Auth_getUserContext_(payload);
      }

      // AUTH enforcement
      if (entry.requiresAuth) {
        if (typeof Auth_requireAuth_ === "function" && typeof Errors !== "undefined" && Errors) {
          var authRes = Auth_requireAuth_(ctx, payload);
          if (!authRes.success) return _respondMaybeJsonp_(e, authRes);
        } else if (typeof requireAuthIfEnabled_ === "function") {
          requireAuthIfEnabled_(action, payload);
        } else {
          var ae = _err_(requestId, [
            { code: "INTERNAL_ERROR", message: "Auth requerido, mas Auth.gs/Errors.gs não disponível.", details: { action: action } }
          ], { action: action });
          return _respondMaybeJsonp_(e, ae);
        }
      }

      // ROLES enforcement
      if (entry.roles && entry.roles.length) {
        if (typeof Auth_requireRoles_ === "function" && typeof Errors !== "undefined" && Errors) {
          var roleRes = Auth_requireRoles_(ctx, entry.roles);
          if (!roleRes.success) return _respondMaybeJsonp_(e, roleRes);
        } else {
          var re = _err_(requestId, [
            { code: "INTERNAL_ERROR", message: "Roles requeridas, mas Auth.gs/Errors.gs não disponível.", details: { action: action, roles: entry.roles } }
          ], { action: action });
          return _respondMaybeJsonp_(e, re);
        }
      }

      // Validations
      if (entry.validations && entry.validations.length && typeof Validators_run_ === "function") {
        var vRes = Validators_run_(ctx, entry.validations, payload);
        if (!vRes.success) return _respondMaybeJsonp_(e, vRes);
      }

      // Locks
      var data;
      if (entry.requiresLock && typeof Locks_withLock_ === "function") {
        data = Locks_withLock_(ctx, entry.lockKey || action, function () {
          return entry.handler(ctx, payload);
        });
      } else {
        data = entry.handler(ctx, payload);
      }

      var ok = _ok_(requestId, data, { action: action });
      return _respondMaybeJsonp_(e, ok);
    }
  } catch (err) {
    var requestId2 = _makeRequestId_();
    var out2 = _exceptionToErrorResponse_(requestId2, err);
    return _respondMaybeJsonp_(e, out2);
  }

  // ✅ fallback original: endpoint info/health
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

    // ctx base (user será resolvido depois do Registry)
    var ctx = {
      requestId: requestId,
      timestamp: startedAt.toISOString(),
      startedAtMs: startedAt.getTime(),
      action: action,
      env: PRONTIO_ENV,
      apiVersion: PRONTIO_API_VERSION,
      user: null
    };

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

    /**
     * ✅ Resolve user APÓS conhecer a action (Registry).
     */
    if (typeof Auth_getUserContext_ === "function") {
      ctx.user = Auth_getUserContext_(payload);
    } else {
      ctx.user = null;
    }

    // AUTH enforcement por action (FASE 5)
    if (entry.requiresAuth) {
      if (typeof Auth_requireAuth_ === "function" && typeof Errors !== "undefined" && Errors) {
        var authRes = Auth_requireAuth_(ctx, payload);
        if (!authRes.success) return _withCors_(_jsonOutput_(authRes));
      } else if (typeof requireAuthIfEnabled_ === "function") {
        requireAuthIfEnabled_(action, payload);
      } else {
        return _withCors_(_jsonOutput_(_err_(requestId, [
          { code: "INTERNAL_ERROR", message: "Auth requerido, mas Auth.gs/Errors.gs não disponível.", details: { action: action } }
        ], { action: action })));
      }
    }

    // ROLES enforcement por action (FASE 5)
    if (entry.roles && entry.roles.length) {
      if (typeof Auth_requireRoles_ === "function" && typeof Errors !== "undefined" && Errors) {
        var roleRes = Auth_requireRoles_(ctx, entry.roles);
        if (!roleRes.success) return _withCors_(_jsonOutput_(roleRes));
      } else {
        return _withCors_(_jsonOutput_(_err_(requestId, [
          { code: "INTERNAL_ERROR", message: "Roles requeridas, mas Auth.gs/Errors.gs não disponível.", details: { action: action, roles: entry.roles } }
        ], { action: action })));
      }
    }

    // Validations (FASE 2)
    if (entry.validations && entry.validations.length && typeof Validators_run_ === "function") {
      var vRes = Validators_run_(ctx, entry.validations, payload);
      if (!vRes.success) return _withCors_(_jsonOutput_(vRes));
    }

    // Locks (FASE 1)
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
    var out;
    if (typeof Errors !== "undefined" && Errors && typeof Errors.fromException === "function") {
      out = Errors.fromException({ requestId: requestId, action: null }, err, "Erro interno.");
      if (!out.meta) out.meta = { request_id: requestId, api_version: PRONTIO_API_VERSION, env: PRONTIO_ENV };
    } else {
      out = _exceptionToErrorResponse_(requestId, err);
    }

    try {
      if (typeof Audit_log_ === "function") {
        Audit_log_(
          { requestId: requestId, action: null, env: PRONTIO_ENV, apiVersion: PRONTIO_API_VERSION },
          { outcome: "ERROR", error: out.errors ? out.errors[0] : null }
        );
      }
    } catch (_) {}

    return _withCors_(_jsonOutput_(out));
  }
}

// ======================
// JSONP + Response helpers
// ======================

function _respondMaybeJsonp_(e, obj) {
  try {
    var cb = e && e.parameter ? String(e.parameter.callback || "") : "";
    cb = cb.trim();

    if (cb) {
      return _jsonpOutput_(cb, obj);
    }
  } catch (_) {}

  return _withCors_(_jsonOutput_(obj));
}

function _jsonpOutput_(callbackName, obj) {
  // callbackName sanitização simples
  var cb = String(callbackName || "").replace(/[^\w.$]/g, "");
  if (!cb) cb = "__cb";

  var js = cb + "(" + JSON.stringify(obj) + ");";
  return ContentService
    .createTextOutput(js)
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

// ======================
// Parsing + Response helpers (mantidos)
// ======================

function _makeRequestId_() {
  try {
    return Utilities.getUuid();
  } catch (e) {
    return "req_" + String(new Date().getTime());
  }
}

function _parseRequestBody_(e) {
  // 1) fallback por querystring/parameters (GET-like)
  if (e && e.parameter && (e.parameter.action || e.parameter.payload)) {
    var payloadObj1 = {};
    try {
      payloadObj1 = e.parameter.payload ? JSON.parse(e.parameter.payload) : {};
    } catch (err1) {
      _apiThrow_("VALIDATION_ERROR", "payload inválido em e.parameter.payload", { error: String(err1) });
    }
    return { action: e.parameter.action || "", payload: payloadObj1 || {} };
  }

  // 2) sem body
  if (!e || !e.postData || !e.postData.contents) {
    _apiThrow_("VALIDATION_ERROR", "Corpo da requisição vazio.", { reason: "EMPTY_BODY" });
  }

  var raw = String(e.postData.contents || "").trim();
  if (!raw) _apiThrow_("VALIDATION_ERROR", "Corpo da requisição vazio.", { reason: "EMPTY_BODY" });

  // 3) tenta JSON
  if (raw[0] === "{" || raw[0] === "[") {
    try {
      var json = JSON.parse(raw);
      return { action: json.action, payload: json.payload || {} };
    } catch (errJson) {
      _apiThrow_("VALIDATION_ERROR", "JSON inválido.", { error: String(errJson) });
    }
  }

  // 4) tenta form-urlencoded
  if (raw.indexOf("action=") >= 0) {
    var parsed = _parseFormUrlEncoded_(raw);

    var action = parsed.action ? String(parsed.action) : "";
    var payloadRaw = parsed.payload !== undefined ? String(parsed.payload || "") : "";

    var payloadObj2 = {};
    if (payloadRaw) {
      try {
        payloadObj2 = JSON.parse(payloadRaw);
      } catch (err2) {
        _apiThrow_("VALIDATION_ERROR", "payload inválido em form-urlencoded.", {
          error: String(err2),
          payloadSnippet: payloadRaw.slice(0, 200)
        });
      }
    }

    return { action: action, payload: payloadObj2 || {} };
  }

  _apiThrow_("VALIDATION_ERROR", "Formato de requisição não suportado.", {
    hint: "Envie JSON {action,payload} ou form-urlencoded action=...&payload=...",
    rawSnippet: raw.slice(0, 200)
  });
}

function _parseFormUrlEncoded_(raw) {
  var out = {};
  var parts = raw.split("&");
  for (var i = 0; i < parts.length; i++) {
    var kv = parts[i].split("=");
    if (!kv.length) continue;

    var k = _decodeForm_(kv[0] || "");
    var v = kv.length > 1 ? _decodeForm_(kv.slice(1).join("=")) : "";

    if (k) out[k] = v;
  }
  return out;
}

function _decodeForm_(s) {
  s = String(s || "");
  s = s.replace(/\+/g, " ");
  try {
    return decodeURIComponent(s);
  } catch (_) {
    return s;
  }
}

function _apiThrow_(code, message, details) {
  var err = new Error(String(message || "Erro."));
  err.code = String(code || "INTERNAL_ERROR");
  err.details = (details === undefined ? null : details);
  throw err;
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
