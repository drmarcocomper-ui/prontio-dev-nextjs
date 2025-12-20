/**
 * ============================================================
 * PRONTIO - Locks.gs (FASE 1)
 * ============================================================
 * Controle centralizado de concorrência.
 */

var LOCK_TIMEOUT_MS = 30000;

/**
 * Executa função protegida por lock.
 * IMPORTANTE:
 * - NÃO usar "throw { }" (padroniza com Error + code/details).
 * - O "key" é usado apenas para diagnóstico (LockService é único no script).
 */
function Locks_withLock_(ctx, key, fn) {
  var lock = LockService.getScriptLock();
  var lockKey = "LOCK_" + String(key || "GLOBAL");

  try {
    lock.waitLock(LOCK_TIMEOUT_MS);
    return fn();
  } catch (e) {
    var err = new Error("Recurso em uso. Tente novamente.");
    err.code = "CONFLICT";
    err.details = { lockKey: lockKey };
    throw err;
  } finally {
    try {
      lock.releaseLock();
    } catch (_) {}
  }
}
