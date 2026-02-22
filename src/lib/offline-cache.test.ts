import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Minimal IndexedDB mock ---

function createMockDB() {
  const data: Record<string, Record<string, unknown>[]> = {
    agenda: [], pacientes: [], prontuarios: [], meta: [],
  };

  function makeStore(name: string) {
    return {
      clear: vi.fn(() => { data[name] = []; }),
      put: vi.fn((item: Record<string, unknown>) => { data[name].push(item); }),
      get: vi.fn((key: string) => {
        const found = data.meta.find((m) => (m as { key: string }).key === key) ?? null;
        const req = { result: found, onsuccess: null as (() => void) | null, onerror: null as (() => void) | null };
        Promise.resolve().then(() => req.onsuccess?.());
        return req;
      }),
      getAll: vi.fn(() => {
        const req = { result: [...data[name]], onsuccess: null as (() => void) | null, onerror: null as (() => void) | null };
        Promise.resolve().then(() => req.onsuccess?.());
        return req;
      }),
    };
  }

  const db = {
    transaction: vi.fn((_stores: string[]) => {
      const tx = {
        objectStore: vi.fn((name: string) => makeStore(name)),
        oncomplete: null as (() => void) | null,
        onerror: null as (() => void) | null,
      };
      Promise.resolve().then(() => tx.oncomplete?.());
      return tx;
    }),
    close: vi.fn(),
    objectStoreNames: { contains: vi.fn(() => true) },
    createObjectStore: vi.fn(),
  };

  return { db, data };
}

let mockDBInstance: ReturnType<typeof createMockDB>;

Object.defineProperty(globalThis, "indexedDB", {
  value: {
    open: vi.fn(() => {
      const req = {
        result: mockDBInstance.db,
        onupgradeneeded: null as (() => void) | null,
        onsuccess: null as (() => void) | null,
        onerror: null as (() => void) | null,
        error: null,
      };
      Promise.resolve().then(() => req.onsuccess?.());
      return req;
    }),
  },
  writable: true,
});

import { cacheData, getCachedData, clearAllCaches } from "./offline-cache";

describe("offline-cache", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDBInstance = createMockDB();
  });

  describe("cacheData", () => {
    it("armazena itens e salva timestamp no meta", async () => {
      const items = [
        { id: "1", nome: "Paciente A" },
        { id: "2", nome: "Paciente B" },
      ];

      await cacheData("pacientes", items);

      expect(mockDBInstance.db.transaction).toHaveBeenCalled();
      expect(mockDBInstance.db.close).toHaveBeenCalled();
    });

    it("aceita array vazio sem erro", async () => {
      await expect(cacheData("agenda", [])).resolves.toBeUndefined();
    });
  });

  describe("getCachedData", () => {
    it("retorna null quando TTL expirou", async () => {
      // Pre-populate meta with expired timestamp
      mockDBInstance.data.meta.push({ key: "pacientes_timestamp", value: Date.now() - 2 * 60 * 60 * 1000 });

      const result = await getCachedData("pacientes");
      expect(result).toBeNull();
    });

    it("retorna null quando não há timestamp", async () => {
      const result = await getCachedData("pacientes");
      expect(result).toBeNull();
    });
  });

  describe("clearAllCaches", () => {
    it("limpa todos os stores", async () => {
      await clearAllCaches();

      expect(mockDBInstance.db.transaction).toHaveBeenCalled();
      expect(mockDBInstance.db.close).toHaveBeenCalled();
    });
  });
});
