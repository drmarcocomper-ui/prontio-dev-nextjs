import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getClinicaAtual, getMedicoIdsDaClinica, isGestor } from "@/lib/clinica";
import { rateLimit } from "@/lib/rate-limit";

export async function GET() {
  const supabase = await createClient();

  // Verify authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { success: allowed } = await rateLimit({
    key: `backup:${user.id}`,
    windowMs: 60 * 60 * 1000, // 1 hora
  });
  if (!allowed) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde 1 hora antes de tentar novamente." },
      { status: 429 }
    );
  }

  const ctx = await getClinicaAtual();
  if (!ctx) {
    return NextResponse.json({ error: "Clínica não encontrada." }, { status: 403 });
  }

  if (!isGestor(ctx.papel)) {
    return NextResponse.json({ error: "Sem permissão para exportar dados." }, { status: 403 });
  }

  const medicoIds = await getMedicoIdsDaClinica();
  if (medicoIds.length === 0) {
    return NextResponse.json({ error: "Nenhum profissional encontrado na clínica." }, { status: 403 });
  }

  const backup: Record<string, unknown[]> = {};
  const errors: string[] = [];

  const queries = [
    // Tables filtered by medico_id (clinic-wide)
    ...["pacientes", "prontuarios", "receitas", "solicitacoes_exames", "atestados"].map(
      (table) => ({ table, promise: supabase.from(table).select("*").in("medico_id", medicoIds) }),
    ),
    // Tables filtered by clinica_id
    ...["agendamentos", "transacoes", "configuracoes", "horarios_profissional"].map(
      (table) => ({ table, promise: supabase.from(table).select("*").eq("clinica_id", ctx.clinicaId) }),
    ),
    // Global tables (no filter)
    ...["medicamentos", "catalogo_exames"].map(
      (table) => ({ table, promise: supabase.from(table).select("*") }),
    ),
  ];

  const results = await Promise.all(queries.map((q) => q.promise));

  queries.forEach(({ table }, i) => {
    const { data, error } = results[i];
    if (error) {
      errors.push(`Erro ao exportar ${table}. Tente novamente.`);
    } else {
      backup[table] = data ?? [];
    }
  });

  const payload = {
    version: "1.0",
    exported_at: new Date().toISOString(),
    exported_by: user.email,
    clinica: ctx.clinicaNome,
    tables: backup,
    ...(errors.length > 0 && { errors }),
  };

  const json = JSON.stringify(payload, null, 2);
  const date = new Date().toISOString().split("T")[0];

  return new NextResponse(json, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="prontio-backup-${date}.json"`,
    },
  });
}
