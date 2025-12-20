/**
 * ============================================================
 * PRONTIO - Locks.gs (FASE 1)
 * ============================================================
 * Controle centralizado de concorrência.
 *
 * Ajustes mínimos:
 * - Mantém LockService.getScriptLock() (Apps Script é script-wide).
 * - Melhora detalhes do erro (ctx/action/requestId/key) para diagnóstico.
 * - Garante releaseLock em finally.
 */

var LOCK_TIMEOUT_MS = 30000;

/**
 * Executa função protegida por lock.
 * IMPORTANTE:
 * - NÃO usar "throw { }" (padroniza com Error + code/details).
 * - O "key" é usado para diagnóstico e padronização do lockKey (mesmo que o LockService seja único).
 */
function Locks_withLock_(ctx, key, fn) {
  var lock = LockService.getScriptLock();
  var lockKey = "LOCK_" + String(key || "GLOBAL");

  try {
    lock.waitLock(LOCK_TIMEOUT_MS);
    return fn();
  } catch (e) {
    // Em geral, waitLock lança erro quando expira o timeout.
    // Também pode cair aqui se o fn() lançar (nesse caso, rethrow sem mascarar).
    // Vamos diferenciar:
    var msg = String(e && e.message ? e.message : e);

    // Se parece erro de timeout do lock, normaliza como CONFLICT.
    var isLockTimeout = msg.toLowerCase().indexOf("lock") >= 0 && msg.toLowerCase().indexOf("timeout") >= 0;

    if (isLockTimeout) {
      var err = new Error("Recurso em uso. Tente novamente.");
      err.code = "CONFLICT";
      err.details = {
        lockKey: lockKey,
        key: String(key || "GLOBAL"),
        requestId: (ctx && ctx.requestId) ? ctx.requestId : null,
        action: (ctx && ctx.action) ? ctx.action : null,
        cause: msg
      };
      throw err;
    }

    // Se não é timeout, é erro do handler/funcão protegida -> rethrow original
    throw e;
  } finally {
    try {
      lock.releaseLock();
    } catch (_) {}
  }
}
