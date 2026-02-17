import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetUser = vi.fn();
const mockGetClinicaAtual = vi.fn();
const mockGetMedicoId = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      auth: { getUser: () => mockGetUser() },
      from: (table: string) => mockFrom(table),
    }),
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn().mockReturnValue({ success: true, remaining: 4, resetIn: 3600000 }),
}));

vi.mock("@/lib/clinica", () => ({
  getClinicaAtual: () => mockGetClinicaAtual(),
  getMedicoId: () => mockGetMedicoId(),
  isGestor: (papel: string) => papel === "superadmin" || papel === "gestor",
}));

import { GET } from "./route";

function makeSelectChain(data: unknown[] | null, error: unknown = null) {
  const result = { data, error };
  // Thenable chain: supports both .select().eq() and direct .select() (await)
  const chain: Record<string, unknown> = {
    eq: () => chain,
    then: (resolve: (v: unknown) => void) => Promise.resolve(result).then(resolve),
    catch: () => Promise.resolve(result),
  };
  return { select: () => chain };
}

describe("GET /api/backup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna 401 quando não autenticado", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await GET();
    const body = JSON.parse(await (res as unknown as Response).text());
    expect(body.error).toBe("Não autorizado.");
  });

  it("retorna 403 quando clínica não encontrada", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u-1", email: "test@test.com" } } });
    mockGetClinicaAtual.mockResolvedValue(null);
    const res = await GET();
    const body = JSON.parse(await (res as unknown as Response).text());
    expect(body.error).toBe("Clínica não encontrada.");
  });

  it("retorna 403 quando papel não é gestor", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u-1", email: "test@test.com" } } });
    mockGetClinicaAtual.mockResolvedValue({
      clinicaId: "c-1",
      clinicaNome: "Clínica Teste",
      papel: "secretaria",
      userId: "u-1",
    });
    const res = await GET();
    const body = JSON.parse(await (res as unknown as Response).text());
    expect(body.error).toBe("Sem permissão para exportar dados.");
  });

  it("retorna 403 quando médico não encontrado", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u-1", email: "test@test.com" } } });
    mockGetClinicaAtual.mockResolvedValue({
      clinicaId: "c-1",
      clinicaNome: "Clínica Teste",
      papel: "gestor",
      userId: "u-1",
    });
    mockGetMedicoId.mockRejectedValue(new Error("Médico não encontrado"));
    const res = await GET();
    const body = JSON.parse(await (res as unknown as Response).text());
    expect(body.error).toBe("Médico não encontrado.");
  });

  it("exporta dados filtrados por clínica e médico", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u-1", email: "test@test.com" } } });
    mockGetClinicaAtual.mockResolvedValue({
      clinicaId: "c-1",
      clinicaNome: "Clínica Teste",
      papel: "gestor",
      userId: "u-1",
    });
    mockGetMedicoId.mockResolvedValue("u-1");

    mockFrom.mockImplementation((table: string) => {
      const data = [{ id: `${table}-1`, nome: "Item 1" }];
      return makeSelectChain(data);
    });

    const res = await GET();
    const body = JSON.parse(await (res as unknown as Response).text());

    expect(body.version).toBe("1.0");
    expect(body.exported_by).toBe("test@test.com");
    expect(body.clinica).toBe("Clínica Teste");
    expect(body.tables.pacientes).toHaveLength(1);
    expect(body.tables.agendamentos).toHaveLength(1);
    expect(body.tables.prontuarios).toHaveLength(1);
    expect(body.tables.transacoes).toHaveLength(1);
    expect(body.tables.configuracoes).toHaveLength(1);
    expect(body.tables.receitas).toHaveLength(1);
    expect(body.tables.solicitacoes_exames).toHaveLength(1);
    expect(body.tables.horarios_profissional).toHaveLength(1);
    expect(body.tables.medicamentos).toHaveLength(1);
    expect(body.tables.catalogo_exames).toHaveLength(1);
    expect(body.errors).toBeUndefined();

    // Verify medico_id tables were called
    expect(mockFrom).toHaveBeenCalledWith("pacientes");
    expect(mockFrom).toHaveBeenCalledWith("prontuarios");
    expect(mockFrom).toHaveBeenCalledWith("receitas");
    expect(mockFrom).toHaveBeenCalledWith("solicitacoes_exames");
    // Verify clinica_id tables were called
    expect(mockFrom).toHaveBeenCalledWith("agendamentos");
    expect(mockFrom).toHaveBeenCalledWith("transacoes");
    expect(mockFrom).toHaveBeenCalledWith("configuracoes");
    expect(mockFrom).toHaveBeenCalledWith("horarios_profissional");
    // Verify global tables were called
    expect(mockFrom).toHaveBeenCalledWith("medicamentos");
    expect(mockFrom).toHaveBeenCalledWith("catalogo_exames");
  });

  it("inclui erros quando tabela falha", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u-1", email: "test@test.com" } } });
    mockGetClinicaAtual.mockResolvedValue({
      clinicaId: "c-1",
      clinicaNome: "Clínica Teste",
      papel: "gestor",
      userId: "u-1",
    });
    mockGetMedicoId.mockResolvedValue("u-1");

    mockFrom.mockImplementation((table: string) => {
      if (table === "pacientes") {
        return makeSelectChain(null, { message: "permission denied" });
      }
      return makeSelectChain([]);
    });

    const res = await GET();
    const body = JSON.parse(await (res as unknown as Response).text());

    expect(body.errors).toHaveLength(1);
    expect(body.errors[0]).toContain("pacientes");
    expect(body.errors[0]).toContain("Tente novamente");
  });

  it("retorna Content-Disposition com filename de backup", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u-1", email: "test@test.com" } } });
    mockGetClinicaAtual.mockResolvedValue({
      clinicaId: "c-1",
      clinicaNome: "Clínica Teste",
      papel: "gestor",
      userId: "u-1",
    });
    mockGetMedicoId.mockResolvedValue("u-1");
    mockFrom.mockImplementation(() => makeSelectChain([]));

    const res = await GET();
    const disposition = (res as unknown as Response).headers.get("Content-Disposition");
    expect(disposition).toContain("prontio-backup-");
    expect(disposition).toContain(".json");
  });
});
