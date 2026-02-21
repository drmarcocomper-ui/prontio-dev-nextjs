import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getClinicaAtual, getMedicoIdsDaClinica, isGestor } from "@/lib/clinica";
import { rateLimit } from "@/lib/rate-limit";
import { logAuditEvent } from "@/lib/audit";

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
    { table: "pacientes", promise: supabase.from("pacientes").select("id, medico_id, nome, cpf, rg, data_nascimento, sexo, estado_civil, telefone, email, cep, endereco, numero, complemento, bairro, cidade, estado, convenio, observacoes, created_at").in("medico_id", medicoIds) },
    { table: "prontuarios", promise: supabase.from("prontuarios").select("id, paciente_id, medico_id, data, tipo, cid, queixa_principal, historia_doenca, exame_fisico, hipotese_diagnostica, conduta, observacoes, created_at").in("medico_id", medicoIds) },
    { table: "receitas", promise: supabase.from("receitas").select("id, paciente_id, medico_id, data, tipo, medicamentos, observacoes, created_at").in("medico_id", medicoIds) },
    { table: "solicitacoes_exames", promise: supabase.from("solicitacoes_exames").select("id, paciente_id, medico_id, data, tipo, exames, indicacao_clinica, operadora, numero_carteirinha, observacoes, created_at").in("medico_id", medicoIds) },
    { table: "atestados", promise: supabase.from("atestados").select("id, paciente_id, medico_id, data, tipo, conteudo, cid, dias_afastamento, observacoes, created_at").in("medico_id", medicoIds) },
    { table: "encaminhamentos", promise: supabase.from("encaminhamentos").select("id, paciente_id, medico_id, data, profissional_destino, especialidade, telefone_profissional, motivo, observacoes, created_at").in("medico_id", medicoIds) },
    // Tables filtered by clinica_id
    { table: "agendamentos", promise: supabase.from("agendamentos").select("id, paciente_id, clinica_id, data, hora_inicio, hora_fim, tipo, status, valor, observacoes, created_at").eq("clinica_id", ctx.clinicaId) },
    { table: "transacoes", promise: supabase.from("transacoes").select("id, clinica_id, tipo, categoria, descricao, valor, data, paciente_id, forma_pagamento, status, observacoes, created_at").eq("clinica_id", ctx.clinicaId) },
    { table: "configuracoes", promise: supabase.from("configuracoes").select("id, chave, valor, clinica_id, user_id").eq("clinica_id", ctx.clinicaId) },
    { table: "horarios_profissional", promise: supabase.from("horarios_profissional").select("id, clinica_id, user_id, dia_semana, ativo, hora_inicio, hora_fim, intervalo_inicio, intervalo_fim, duracao_consulta").eq("clinica_id", ctx.clinicaId) },
    // Global catalog tables
    { table: "medicamentos", promise: supabase.from("medicamentos").select("id, nome, posologia, quantidade, via_administracao") },
    { table: "catalogo_exames", promise: supabase.from("catalogo_exames").select("id, nome, codigo_tuss") },
    { table: "catalogo_profissionais", promise: supabase.from("catalogo_profissionais").select("id, nome, especialidade, telefone") },
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

  void logAuditEvent({
    userId: user.id,
    clinicaId: ctx.clinicaId,
    acao: "exportar",
    recurso: "backup",
    detalhes: { tabelas: Object.keys(backup), erros: errors.length },
  });

  const json = JSON.stringify(payload, null, 2);
  const date = new Date().toISOString().split("T")[0];

  return new NextResponse(json, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="prontio-backup-${date}.json"`,
    },
  });
}
