import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const { clinicaId } = (await request.json()) as { clinicaId: string };

  if (!clinicaId) {
    return NextResponse.json({ error: "clinicaId é obrigatório." }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("prontio_clinica_id", clinicaId, {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });

  return response;
}
