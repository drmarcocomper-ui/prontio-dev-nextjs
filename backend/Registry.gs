/**
 * ============================================================
 * PRONTIO - Registry.gs
 * ============================================================
 * Responsabilidade:
 * - Registrar actions disponíveis na API.
 * - Definir metadados: requiresAuth, roles, validations, locks.
 *
 * Contrato:
 * - Api.gs chama: Registry_getAction_(action)
 * - Retorna:
 *   {
 *     action: string,
 *     handler: function(ctx, payload) -> any,
 *     requiresAuth: boolean,
 *     roles: string[],
 *     validations: array,
 *     requiresLock: boolean,
 *     lockKey: string|null
 *   }
 */

var REGISTRY_ACTIONS = null;

function Registry_getAction_(action) {
  action = String(action || "").trim();
  if (!action) return null;

  if (!REGISTRY_ACTIONS) {
    REGISTRY_ACTIONS = _Registry_build_();
  }

  return REGISTRY_ACTIONS[action] || null;
}

function _Registry_build_() {
  /**
   * Dica: mantenha aqui SOMENTE o mapeamento.
   * A lógica fica nos módulos (Auth.gs, Usuarios.gs, etc).
   */
  var map = {};

  // =========================
  // DIAGNÓSTICO (DEV)
  // =========================
  // ✅ Use esta action para confirmar quais actions o backend *publicado* conhece.
  // Se ela não listar "Auth_Login", então você NÃO publicou a versão certa
  // ou está chamando outra URL/projeto.
  map["Registry_ListActions"] = {
    action: "Registry_ListActions",
    handler: Registry_ListActions,
    requiresAuth: false, // DEV: deixe false para diagnóstico rápido
    roles: [],
    validations: [],
    requiresLock: false,
    lockKey: null
  };

  // =========================
  // AUTH
  // =========================
  map["Auth_Login"] = {
    action: "Auth_Login",
    handler: Auth_Login,
    requiresAuth: false,
    roles: [],
    validations: [],
    requiresLock: true,
    lockKey: "Auth_Login"
  };

  map["Auth_Me"] = {
    action: "Auth_Me",
    handler: Auth_Me,
    requiresAuth: true,
    roles: [],
    validations: [],
    requiresLock: false,
    lockKey: null
  };

  map["Auth_Logout"] = {
    action: "Auth_Logout",
    handler: Auth_Logout,
    requiresAuth: true,
    roles: [],
    validations: [],
    requiresLock: false,
    lockKey: null
  };

  // =========================
  // USUÁRIOS (admin)
  // =========================
  map["Usuarios_Listar"] = {
    action: "Usuarios_Listar",
    handler: function (ctx, payload) { return handleUsuariosAction("Usuarios_Listar", payload); },
    requiresAuth: true,
    roles: ["admin"],
    validations: [],
    requiresLock: false,
    lockKey: null
  };

  map["Usuarios_Criar"] = {
    action: "Usuarios_Criar",
    handler: function (ctx, payload) { return handleUsuariosAction("Usuarios_Criar", payload); },
    requiresAuth: true,
    roles: ["admin"],
    validations: [],
    requiresLock: true,
    lockKey: "Usuarios_Criar"
  };

  map["Usuarios_Atualizar"] = {
    action: "Usuarios_Atualizar",
    handler: function (ctx, payload) { return handleUsuariosAction("Usuarios_Atualizar", payload); },
    requiresAuth: true,
    roles: ["admin"],
    validations: [],
    requiresLock: true,
    lockKey: "Usuarios_Atualizar"
  };

  return map;
}

/**
 * ============================================================
 * Handler de diagnóstico: retorna as actions registradas.
 * ============================================================
 */
function Registry_ListActions(ctx, payload) {
  // garante que REGISTRY_ACTIONS existe
  if (!REGISTRY_ACTIONS) REGISTRY_ACTIONS = _Registry_build_();

  var keys = Object.keys(REGISTRY_ACTIONS || {}).sort();
  return {
    count: keys.length,
    actions: keys,
    hasAuthLogin: keys.indexOf("Auth_Login") >= 0
  };
}
