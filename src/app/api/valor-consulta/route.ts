import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getClinicaAtual } from "@/lib/clinica";
import { UUID_RE } from "@/lib/validators";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const pacienteId = searchParams.get("paciente_id");
  const tipo = searchParams.get("tipo");

  if (!pacienteId || !UUID_RE.test(pacienteId)) {
    return NextResponse.json({ valor: null, convenio: null });
  }

  const ctx = await getClinicaAtual();
  if (!ctx) {
    return NextResponse.json({ valor: null, convenio: null });
  }

  // Se tipo é retorno, valor é sempre 0
  if (tipo === "retorno") {
    return NextResponse.json({ valor: 0, convenio: null });
  }

  const supabase = await createClient();

  // Buscar convênio do paciente
  const { data: paciente } = await supabase
    .from("pacientes")
    .select("convenio")
    .eq("id", pacienteId)
    .single();

  if (!paciente?.convenio) {
    return NextResponse.json({ valor: null, convenio: null });
  }

  const convenio = paciente.convenio;

  // Cortesia é sempre 0
  if (convenio === "cortesia") {
    return NextResponse.json({ valor: 0, convenio });
  }

  // Buscar valor configurado para o convênio
  const { data: config } = await supabase
    .from("configuracoes")
    .select("valor")
    .eq("clinica_id", ctx.clinicaId)
    .eq("chave", `valor_convenio_${convenio}`)
    .single();

  const valor = config?.valor ? parseFloat(config.valor) : null;

  return NextResponse.json({ valor, convenio });
}
