/**
 * Rate limiter em memória baseado em sliding window.
 * Bloqueia após `maxAttempts` tentativas dentro de `windowMs`.
 */

interface RateLimitEntry {
  attempts: number;
  firstAttempt: number;
}

const store = new Map<string, RateLimitEntry>();

// Limpa entradas expiradas a cada 5 minutos
const CLEANUP_INTERVAL = 5 * 60 * 1000;

let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function ensureCleanup(windowMs: number) {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now - entry.firstAttempt > windowMs) {
        store.delete(key);
      }
    }
  }, CLEANUP_INTERVAL);
  // Não impede o processo de encerrar
  if (cleanupTimer && typeof cleanupTimer === "object" && "unref" in cleanupTimer) {
    cleanupTimer.unref();
  }
}

export function rateLimit({
  key,
  maxAttempts = 5,
  windowMs = 15 * 60 * 1000, // 15 minutos
}: {
  key: string;
  maxAttempts?: number;
  windowMs?: number;
}): { success: boolean; remaining: number; resetIn: number } {
  ensureCleanup(windowMs);

  const now = Date.now();
  const entry = store.get(key);

  // Sem registro ou janela expirou — permite
  if (!entry || now - entry.firstAttempt > windowMs) {
    store.set(key, { attempts: 1, firstAttempt: now });
    return { success: true, remaining: maxAttempts - 1, resetIn: windowMs };
  }

  // Dentro da janela — incrementa
  entry.attempts++;

  if (entry.attempts > maxAttempts) {
    const resetIn = windowMs - (now - entry.firstAttempt);
    return { success: false, remaining: 0, resetIn };
  }

  return {
    success: true,
    remaining: maxAttempts - entry.attempts,
    resetIn: windowMs - (now - entry.firstAttempt),
  };
}
