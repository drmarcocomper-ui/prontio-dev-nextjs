import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getClinicaAtual, getMedicoId } from "@/lib/clinica";

export async function GET() {
  const supabase = await createClient();

  // Verify authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const ctx = await getClinicaAtual();
  if (!ctx) {
    return NextResponse.json({ error: "Clínica não encontrada." }, { status: 403 });
  }

  let medicoId: string;
  try {
    medicoId = await getMedicoId();
  } catch {
    return NextResponse.json({ error: "Médico não encontrado." }, { status: 403 });
  }

  const backup: Record<string, unknown[]> = {};
  const errors: string[] = [];

  // Tables filtered by medico_id
  for (const table of ["pacientes", "prontuarios"] as const) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("medico_id", medicoId);
    if (error) {
      errors.push(`Erro ao exportar ${table}. Tente novamente.`);
    } else {
      backup[table] = data ?? [];
    }
  }

  // Tables filtered by clinica_id
  for (const table of ["agendamentos", "transacoes", "configuracoes"] as const) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("clinica_id", ctx.clinicaId);
    if (error) {
      errors.push(`Erro ao exportar ${table}. Tente novamente.`);
    } else {
      backup[table] = data ?? [];
    }
  }

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
