import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetUser = vi.fn();
const mockSingle = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      auth: { getUser: () => mockGetUser() },
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              limit: () => ({
                single: () => mockSingle(),
              }),
            }),
          }),
        }),
      }),
    }),
}));

let cookieSet: { name: string; value: string; options: Record<string, unknown> } | null = null;

vi.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => {
      const resp = {
        body,
        status: init?.status ?? 200,
        cookies: {
          set: (name: string, value: string, options: Record<string, unknown>) => {
            cookieSet = { name, value, options };
          },
        },
      };
      return resp;
    },
  },
}));

import { POST } from "./route";

function makeRequest(body: Record<string, unknown>) {
  return {
    json: () => Promise.resolve(body),
  } as unknown as import("next/server").NextRequest;
}

describe("POST /api/clinica", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookieSet = null;
  });

  it("retorna 400 quando clinicaId está ausente", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "clinicaId inválido." });
  });

  it("retorna 400 quando clinicaId não é UUID válido", async () => {
    const res = await POST(makeRequest({ clinicaId: "not-a-uuid" }));
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "clinicaId inválido." });
  });

  it("retorna 401 quando não autenticado", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await POST(makeRequest({ clinicaId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" }));
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Não autorizado." });
  });

  it("retorna 403 quando usuário não é membro da clínica", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u-1" } } });
    mockSingle.mockResolvedValue({ data: null, error: { code: "PGRST116" } });
    const res = await POST(makeRequest({ clinicaId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" }));
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: "Acesso negado a esta clínica." });
  });

  it("define cookie httpOnly quando membro válido", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u-1" } } });
    mockSingle.mockResolvedValue({ data: { clinica_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" }, error: null });
    const clinicaId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
    const res = await POST(makeRequest({ clinicaId }));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(cookieSet).toEqual({
      name: "prontio_clinica_id",
      value: clinicaId,
      options: expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
      }),
    });
  });
});
