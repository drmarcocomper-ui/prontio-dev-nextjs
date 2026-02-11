import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetUser = vi.fn();

// Track per-table behavior
let selectCountResult: { count: number; error: null };
let insertResults: Record<string, { data: unknown; error: unknown }>;
let deleteError: unknown;

function createChain(table: string) {
  return {
    select: (...args: unknown[]) => {
      // Check if it's a count query (head: true)
      const opts = args[1] as { count?: string; head?: boolean } | undefined;
      if (opts?.head) {
        return Promise.resolve({ ...selectCountResult, data: [], error: null });
      }
      // It's an insert().select() chain result
      const result = insertResults[table] ?? {
        data: Array.from({ length: 8 }, (_, i) => ({ id: `${table}-${i}`, nome: `Item ${i}` })),
        error: null,
      };
      return Promise.resolve(result);
    },
    insert: (data: unknown) => {
      // pacientes uses .insert().select(), others just .insert()
      const errorResult = insertResults[table];
      if (table === "pacientes") {
        return {
          select: () => {
            const result = errorResult ?? {
              data: Array.isArray(data)
                ? data.map((_: unknown, i: number) => ({ id: `p-${i}`, nome: `P${i}` }))
                : [],
              error: null,
            };
            return Promise.resolve(result);
          },
        };
      }
      // For agendamentos, prontuarios, transacoes: insert returns { error } directly
      return Promise.resolve({ error: errorResult?.error ?? null });
    },
    delete: () => ({
      gte: () => Promise.resolve({ error: deleteError }),
    }),
  };
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      auth: { getUser: () => mockGetUser() },
      from: (table: string) => createChain(table),
    }),
}));

vi.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      body,
      status: init?.status ?? 200,
    }),
  },
}));

import { GET } from "./route";

describe("GET /api/seed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectCountResult = { count: 0, error: null };
    insertResults = {};
    deleteError = null;
  });

  it("retorna 401 quando não autenticado", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const request = new Request("http://localhost:3000/api/seed");
    const response = await GET(request);
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Não autenticado" });
  });

  it("retorna mensagem quando já tem dados e force=false", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u-1" } } });
    selectCountResult = { count: 5, error: null };
    const request = new Request("http://localhost:3000/api/seed");
    const response = await GET(request);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: expect.stringContaining("Banco já possui 5 pacientes"),
    });
  });

  it("executa seed sem delete quando count=0 e force=false", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u-1" } } });
    selectCountResult = { count: 0, error: null };
    const request = new Request("http://localhost:3000/api/seed");
    const response = await GET(request);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: "Seed concluído com sucesso!",
      totais: expect.objectContaining({
        pacientes: 8,
        agendamentos: 16,
        prontuarios: 6,
        transacoes: 14,
      }),
    });
  });

  it("executa seed com force=true deletando dados existentes", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u-1" } } });
    selectCountResult = { count: 10, error: null };
    const request = new Request("http://localhost:3000/api/seed?force=true");
    const response = await GET(request);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: "Seed concluído com sucesso!",
      totais: expect.objectContaining({
        pacientes: 8,
      }),
    });
  });

  it("retorna 500 quando insert de pacientes falha", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u-1" } } });
    insertResults = {
      pacientes: { data: null, error: { message: "duplicate key" } },
    };
    const request = new Request("http://localhost:3000/api/seed");
    const response = await GET(request);
    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: "Erro ao inserir pacientes",
      detail: "duplicate key",
    });
  });

  it("retorna 500 quando insert de agendamentos falha", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u-1" } } });
    insertResults = {
      agendamentos: { data: null, error: { message: "fk violation" } },
    };
    const request = new Request("http://localhost:3000/api/seed");
    const response = await GET(request);
    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: "Erro ao inserir agendamentos",
      detail: "fk violation",
    });
  });

  it("retorna 500 quando insert de prontuários falha", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u-1" } } });
    insertResults = {
      prontuarios: { data: null, error: { message: "insert failed" } },
    };
    const request = new Request("http://localhost:3000/api/seed");
    const response = await GET(request);
    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: "Erro ao inserir prontuários",
      detail: "insert failed",
    });
  });

  it("retorna 500 quando insert de transações falha", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u-1" } } });
    insertResults = {
      transacoes: { data: null, error: { message: "transacao error" } },
    };
    const request = new Request("http://localhost:3000/api/seed");
    const response = await GET(request);
    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: "Erro ao inserir transações",
      detail: "transacao error",
    });
  });
});
