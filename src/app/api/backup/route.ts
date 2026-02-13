"use server";

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const TABLES = [
  "pacientes",
  "agendamentos",
  "prontuarios",
  "transacoes",
  "configuracoes",
] as const;

export async function GET() {
  const supabase = await createClient();

  // Verify authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const backup: Record<string, unknown[]> = {};
  const errors: string[] = [];

  for (const table of TABLES) {
    const { data, error } = await supabase.from(table).select("*");
    if (error) {
      errors.push(`Erro ao exportar ${table}: ${error.message}`);
    } else {
      backup[table] = data ?? [];
    }
  }

  const payload = {
    version: "1.0",
    exported_at: new Date().toISOString(),
    exported_by: user.email,
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
