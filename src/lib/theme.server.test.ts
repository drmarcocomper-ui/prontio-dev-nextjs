import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSingle = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => mockSingle(),
          }),
        }),
      }),
    }),
}));

import { getTheme } from "./theme.server";

describe("getTheme", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna o tema salvo quando válido", async () => {
    mockSingle.mockResolvedValue({ data: { valor: "violet" } });
    const theme = await getTheme();
    expect(theme).toBe("violet");
  });

  it("retorna DEFAULT_THEME quando valor não está em VALID_THEMES", async () => {
    mockSingle.mockResolvedValue({ data: { valor: "invalido" } });
    const theme = await getTheme();
    expect(theme).toBe("sky");
  });

  it("retorna DEFAULT_THEME quando data é null", async () => {
    mockSingle.mockResolvedValue({ data: null });
    const theme = await getTheme();
    expect(theme).toBe("sky");
  });

  it("retorna DEFAULT_THEME quando valor é vazio", async () => {
    mockSingle.mockResolvedValue({ data: { valor: "" } });
    const theme = await getTheme();
    expect(theme).toBe("sky");
  });

  it("retorna DEFAULT_THEME quando Supabase lança erro", async () => {
    mockSingle.mockRejectedValue(new Error("DB error"));
    const theme = await getTheme();
    expect(theme).toBe("sky");
  });

  it.each(["sky", "blue", "violet", "emerald", "rose", "amber"] as const)(
    "aceita tema válido %s",
    async (tema) => {
      mockSingle.mockResolvedValue({ data: { valor: tema } });
      const theme = await getTheme();
      expect(theme).toBe(tema);
    }
  );
});
