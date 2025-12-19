/**
 * ============================================================
 * PRONTIO - Auth.gs (FASE 5)
 * ============================================================
 * - Identificar usuário (inicialmente simples, via token no payload)
 * - Roles (admin/medico/recepcao)
 * - Integração com Registry (permissões por action)
 *
 * Regras:
 * - Não depende de estrutura de Sheets (isso pode ser migrado depois).
 * - Compatível com o auth legado (Auth_Login_ já existente) que grava no CacheService:
 *     CacheService.getScriptCache().put(AUTH_CACHE_PREFIX + token, JSON.stringify(user), TTL)
 *
 * Contrato:
 * - Token vem em payload.token (por enquanto).
 * - user.perfil (string) define role principal.
 */

var AUTH_CACHE_PREFIX = typeof AUTH_CACHE_PREFIX !== "undefined" ? AUTH_CACHE_PREFIX : "PRONTIO_AUTH_";
var AUTH_TTL_SECONDS = typeof AUTH_TTL_SECONDS !== "undefined" ? AUTH_TTL_SECONDS : (60 * 60 * 10);

var AUTH_ROLES = {
  admin: "admin",
  medico: "medico",
  recepcao: "recepcao"
};

/**
 * Retorna user context (ou null) a partir do payload.
 * Preferência:
 * 1) payload.user (se já veio resolvido por algum adapter)
 * 2) payload.token => CacheService (legado)
 */
function Auth_getUserContext_(payload) {
  payload = payload || {};

  // 1) já veio usuário no payload (não confiar em produção; útil em DEV/testes)
  if (payload.user && typeof payload.user === "object") {
    return _authNormalizeUser_(payload.user);
  }

  // 2) token -> cache
  var token = Auth_getTokenFromPayload_(payload);
  if (!token) return null;

  var raw = CacheService.getScriptCache().get(AUTH_CACHE_PREFIX + token);
  if (!raw) return null;

  try {
    var user = JSON.parse(raw);
    return _authNormalizeUser_(user);
  } catch (e) {
    return null;
  }
}

/**
 * Extrai token do payload (padrão atual do seu projeto).
 */
function Auth_getTokenFromPayload_(payload) {
  payload = payload || {};
  var token = (payload.token || "").toString().trim();
  return token || null;
}

/**
 * Enforce auth (retorna response padrão em caso de falha).
 */
function Auth_requireAuth_(ctx, payload) {
  var user = Auth_getUserContext_(payload);
  if (!user) {
    return Errors.response(ctx, Errors.CODES.PERMISSION_DENIED, "Login obrigatório.", { reason: "AUTH_REQUIRED" });
  }
  ctx.user = user;
  return Errors.ok(ctx, { ok: true });
}

/**
 * Enforce roles (ctx.user precisa existir).
 * roles: array de strings (ex.: ["admin","medico"])
 */
function Auth_requireRoles_(ctx, roles) {
  roles = roles || [];
  if (!roles.length) return Errors.ok(ctx, { ok: true });

  var user = ctx && ctx.user ? ctx.user : null;
  if (!user) {
    return Errors.response(ctx, Errors.CODES.PERMISSION_DENIED, "Login obrigatório.", { reason: "AUTH_REQUIRED" });
  }

  var userRoles = Auth_rolesForUser_(user);
  var allowed = roles.some(function (r) { return userRoles.indexOf(String(r)) >= 0; });

  if (!allowed) {
    return Errors.response(ctx, Errors.CODES.PERMISSION_DENIED, "Sem permissão para esta ação.", {
      requiredRoles: roles,
      userRoles: userRoles
    });
  }

  return Errors.ok(ctx, { ok: true });
}

/**
 * Retorna roles efetivas de um usuário.
 * - Perfil principal em user.perfil (string)
 * - admin inclui medico e recepcao por conveniência (ajustável)
 */
function Auth_rolesForUser_(user) {
  user = user || {};
  var perfil = (user.perfil || user.role || "").toString().trim().toLowerCase();

  if (!perfil) return [];

  if (perfil === AUTH_ROLES.admin) return [AUTH_ROLES.admin, AUTH_ROLES.medico, AUTH_ROLES.recepcao];
  if (perfil === AUTH_ROLES.medico) return [AUTH_ROLES.medico];
  if (perfil === AUTH_ROLES.recepcao) return [AUTH_ROLES.recepcao];

  // fallback: aceita qualquer string como role única
  return [perfil];
}

/**
 * (Opcional) cria sessão (token) para um user, compatível com legado.
 * Útil caso você queira migrar para Auth.gs no futuro sem depender de Auth_Login_ legado.
 */
function Auth_createSession_(user) {
  user = _authNormalizeUser_(user || {});
  var token = Utilities.getUuid();
  CacheService.getScriptCache().put(AUTH_CACHE_PREFIX + token, JSON.stringify(user), AUTH_TTL_SECONDS);
  return { token: token, user: user };
}

/**
 * (Opcional) encerra sessão.
 */
function Auth_destroySession_(token) {
  token = (token || "").toString().trim();
  if (token) CacheService.getScriptCache().remove(AUTH_CACHE_PREFIX + token);
  return { ok: true };
}

// ======================
// Internals
// ======================

function _authNormalizeUser_(user) {
  if (!user || typeof user !== "object") return null;

  // Mantém campos principais usados em audit/permissão
  return {
    id: user.id !== undefined ? user.id : (user.ID_Usuario || user.idUsuario || null),
    nome: user.nome !== undefined ? user.nome : (user.Nome || null),
    login: user.login !== undefined ? user.login : (user.Login || null),
    email: user.email !== undefined ? user.email : (user.Email || null),
    perfil: (user.perfil !== undefined ? user.perfil : (user.Perfil || user.role || "usuario"))
  };
}
