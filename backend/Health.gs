/**
 * ============================================================
 * PRONTIO - Health.gs (FASE 6)
 * ============================================================
 * - Meta.HealthCheck (tempo, acesso ao sheets, versão do DB, latência aproximada)
 * - NÃO expõe detalhes de abas/colunas ao front; apenas status.
 */

var HEALTH_CACHE_KEY = "health:check";
var HEALTH_CACHE_TTL_SECONDS = 10;

/**
 * Handler da action Meta.HealthCheck
 */
function Meta_HealthCheck_(ctx, payload) {
  payload = payload || {};
  var started = new Date();

  // Cache curto para evitar chamadas repetidas em alta frequência
  if (typeof Cache_getJson_ === "function" && typeof Cache_setJson_ === "function") {
    var cached = Cache_getJson_(HEALTH_CACHE_KEY);
    if (cached && cached.generatedAt && !payload.force) {
      // devolve cache + requestId atual
      cached.requestId = ctx.requestId;
      return cached;
    }
  }

  var now = new Date();
  var out = {
    ok: true,
    requestId: ctx.requestId,
    generatedAt: now.toISOString(),
    env: (typeof PRONTIO_ENV !== "undefined") ? PRONTIO_ENV : null,
    apiVersion: (typeof PRONTIO_API_VERSION !== "undefined") ? PRONTIO_API_VERSION : null,
    timezone: (typeof Config_get_ === "function") ? Config_get_("timezone") : (Session.getScriptTimeZone ? Session.getScriptTimeZone() : null),

    checks: {
      clock: { ok: true, serverTime: now.toISOString() },
      db: { ok: false },
      config: { ok: true }
    },

    timings: {
      totalMs: null
    }
  };

  // DB Status (depende de Migrations)
  try {
    if (typeof Migrations_getDbStatus_ === "function") {
      var status = Migrations_getDbStatus_();
      out.checks.db = {
        ok: !!status.ok,
        latestVersion: status.latestVersion,
        currentVersion: status.currentVersion,
        needsBootstrap: status.needsBootstrap,
        needsMigration: status.needsMigration
      };

      // Se não estiver ok, o health geral fica ok=false (mas a API ainda responde)
      if (!status.ok) out.ok = false;
    } else {
      out.checks.db = { ok: false, reason: "Migrations_getDbStatus_ não disponível." };
      out.ok = false;
    }
  } catch (e) {
    out.checks.db = { ok: false, error: String(e) };
    out.ok = false;
  }

  // Config check mínimo
  try {
    if (typeof Config_getAgendaParams_ === "function") {
      var ap = Config_getAgendaParams_();
      out.checks.config = {
        ok: true,
        agenda: {
          duracaoPadraoMin: ap.duracaoPadraoMin,
          slotMin: ap.slotMin,
          permiteSobreposicao: ap.permiteSobreposicao
        }
      };
    } else if (typeof Config_getAll_ === "function") {
      out.checks.config = { ok: true, hasConfig: true };
    } else {
      out.checks.config = { ok: true, hasConfig: false, note: "Config.gs não disponível (ou incompleto)." };
    }
  } catch (e2) {
    out.checks.config = { ok: false, error: String(e2) };
    out.ok = false;
  }

  out.timings.totalMs = (new Date().getTime() - started.getTime());

  // Cache curto
  try {
    if (typeof Cache_setJson_ === "function") {
      Cache_setJson_(HEALTH_CACHE_KEY, out, HEALTH_CACHE_TTL_SECONDS);
    }
  } catch (_) {}

  return out;
}
