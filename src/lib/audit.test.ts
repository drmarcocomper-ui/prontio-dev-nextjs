import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Mocks ---

const mockInsert = vi.fn();
const mockFrom = vi.fn(() => ({ insert: mockInsert }));

const mockCreateClient = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}));

import { logAuditEvent } from "./audit";

// --- Tests ---

describe("logAuditEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateClient.mockResolvedValue({ from: mockFrom });
    mockInsert.mockResolvedValue({ error: null });
  });

  it("insere registro com todos os campos", async () => {
    await logAuditEvent({
      userId: "user-1",
      clinicaId: "clinica-1",
      acao: "criar",
      recurso: "paciente",
      recursoId: "pac-123",
      detalhes: { nome: "João" },
    });

    expect(mockFrom).toHaveBeenCalledWith("audit_logs");
    expect(mockInsert).toHaveBeenCalledWith({
      user_id: "user-1",
      clinica_id: "clinica-1",
      acao: "criar",
      recurso: "paciente",
      recurso_id: "pac-123",
      detalhes: { nome: "João" },
    });
  });

  it("insere registro apenas com campos obrigatórios", async () => {
    await logAuditEvent({
      userId: "user-2",
      acao: "listar",
      recurso: "agenda",
    });

    expect(mockFrom).toHaveBeenCalledWith("audit_logs");
    expect(mockInsert).toHaveBeenCalledWith({
      user_id: "user-2",
      clinica_id: null,
      acao: "listar",
      recurso: "agenda",
      recurso_id: null,
      detalhes: null,
    });
  });

  it("não lança erro quando insert falha", async () => {
    mockInsert.mockRejectedValue(new Error("DB error"));

    await expect(
      logAuditEvent({
        userId: "user-1",
        acao: "criar",
        recurso: "paciente",
      })
    ).resolves.toBeUndefined();
  });

  it("não lança erro quando createClient falha", async () => {
    mockCreateClient.mockRejectedValue(new Error("Auth error"));

    await expect(
      logAuditEvent({
        userId: "user-1",
        acao: "criar",
        recurso: "paciente",
      })
    ).resolves.toBeUndefined();
  });

  it("mapeia campos corretamente para snake_case", async () => {
    await logAuditEvent({
      userId: "u-abc",
      clinicaId: "c-xyz",
      acao: "excluir",
      recurso: "prontuario",
      recursoId: "pront-99",
      detalhes: { motivo: "duplicado" },
    });

    const insertArg = mockInsert.mock.calls[0][0];
    expect(insertArg).toHaveProperty("user_id", "u-abc");
    expect(insertArg).toHaveProperty("clinica_id", "c-xyz");
    expect(insertArg).toHaveProperty("acao", "excluir");
    expect(insertArg).toHaveProperty("recurso", "prontuario");
    expect(insertArg).toHaveProperty("recurso_id", "pront-99");
    expect(insertArg).toHaveProperty("detalhes", { motivo: "duplicado" });
  });
});
