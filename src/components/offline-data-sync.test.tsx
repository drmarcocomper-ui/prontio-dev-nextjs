import { render } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Mocks ---

const mockCacheData = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/offline-cache", () => ({
  cacheData: (...args: unknown[]) => mockCacheData(...args),
}));

let mockIsOnline = true;
vi.mock("@/hooks/use-online-status", () => ({
  useOnlineStatus: () => mockIsOnline,
}));

// Chain builder: supports .select().eq().order().limit() in any order
function buildChain(resolvedData: unknown[] | null) {
  const chain: Record<string, unknown> = {};
  const resolver = () => Promise.resolve({ data: resolvedData });
  const self = () => new Proxy({}, { get: (_, prop) => {
    if (prop === "then") return resolver().then.bind(resolver());
    return self;
  }});
  // Each method returns a proxy that resolves to { data }
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(_, prop) {
      if (prop === "then") return resolver().then.bind(resolver());
      return (..._args: unknown[]) => new Proxy(chain, handler);
    },
  };
  return new Proxy(chain, handler);
}

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: (table: string) => {
      if (table === "agendamentos") {
        return buildChain([
          { id: "ag-1", data: "2026-02-21", hora_inicio: "08:00", hora_fim: "08:30", status: "agendado", observacoes: null, pacientes: { id: "p-1", nome: "João", telefone: "27999" } },
        ]);
      }
      if (table === "pacientes") {
        return buildChain([
          { id: "p-1", nome: "João", cpf: "123", telefone: "27999", email: "j@t.com", data_nascimento: "1990-01-01" },
        ]);
      }
      if (table === "prontuarios") {
        return buildChain([
          { id: "pr-1", paciente_id: "p-1", data: "2026-02-20", queixa_principal: "Dor", historia_doenca: null, exame_fisico: null, hipotese_diagnostica: null, conduta: null, pacientes: { nome: "João" } },
        ]);
      }
      return buildChain([]);
    },
  }),
}));

import { OfflineDataSync } from "./offline-data-sync";

describe("OfflineDataSync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsOnline = true;
  });

  it("não renderiza nada (retorna null)", () => {
    const { container } = render(<OfflineDataSync />);
    expect(container.innerHTML).toBe("");
  });

  it("sincroniza agenda, pacientes e prontuários quando online", async () => {
    render(<OfflineDataSync />);

    // Aguardar sync assíncrono
    await vi.waitFor(() => {
      expect(mockCacheData).toHaveBeenCalledTimes(3);
    });

    const calls = mockCacheData.mock.calls;
    const storeNames = calls.map((c: unknown[]) => c[0]);
    expect(storeNames).toContain("agenda");
    expect(storeNames).toContain("pacientes");
    expect(storeNames).toContain("prontuarios");
  });

  it("mapeia paciente_nome corretamente na agenda", async () => {
    render(<OfflineDataSync />);

    await vi.waitFor(() => {
      expect(mockCacheData).toHaveBeenCalled();
    });

    const agendaCall = mockCacheData.mock.calls.find((c: unknown[]) => c[0] === "agenda");
    expect(agendaCall).toBeDefined();
    const items = agendaCall![1] as Record<string, unknown>[];
    expect(items[0]).toHaveProperty("paciente_nome", "João");
    expect(items[0]).toHaveProperty("paciente_telefone", "27999");
  });

  it("mapeia paciente_nome corretamente nos prontuários", async () => {
    render(<OfflineDataSync />);

    await vi.waitFor(() => {
      expect(mockCacheData).toHaveBeenCalled();
    });

    const prontuarioCall = mockCacheData.mock.calls.find((c: unknown[]) => c[0] === "prontuarios");
    expect(prontuarioCall).toBeDefined();
    const items = prontuarioCall![1] as Record<string, unknown>[];
    expect(items[0]).toHaveProperty("paciente_nome", "João");
  });

  it("não sincroniza quando offline", async () => {
    mockIsOnline = false;
    render(<OfflineDataSync />);

    await new Promise((r) => setTimeout(r, 100));
    expect(mockCacheData).not.toHaveBeenCalled();
  });

  it("não falha quando query retorna erro", async () => {
    vi.doMock("@/lib/supabase/client", () => ({
      createClient: () => ({
        from: () => buildChain(null),
      }),
    }));

    expect(() => render(<OfflineDataSync />)).not.toThrow();
  });
});
