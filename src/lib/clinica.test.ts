import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Mocks ---

const mockGetUser = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockIn = vi.fn();
const mockLimit = vi.fn();
const mockSingle = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}));

const mockCookieGet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({ get: mockCookieGet })),
}));

const mockAdminFrom = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: mockAdminFrom }),
}));

import { isGestor, isProfissional, getClinicasDoUsuario, getClinicaAtual, getMedicoId } from "./clinica";

// --- Helpers ---

function mockUser(id = "user-1") {
  mockGetUser.mockResolvedValue({ data: { user: { id } } });
}

function mockNoUser() {
  mockGetUser.mockResolvedValue({ data: { user: null } });
}

function mockClinicasQuery(data: unknown[] | null) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnValue({ data }),
  };
  mockFrom.mockReturnValue(chain);
  return chain;
}

// --- Tests ---

describe("isGestor", () => {
  it("retorna true para superadmin", () => {
    expect(isGestor("superadmin")).toBe(true);
  });

  it("retorna true para gestor", () => {
    expect(isGestor("gestor")).toBe(true);
  });

  it("retorna false para profissional_saude", () => {
    expect(isGestor("profissional_saude")).toBe(false);
  });

  it("retorna false para financeiro", () => {
    expect(isGestor("financeiro")).toBe(false);
  });

  it("retorna false para secretaria", () => {
    expect(isGestor("secretaria")).toBe(false);
  });
});

describe("isProfissional", () => {
  it("retorna true para superadmin", () => {
    expect(isProfissional("superadmin")).toBe(true);
  });

  it("retorna true para profissional_saude", () => {
    expect(isProfissional("profissional_saude")).toBe(true);
  });

  it("retorna false para gestor", () => {
    expect(isProfissional("gestor")).toBe(false);
  });

  it("retorna false para financeiro", () => {
    expect(isProfissional("financeiro")).toBe(false);
  });

  it("retorna false para secretaria", () => {
    expect(isProfissional("secretaria")).toBe(false);
  });
});

describe("getClinicasDoUsuario", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna lista vazia quando não há usuário autenticado", async () => {
    mockNoUser();
    const result = await getClinicasDoUsuario();
    expect(result).toEqual([]);
  });

  it("retorna lista vazia quando query retorna null", async () => {
    mockUser();
    mockClinicasQuery(null);
    const result = await getClinicasDoUsuario();
    expect(result).toEqual([]);
  });

  it("retorna clínicas mapeadas corretamente", async () => {
    mockUser("user-1");
    mockClinicasQuery([
      { clinica_id: "c-1", papel: "superadmin", clinicas: { id: "c-1", nome: "Clínica A" } },
      { clinica_id: "c-2", papel: "secretaria", clinicas: { id: "c-2", nome: "Clínica B" } },
    ]);
    const result = await getClinicasDoUsuario();
    expect(result).toEqual([
      { id: "c-1", nome: "Clínica A", papel: "superadmin" },
      { id: "c-2", nome: "Clínica B", papel: "secretaria" },
    ]);
  });

  it("filtra por user_id do usuário autenticado", async () => {
    mockUser("user-42");
    const chain = mockClinicasQuery([]);
    await getClinicasDoUsuario();
    expect(chain.eq).toHaveBeenCalledWith("user_id", "user-42");
  });
});

describe("getClinicaAtual", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna null quando não há usuário autenticado", async () => {
    mockNoUser();
    const result = await getClinicaAtual();
    expect(result).toBeNull();
  });

  it("retorna null quando usuário não tem clínicas", async () => {
    mockUser();
    mockClinicasQuery([]);
    const result = await getClinicaAtual();
    expect(result).toBeNull();
  });

  it("usa a clínica do cookie quando disponível", async () => {
    mockUser("user-1");
    mockClinicasQuery([
      { clinica_id: "c-1", papel: "gestor", clinicas: { id: "c-1", nome: "Clínica A" } },
      { clinica_id: "c-2", papel: "superadmin", clinicas: { id: "c-2", nome: "Clínica B" } },
    ]);
    mockCookieGet.mockReturnValue({ value: "c-2" });

    const result = await getClinicaAtual();
    expect(result).toEqual({
      clinicaId: "c-2",
      clinicaNome: "Clínica B",
      papel: "superadmin",
      userId: "user-1",
    });
  });

  it("usa a primeira clínica quando cookie não está definido", async () => {
    mockUser("user-1");
    mockClinicasQuery([
      { clinica_id: "c-1", papel: "gestor", clinicas: { id: "c-1", nome: "Clínica A" } },
    ]);
    mockCookieGet.mockReturnValue(undefined);

    const result = await getClinicaAtual();
    expect(result).toEqual({
      clinicaId: "c-1",
      clinicaNome: "Clínica A",
      papel: "gestor",
      userId: "user-1",
    });
  });

  it("usa a primeira clínica quando cookie aponta para clínica inexistente", async () => {
    mockUser("user-1");
    mockClinicasQuery([
      { clinica_id: "c-1", papel: "gestor", clinicas: { id: "c-1", nome: "Clínica A" } },
    ]);
    mockCookieGet.mockReturnValue({ value: "clinica-inexistente" });

    const result = await getClinicaAtual();
    expect(result).toEqual({
      clinicaId: "c-1",
      clinicaNome: "Clínica A",
      papel: "gestor",
      userId: "user-1",
    });
  });
});

describe("getMedicoId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lança erro quando não há contexto de clínica", async () => {
    mockNoUser();
    await expect(getMedicoId()).rejects.toThrow("Contexto de clínica não encontrado.");
  });

  it("retorna userId do próprio usuário quando é superadmin", async () => {
    mockUser("user-1");
    mockClinicasQuery([
      { clinica_id: "c-1", papel: "superadmin", clinicas: { id: "c-1", nome: "Clínica A" } },
    ]);
    mockCookieGet.mockReturnValue(undefined);

    const result = await getMedicoId();
    expect(result).toBe("user-1");
  });

  it("retorna userId do próprio usuário quando é profissional_saude", async () => {
    mockUser("user-2");
    mockClinicasQuery([
      { clinica_id: "c-1", papel: "profissional_saude", clinicas: { id: "c-1", nome: "Clínica A" } },
    ]);
    mockCookieGet.mockReturnValue(undefined);

    const result = await getMedicoId();
    expect(result).toBe("user-2");
  });

  it("busca médico da clínica via admin client para secretaria", async () => {
    mockUser("user-sec");
    mockClinicasQuery([
      { clinica_id: "c-1", papel: "secretaria", clinicas: { id: "c-1", nome: "Clínica A" } },
    ]);
    mockCookieGet.mockReturnValue(undefined);

    const adminChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { user_id: "medico-1" } }),
    };
    mockAdminFrom.mockReturnValue(adminChain);

    const result = await getMedicoId();
    expect(result).toBe("medico-1");
    expect(mockAdminFrom).toHaveBeenCalledWith("usuarios_clinicas");
  });

  it("lança erro quando não encontra médico para a clínica", async () => {
    mockUser("user-sec");
    mockClinicasQuery([
      { clinica_id: "c-1", papel: "secretaria", clinicas: { id: "c-1", nome: "Clínica A" } },
    ]);
    mockCookieGet.mockReturnValue(undefined);

    const adminChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null }),
    };
    mockAdminFrom.mockReturnValue(adminChain);

    await expect(getMedicoId()).rejects.toThrow("Médico não encontrado para esta clínica.");
  });
});
