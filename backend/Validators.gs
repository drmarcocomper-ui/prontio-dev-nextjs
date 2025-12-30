/**
 * ============================================================
 * PRONTIO - Validators.gs (FASE 2)
 * ============================================================
 * Validações reutilizáveis + runner.
 *
 * Modelo de "validation spec" aceito:
 * - { field, rule, message?, ...params }
 *   Exemplos:
 *   { field:"inicio", rule:"required" }
 *   { field:"inicio", rule:"date" }
 *   { field:"status", rule:"enum", values:["AGENDADO","CANCELADO"] }
 *   { field:"duracaoMin", rule:"min", value:1 }
 *   { field:"nome", rule:"maxLength", value:120 }
 *
 * Ajuste mínimo aplicado:
 * - Validators_run_ retorna envelope compatível com Errors.gs (quando disponível),
 *   e fallback seguro quando Errors não estiver carregado.
 *
 * ✅ FIX (SEM QUEBRAR):
 * - Não assume que Errors existe dentro das regras (evita ReferenceError).
 * - _vRegex_ protege RegExp inválido (não derruba request).
 * - Runner usa Errors.response/Errors.ok quando disponível.
 */

function Validators_run_(ctx, validations, payload) {
  payload = payload || {};
  validations = validations || [];

  var errors = [];
  for (var i = 0; i < validations.length; i++) {
    var v = validations[i];
    var res = Validators_validateOne_(v, payload);
    if (res && res.length) errors = errors.concat(res);
  }

  if (errors.length) {
    // Preferência: Errors.response (padroniza envelope/meta)
    if (typeof Errors !== "undefined" && Errors && typeof Errors.response === "function") {
      // Mantém múltiplos erros: devolve o primeiro como "message" do response,
      // mas preserva a lista completa em errors (envelope PRONTIO).
      // Como Errors.response só cria errors[0], faremos envelope manual quando há muitos.
      // (Sem quebrar: mantém compat com Api.gs e com o front.)
      return {
        success: false,
        data: null,
        errors: errors,
        requestId: (ctx && ctx.requestId) ? ctx.requestId : null,
        meta: (typeof PRONTIO_API_VERSION !== "undefined" || typeof PRONTIO_ENV !== "undefined") ? {
          request_id: (ctx && ctx.requestId) ? ctx.requestId : null,
          action: (ctx && ctx.action) ? ctx.action : null,
          api_version: (typeof PRONTIO_API_VERSION !== "undefined") ? PRONTIO_API_VERSION : null,
          env: (typeof PRONTIO_ENV !== "undefined") ? PRONTIO_ENV : null
        } : undefined
      };
    }

    // Fallback seguro (caso Errors.gs não esteja carregado)
    return {
      success: false,
      data: null,
      errors: errors,
      requestId: (ctx && ctx.requestId) ? ctx.requestId : null
    };
  }

  // Sucesso padronizado
  if (typeof Errors !== "undefined" && Errors && typeof Errors.ok === "function") {
    return Errors.ok(ctx, { ok: true });
  }

  // Fallback
  return { success: true, data: { ok: true }, errors: [], requestId: (ctx && ctx.requestId) ? ctx.requestId : null };
}

function Validators_validateOne_(spec, payload) {
  if (!spec) return [];
  var field = spec.field;
  var rule = spec.rule;

  if (!field || !rule) {
    return [_vMakeError_("VALIDATION_ERROR", "Spec de validação inválida.", { spec: spec })];
  }

  var value = _getValueByPath_(payload, field);
  var msg = spec.message;

  switch (rule) {
    case "required":
      return _vRequired_(field, value, msg);

    case "type":
      return _vType_(field, value, spec.value, msg); // spec.value = "string" | "number" | "boolean" | "object" | "array"

    case "maxLength":
      return _vMaxLength_(field, value, spec.value, msg);

    case "minLength":
      return _vMinLength_(field, value, spec.value, msg);

    case "min":
      return _vMin_(field, value, spec.value, msg);

    case "max":
      return _vMax_(field, value, spec.value, msg);

    case "date":
      return _vDate_(field, value, msg); // aceita Date, ISO, timestamp numérico

    case "enum":
      return _vEnum_(field, value, spec.values || [], msg);

    case "object":
      return _vObject_(field, value, msg);

    case "array":
      return _vArray_(field, value, msg);

    case "match":
      return _vRegex_(field, value, spec.pattern, msg);

    default:
      return [_vMakeError_("VALIDATION_ERROR", "Regra de validação desconhecida: " + rule, { field: field, rule: rule })];
  }
}

// ======================
// Error helper (SEM QUEBRAR)
// ======================

function _vMakeError_(code, message, details) {
  // Usa Errors.make se existir; senão cria objeto compatível
  try {
    if (typeof Errors !== "undefined" && Errors && typeof Errors.make === "function" && Errors.CODES) {
      var c = Errors.CODES[code] || Errors.CODES.VALIDATION_ERROR || "VALIDATION_ERROR";
      return Errors.make(c, message, details);
    }
  } catch (_) {}

  return {
    code: String(code || "VALIDATION_ERROR"),
    message: String(message || "Erro de validação."),
    details: (details === undefined ? null : details)
  };
}

// ======================
// Rules
// ======================

function _vRequired_(field, value, msg) {
  var ok = !(value === null || value === undefined || (typeof value === "string" && value.trim() === ""));
  return ok ? [] : [_vMakeError_("VALIDATION_ERROR", msg || ("Campo obrigatório: " + field), { field: field })];
}

function _vType_(field, value, expected, msg) {
  if (value === null || value === undefined) return []; // type check doesn't imply required
  var t = expected;

  var ok = true;
  if (t === "array") ok = Array.isArray(value);
  else if (t === "object") ok = (typeof value === "object" && value !== null && !Array.isArray(value));
  else ok = (typeof value === t);

  return ok ? [] : [_vMakeError_(
    "VALIDATION_ERROR",
    msg || ("Tipo inválido em " + field),
    { field: field, expected: expected, got: (Array.isArray(value) ? "array" : typeof value) }
  )];
}

function _vMaxLength_(field, value, max, msg) {
  if (value === null || value === undefined) return [];
  var s = String(value);
  return (s.length <= max) ? [] : [_vMakeError_("VALIDATION_ERROR", msg || ("Tamanho máximo excedido: " + field), { field: field, max: max, length: s.length })];
}

function _vMinLength_(field, value, min, msg) {
  if (value === null || value === undefined) return [];
  var s = String(value);
  return (s.length >= min) ? [] : [_vMakeError_("VALIDATION_ERROR", msg || ("Tamanho mínimo não atingido: " + field), { field: field, min: min, length: s.length })];
}

function _vMin_(field, value, min, msg) {
  if (value === null || value === undefined) return [];
  var n = Number(value);
  if (isNaN(n)) return [_vMakeError_("VALIDATION_ERROR", msg || ("Número inválido: " + field), { field: field })];
  return (n >= min) ? [] : [_vMakeError_("VALIDATION_ERROR", msg || ("Valor mínimo não atingido: " + field), { field: field, min: min, got: n })];
}

function _vMax_(field, value, max, msg) {
  if (value === null || value === undefined) return [];
  var n = Number(value);
  if (isNaN(n)) return [_vMakeError_("VALIDATION_ERROR", msg || ("Número inválido: " + field), { field: field })];
  return (n <= max) ? [] : [_vMakeError_("VALIDATION_ERROR", msg || ("Valor máximo excedido: " + field), { field: field, max: max, got: n })];
}

function _vDate_(field, value, msg) {
  if (value === null || value === undefined) return [];
  var d = _parseDate_(value);
  return d ? [] : [_vMakeError_("VALIDATION_ERROR", msg || ("Data inválida: " + field), { field: field, value: value })];
}

function _vEnum_(field, value, values, msg) {
  if (value === null || value === undefined) return [];
  var ok = values.indexOf(value) >= 0;
  return ok ? [] : [_vMakeError_("VALIDATION_ERROR", msg || ("Valor inválido: " + field), { field: field, allowed: values, got: value })];
}

function _vObject_(field, value, msg) {
  if (value === null || value === undefined) return [];
  var ok = (typeof value === "object" && value !== null && !Array.isArray(value));
  return ok ? [] : [_vMakeError_("VALIDATION_ERROR", msg || ("Objeto inválido: " + field), { field: field })];
}

function _vArray_(field, value, msg) {
  if (value === null || value === undefined) return [];
  var ok = Array.isArray(value);
  return ok ? [] : [_vMakeError_("VALIDATION_ERROR", msg || ("Array inválido: " + field), { field: field })];
}

function _vRegex_(field, value, pattern, msg) {
  if (value === null || value === undefined) return [];
  if (!pattern) return [_vMakeError_("VALIDATION_ERROR", "Regex pattern ausente em validação.", { field: field })];

  var re;
  try {
    re = new RegExp(pattern);
  } catch (e) {
    // ✅ não derruba request por regex inválido; trata como erro de validação do spec
    return [_vMakeError_("VALIDATION_ERROR", "Regex inválido na validação.", { field: field, pattern: pattern, error: String(e) })];
  }

  var ok = re.test(String(value));
  return ok ? [] : [_vMakeError_("VALIDATION_ERROR", msg || ("Formato inválido: " + field), { field: field, pattern: pattern })];
}

// ======================
// Utils
// ======================

function _getValueByPath_(obj, path) {
  if (!path) return undefined;
  if (path.indexOf(".") < 0) return obj[path];

  var parts = path.split(".");
  var cur = obj;
  for (var i = 0; i < parts.length; i++) {
    if (cur === null || cur === undefined) return undefined;
    cur = cur[parts[i]];
  }
  return cur;
}

function _parseDate_(v) {
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  if (typeof v === "number") {
    var dNum = new Date(v);
    return isNaN(dNum.getTime()) ? null : dNum;
  }
  if (typeof v === "string") {
    // ISO / yyyy-mm-dd / etc.
    var dStr = new Date(v);
    return isNaN(dStr.getTime()) ? null : dStr;
  }
  return null;
}
