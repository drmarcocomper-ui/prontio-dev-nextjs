import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  const { clinicaId } = (await request.json()) as { clinicaId: string };

  if (!clinicaId || !UUID_RE.test(clinicaId)) {
    return NextResponse.json({ error: "clinicaId inválido." }, { status: 400 });
  }

  // Verify authentication
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  // Verify user has membership in the requested clinic
  const { data: membership } = await supabase
    .from("usuarios_clinicas")
    .select("clinica_id")
    .eq("user_id", user.id)
    .eq("clinica_id", clinicaId)
    .limit(1)
    .single();

  if (!membership) {
    return NextResponse.json({ error: "Acesso negado a esta clínica." }, { status: 403 });
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
