/**
 * ============================================================
 * PRONTIO - Registry.gs
 * ============================================================
 * Catálogo central de actions.
 * IMPORTANTE: sem cache em memória para evitar "container quente"
 * reusar catálogo antigo entre execuções.
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
  // 🚫 SEM CACHE: evita ficar preso em versão antiga do catálogo.
  var catalog = {};

  // ============================================================
  // META
  // ============================================================

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
    requiresAuth: false,
    roles: [],
    requiresLock: false,
    idempotent: true,
    validations: []
  };

  catalog["Meta.HealthCheck"] = {
    handler: Meta_HealthCheck_,
    requiresAuth: false,
    roles: [],
    requiresLock: false,
    idempotent: true,
    validations: []
  };

  catalog["Meta.BootstrapDb"] = {
    handler: Meta_BootstrapDb_,
    requiresAuth: false,
    roles: [],
    requiresLock: true,
    idempotent: false,
    validations: []
  };

  // ============================================================
  // AGENDA (DEV - SEM AUTH)
  // ============================================================

  catalog["Agenda.ListarPorPeriodo"] = {
    handler: Agenda_Action_ListarPorPeriodo_,
    requiresAuth: false, // 🔓 DEV
    roles: [],
    requiresLock: false,
    idempotent: true,
    validations: [
      { field: "inicio", rule: "required" },
      { field: "fim", rule: "required" },
      { field: "inicio", rule: "date" },
      { field: "fim", rule: "date" }
    ]
  };

  catalog["Agenda.Criar"] = {
    handler: Agenda_Action_Criar_,
    requiresAuth: false, // 🔓 DEV
    roles: [],
    requiresLock: true,
    idempotent: false,
    validations: []
  };

  catalog["Agenda.Atualizar"] = {
    handler: Agenda_Action_Atualizar_,
    requiresAuth: false, // 🔓 DEV
    roles: [],
    requiresLock: true,
    idempotent: false,
    validations: [
      { field: "idAgenda", rule: "required" }
    ]
  };

  catalog["Agenda.Cancelar"] = {
    handler: Agenda_Action_Cancelar_,
    requiresAuth: false, // 🔓 DEV
    roles: [],
    requiresLock: true,
    idempotent: false,
    validations: [
      { field: "idAgenda", rule: "required" }
    ]
  };

  // ============================================================
  // LEGACY ROUTERS (mantidos)
  // ============================================================

  _tryRegisterLegacyAdapter_(catalog, "Evolucao", "handleEvolucaoAction");
  _tryRegisterLegacyAdapter_(catalog, "Receita", "handleReceitaAction");
  _tryRegisterLegacyAdapter_(catalog, "Prontuario", "handleProntuarioAction");
  _tryRegisterLegacyAdapter_(catalog, "Exames", "handleExamesAction");

  return catalog;
}

// ============================================================
// META handlers
// ============================================================

function Meta_Ping_(ctx, payload) {
  return {
    ok: true,
    api: "PRONTIO",
    version: (ctx && ctx.apiVersion) ? ctx.apiVersion : (typeof PRONTIO_API_VERSION !== "undefined" ? PRONTIO_API_VERSION : null),
    env: (ctx && ctx.env) ? ctx.env : (typeof PRONTIO_ENV !== "undefined" ? PRONTIO_ENV : null),
    time: new Date().toISOString(),
    requestId: ctx ? ctx.requestId : null
  };
}

function Meta_ListActions_(ctx, payload) {
  var list = Registry_listActions_();
  return {
    actions: list,
    count: list.length,
    requestId: ctx ? ctx.requestId : null
  };
}

function Meta_DbStatus_(ctx, payload) {
  if (typeof Migrations_getDbStatus_ !== "function") {
    return { ok: false, error: "Migrations_getDbStatus_ não encontrado.", requestId: ctx ? ctx.requestId : null };
  }
  return { requestId: ctx ? ctx.requestId : null, status: Migrations_getDbStatus_() };
}

function Meta_BootstrapDb_(ctx, payload) {
  if (typeof Migrations_bootstrap_ !== "function") {
    return {
      ok: false,
      error: "Migrations_bootstrap_ não encontrado. Verifique se Migrations.gs está no projeto.",
      requestId: ctx ? ctx.requestId : null
    };
  }
  var result = Migrations_bootstrap_();
  return { ok: true, requestId: ctx ? ctx.requestId : null, result: result };
}

// Meta_HealthCheck_ está em Health.gs

// ============================================================
// Legacy adapter support
// ============================================================

function _tryRegisterLegacyAdapter_(catalog, prefixTitle, handlerFnName) {
  try {
    // Captura referência de função no escopo global do script.
    // Evita depender de "this" (pode variar conforme chamada no Apps Script).
    var fn = (typeof globalThis !== "undefined" && globalThis[handlerFnName]) ? globalThis[handlerFnName] : this[handlerFnName];
    if (typeof fn !== "function") return;

    var actionName = prefixTitle + "._LegacyRouter";

    catalog[actionName] = {
      handler: function (ctx, payload) {
        var action = ctx && ctx.action ? ctx.action : actionName;
        return fn(action, payload);
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
