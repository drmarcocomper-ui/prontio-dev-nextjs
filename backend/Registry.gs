/**
 * ============================================================
 * PRONTIO - Registry.gs (FASE 0 + FASE 4 + atualização FASE 6)
 * ============================================================
 * Catálogo central de actions:
 * - Meta.Ping
 * - Meta.ListActions
 * - Meta.DbStatus
 * - Meta.HealthCheck
 */

function Registry_getAction_(action) {
  var catalog = Registry_catalog_();
  return catalog[action] || null;
}

function Registry_listActions_() {
  var catalog = Registry_catalog_();
  var keys = Object.keys(catalog).sort();
  return keys.map(function (k) {
    var a = catalog[k];
    return {
      action: k,
      requiresAuth: !!a.requiresAuth,
      roles: a.roles || [],
      requiresLock: !!a.requiresLock,
      idempotent: !!a.idempotent,
      validations: (a.validations || []).map(function (v) { return _stringifyValidationHint_(v); })
    };
  });
}

function Registry_catalog_() {
  if (Registry_catalog_._cache) return Registry_catalog_._cache;

  var catalog = {};

  // =========
  // Meta
  // =========
  catalog["Meta.Ping"] = {
    handler: Meta_Ping_,
    requiresAuth: false,
    roles: [],
    requiresLock: false,
    idempotent: true,
    validations: []
  };

  catalog["Meta.ListActions"] = {
    handler: Meta_ListActions_,
    requiresAuth: false,
    roles: [],
    requiresLock: false,
    idempotent: true,
    validations: []
  };

  catalog["Meta.DbStatus"] = {
    handler: Meta_DbStatus_,
    requiresAuth: false, // pode virar true quando quiser
    roles: [],
    requiresLock: false,
    idempotent: true,
    validations: []
  };

  catalog["Meta.HealthCheck"] = {
    handler: Meta_HealthCheck_,
    requiresAuth: false, // pode virar true quando quiser
    roles: [],
    requiresLock: false,
    idempotent: true,
    validations: []
  };

  // =========
  // Adapters opcionais para legado (se existir handleXAction no projeto)
  // =========
  _tryRegisterLegacyAdapter_(catalog, "Agenda", "agenda", "handleAgendaAction");
  _tryRegisterLegacyAdapter_(catalog, "Pacientes", "pacientes", "handlePacientesAction");
  _tryRegisterLegacyAdapter_(catalog, "Evolucao", "evolucao", "handleEvolucaoAction");
  _tryRegisterLegacyAdapter_(catalog, "Receita", "receita", "handleReceitaAction");
  _tryRegisterLegacyAdapter_(catalog, "Config", "config", "handleConfigAction");
  _tryRegisterLegacyAdapter_(catalog, "Usuarios", "usuarios", "handleUsuariosAction");
  _tryRegisterLegacyAdapter_(catalog, "Laudos", "laudos", "handleLaudosAction");
  _tryRegisterLegacyAdapter_(catalog, "Exames", "exames", "handleExamesAction");
  _tryRegisterLegacyAdapter_(catalog, "Auth", "auth", "handleAuthAction");
  _tryRegisterLegacyAdapter_(catalog, "Prontuario", "prontuario", "handleProntuarioAction");

  Registry_catalog_._cache = catalog;
  return catalog;
}

// ======================
// Meta handlers
// ======================

function Meta_Ping_(ctx, payload) {
  return {
    ok: true,
    api: "PRONTIO",
    version: ctx.apiVersion || null,
    env: ctx.env || null,
    time: new Date().toISOString(),
    requestId: ctx.requestId
  };
}

function Meta_ListActions_(ctx, payload) {
  var list = Registry_listActions_();
  return {
    actions: list,
    count: list.length,
    requestId: ctx.requestId
  };
}

function Meta_DbStatus_(ctx, payload) {
  if (typeof Migrations_getDbStatus_ !== "function") {
    return { ok: false, error: "Migrations_getDbStatus_ não encontrado.", requestId: ctx.requestId };
  }
  return { requestId: ctx.requestId, status: Migrations_getDbStatus_() };
}

// Meta_HealthCheck_ está em Health.gs

// ======================
// Legacy adapter support
// ======================

function _tryRegisterLegacyAdapter_(catalog, prefixTitle, prefixKeyLower, handlerFnName) {
  try {
    if (typeof this[handlerFnName] !== "function") return;

    var actionName = prefixTitle + "._LegacyRouter";

    catalog[actionName] = {
      handler: function (ctx, payload) {
        var action = ctx && ctx.action ? ctx.action : actionName;
        return this[handlerFnName](action, payload);
      },
      requiresAuth: false,
      roles: [],
      requiresLock: false,
      idempotent: false,
      validations: []
    };
  } catch (e) {
    // silêncio
  }
}

function _stringifyValidationHint_(v) {
  try {
    if (v === null || v === undefined) return String(v);
    if (typeof v === "string") return v;
    if (typeof v === "function") return "fn:" + (v.name || "anonymous");
    return JSON.stringify(v);
  } catch (e) {
    return "validation";
  }
}
