/**
 * ============================================================
 * PRONTIO - Locks.gs (FASE 1)
 * ============================================================
 * Controle centralizado de concorrência.
 */

var LOCK_TIMEOUT_MS = 30000;

/**
 * Executa função protegida por lock
 */
function Locks_withLock_(ctx, key, fn) {
  var lock = LockService.getScriptLock();
  var lockKey = "LOCK_" + String(key || "GLOBAL");

  try {
    lock.waitLock(LOCK_TIMEOUT_MS);
    return fn();
  } catch (e) {
    throw {
      code: "CONFLICT",
      message: "Recurso em uso. Tente novamente.",
      details: { lockKey: lockKey }
    };
  } finally {
    try {
      lock.releaseLock();
    } catch (_) {}
  }
}
