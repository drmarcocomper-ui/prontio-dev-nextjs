import { NextResponse, type NextRequest } from "next/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  const { clinicaId } = (await request.json()) as { clinicaId: string };

  if (!clinicaId || !UUID_RE.test(clinicaId)) {
    return NextResponse.json({ error: "clinicaId inválido." }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("prontio_clinica_id", clinicaId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });

  return response;
}
