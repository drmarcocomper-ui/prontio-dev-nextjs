/**
 * ============================================================
 * PRONTIO - Audit.gs (FASE 3)
 * ============================================================
 * Log estruturado para observabilidade.
 *
 * Nesta fase (antes de Migrations), registramos:
 * - Logger.log (Stackdriver/Executions)
 * - Buffer persistente opcional em Script Properties (para debug)
 *
 * IMPORTANTÍSSIMO:
 * - Não acessa Google Sheets diretamente (regra: Sheets só via Repository/Migrations).
 * - Persistência em aba "Audit" será implementada na FASE 4 (Migrations) com Repository apropriado.
 */

var AUDIT_BUFFER_ENABLED = true;
var AUDIT_BUFFER_KEY = "PRONTIO_AUDIT_BUFFER";
var AUDIT_BUFFER_MAX = 200; // mantém últimos N eventos

/**
 * Audit_log_(ctx, event)
 * ctx: { requestId, action, timestamp, user?, ... }
 * event: { outcome, entity?, entityId?, durationMs?, error?, extra? }
 */
function Audit_log_(ctx, event) {
  try {
    var now = new Date();
    ctx = ctx || {};
    event = event || {};

    var entry = {
      ts: now.toISOString(),
      requestId: ctx.requestId || null,
      action: ctx.action || null,
      env: (typeof PRONTIO_ENV !== "undefined") ? PRONTIO_ENV : null,
      apiVersion: (typeof PRONTIO_API_VERSION !== "undefined") ? PRONTIO_API_VERSION : null,

      user: _auditSafeUser_(ctx.user),

      outcome: event.outcome || "UNKNOWN",
      entity: event.entity || null,
      entityId: event.entityId || null,
      durationMs: (typeof event.durationMs === "number") ? event.durationMs : null,

      error: event.error || null,
      extra: event.extra || null
    };

    // 1) Log em execução (sempre)
    Logger.log("[AUDIT] " + JSON.stringify(entry));

    // 2) Buffer persistente opcional (para debug)
    if (AUDIT_BUFFER_ENABLED) {
      _auditAppendBuffer_(entry);
    }

    return true;
  } catch (e) {
    // Nunca quebra request por falha de audit
    try { Logger.log("[AUDIT_FAIL] " + String(e)); } catch (_) {}
    return false;
  }
}

/**
 * Retorna os últimos eventos do buffer (para debug manual).
 * NOTA: não exposto como action por padrão.
 */
function Audit_getBuffer_() {
  var props = PropertiesService.getScriptProperties();
  var raw = props.getProperty(AUDIT_BUFFER_KEY);
  if (!raw) return [];
  try {
    var arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch (_) {
    return [];
  }
}

/**
 * Limpa o buffer (debug).
 */
function Audit_clearBuffer_() {
  PropertiesService.getScriptProperties().deleteProperty(AUDIT_BUFFER_KEY);
  return { ok: true };
}

// ======================
// Internals
// ======================

function _auditAppendBuffer_(entry) {
  var props = PropertiesService.getScriptProperties();
  var raw = props.getProperty(AUDIT_BUFFER_KEY);

  var arr = [];
  if (raw) {
    try {
      arr = JSON.parse(raw);
      if (!Array.isArray(arr)) arr = [];
    } catch (_) {
      arr = [];
    }
  }

  arr.push(entry);
  if (arr.length > AUDIT_BUFFER_MAX) {
    arr = arr.slice(arr.length - AUDIT_BUFFER_MAX);
  }

  props.setProperty(AUDIT_BUFFER_KEY, JSON.stringify(arr));
}

function _auditSafeUser_(user) {
  // Evita logar dados sensíveis. Mantém só identificadores básicos.
  if (!user || typeof user !== "object") return null;

  var safe = {};
  if (user.id !== undefined) safe.id = user.id;
  if (user.login !== undefined) safe.login = user.login;
  if (user.email !== undefined) safe.email = user.email;
  if (user.perfil !== undefined) safe.perfil = user.perfil;

  // Opcional: nome (depende da sua política)
  if (user.nome !== undefined) safe.nome = user.nome;

  return safe;
}
