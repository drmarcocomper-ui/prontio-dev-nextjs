"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { tratarErroSupabase } from "@/lib/supabase-errors";
import { campoObrigatorio, tamanhoMaximo, valorPermitido, uuidValido, DATE_RE } from "@/lib/validators";
import { parseLocalDate } from "@/lib/date";
import { STATUS_TRANSITIONS, OBSERVACOES_MAX_LENGTH, TIPO_LABELS, type AgendaStatus } from "./types";
import { getClinicaAtual, getMedicoId } from "@/lib/clinica";

import { timeToMinutes, DIAS_SEMANA, getHorarioConfig } from "./utils";

export type AgendamentoFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  conflito?: string;
  formValues?: { data: string; hora_inicio: string; tipo: string };
};

async function verificarConflito(
  supabase: Awaited<ReturnType<typeof createClient>>,
  data: string,
  hora_inicio: string,
  hora_fim: string,
  clinicaId: string,
  excluirId?: string
): Promise<string | null> {
  let query = supabase
    .from("agendamentos")
    .select("id, hora_inicio, hora_fim, pacientes(nome)", { count: "exact" })
    .eq("data", data)
    .eq("clinica_id", clinicaId)
    .lt("hora_inicio", hora_fim)
    .gt("hora_fim", hora_inicio)
    .not("status", "in", "(cancelado,faltou)");

  if (excluirId) {
    query = query.neq("id", excluirId);
  }

  const { data: conflitos, error } = await query.limit(1);

  if (error || !conflitos || conflitos.length === 0) return null;

  const c = conflitos[0] as unknown as {
    hora_inicio: string;
    hora_fim: string;
    pacientes: { nome: string } | null;
  };
  const nome = c.pacientes?.nome ?? "outro paciente";
  const inicio = c.hora_inicio.slice(0, 5);
  const fim = c.hora_fim.slice(0, 5);

  return `Conflito com agendamento de ${nome} (${inicio}–${fim}).`;
}

async function validarHorarioComercial(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clinicaId: string,
  data: string,
  horaInicio: string,
  horaFim: string,
  userId?: string,
): Promise<string | null> {
  const date = parseLocalDate(data);
  const dayOfWeek = date.getDay();

  const dia = DIAS_SEMANA[dayOfWeek];
  if (!dia) {
    return "Não há expediente neste dia.";
  }

  const config = await getHorarioConfig(supabase, clinicaId, userId);

  const inicio = config[`horario_${dia.key}_inicio`];
  const fim = config[`horario_${dia.key}_fim`];

  if (!inicio || !fim) {
    return `O profissional não atende neste dia (${dia.label}).`;
  }

  if (timeToMinutes(horaInicio) < timeToMinutes(inicio) || timeToMinutes(horaFim) > timeToMinutes(fim)) {
    return `Horário fora do expediente de ${dia.label} (${inicio}–${fim}).`;
  }

  return null;
}

function calcularHoraFim(horaInicio: string, duracao: number): string {
  const minutos = timeToMinutes(horaInicio) + duracao;
  const h = Math.floor(minutos / 60).toString().padStart(2, "0");
  const m = (minutos % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

function validarCamposAgendamento(formData: FormData) {
  const paciente_id = (formData.get("paciente_id") as string) || null;
  const data = formData.get("data") as string;
  const hora_inicio = formData.get("hora_inicio") as string;
  const tipo = (formData.get("tipo") as string) || null;
  const observacoes = (formData.get("observacoes") as string)?.trim() || null;

  const fieldErrors: Record<string, string> = {};

  campoObrigatorio(fieldErrors, "paciente_id", paciente_id, "Selecione um paciente.");
  if (paciente_id && !uuidValido(paciente_id)) {
    fieldErrors.paciente_id = "Paciente inválido.";
  }
  campoObrigatorio(fieldErrors, "data", data, "Data é obrigatória.");
  if (data && !DATE_RE.test(data)) {
    fieldErrors.data = "Formato de data inválido.";
  }
  campoObrigatorio(fieldErrors, "hora_inicio", hora_inicio, "Horário de início é obrigatório.");
  if (hora_inicio && !/^\d{2}:\d{2}$/.test(hora_inicio)) {
    fieldErrors.hora_inicio = "Formato de horário inválido.";
  }
  campoObrigatorio(fieldErrors, "tipo", tipo, "Selecione o tipo.");
  valorPermitido(fieldErrors, "tipo", tipo, Object.keys(TIPO_LABELS));
  tamanhoMaximo(fieldErrors, "observacoes", observacoes, OBSERVACOES_MAX_LENGTH);

  return { paciente_id, data, hora_inicio, tipo, observacoes, fieldErrors };
}

async function determinarValor(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clinicaId: string,
  pacienteId: string,
  tipo: string | null,
): Promise<number | null> {
  if (tipo === "retorno") return 0;

  const { data: paciente } = await supabase
    .from("pacientes")
    .select("convenio")
    .eq("id", pacienteId)
    .single();

  if (!paciente?.convenio) return null;

  if (paciente.convenio === "cortesia") return 0;

  const { data: config } = await supabase
    .from("configuracoes")
    .select("valor")
    .eq("clinica_id", clinicaId)
    .eq("chave", `valor_convenio_${paciente.convenio}`)
    .single();

  return config?.valor ? parseFloat(config.valor) : null;
}

export async function criarAgendamento(
  _prev: AgendamentoFormState,
  formData: FormData
): Promise<AgendamentoFormState> {
  const { paciente_id, data, hora_inicio, tipo, observacoes, fieldErrors } =
    validarCamposAgendamento(formData);

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const supabase = await createClient();
  const ctx = await getClinicaAtual();
  if (!ctx) return { error: "Clínica não selecionada." };
  const clinicaId = ctx.clinicaId;

  const medicoUserId = await getMedicoId();

  // Obter duração configurada (padrão 15 min)
  const config = await getHorarioConfig(supabase, clinicaId, medicoUserId);
  const duracao = config.duracao_consulta ? parseInt(config.duracao_consulta, 10) : 15;
  const hora_fim = calcularHoraFim(hora_inicio, duracao);

  // Validar horário comercial
  const foraExpediente = await validarHorarioComercial(supabase, clinicaId, data, hora_inicio, hora_fim, medicoUserId);
  if (foraExpediente) {
    return { fieldErrors: { hora_inicio: foraExpediente } };
  }

  const forcarEncaixe = formData.get("forcar_encaixe") === "true";
  if (!forcarEncaixe) {
    const conflito = await verificarConflito(supabase, data, hora_inicio, hora_fim, clinicaId);
    if (conflito) {
      return { conflito, formValues: { data, hora_inicio, tipo: tipo ?? "" } };
    }
  }

  const valor = await determinarValor(supabase, clinicaId, paciente_id!, tipo);

  const { error } = await supabase.from("agendamentos").insert({
    paciente_id,
    clinica_id: clinicaId,
    data,
    hora_inicio,
    hora_fim,
    tipo,
    valor,
    status: "agendado",
    observacoes,
  });

  if (error) {
    return { error: tratarErroSupabase(error, "criar", "agendamento") };
  }

  revalidatePath("/agenda");
  revalidatePath("/", "page");
  redirect(`/agenda?data=${data}&success=Agendamento+criado`);
}

export async function atualizarStatusAgendamento(
  id: string,
  novoStatus: AgendaStatus
): Promise<void> {
  if (!uuidValido(id)) throw new Error("ID inválido.");
  const supabase = await createClient();
  const ctx = await getClinicaAtual();
  if (!ctx) throw new Error("Clínica não selecionada.");

  const { data: agendamento } = await supabase
    .from("agendamentos")
    .select("status")
    .eq("id", id)
    .eq("clinica_id", ctx.clinicaId)
    .single();

  if (!agendamento) {
    throw new Error("Agendamento não encontrado.");
  }

  const statusAtual = agendamento.status as AgendaStatus;
  const permitidos = STATUS_TRANSITIONS[statusAtual] ?? [];

  if (!permitidos.includes(novoStatus)) {
    throw new Error("Transição de status não permitida.");
  }

  const { data: updated, error } = await supabase
    .from("agendamentos")
    .update({ status: novoStatus, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("clinica_id", ctx.clinicaId)
    .eq("status", statusAtual)
    .select("id");

  if (error) {
    throw new Error(tratarErroSupabase(error, "atualizar", "status"));
  }

  if (!updated || updated.length === 0) {
    throw new Error("Status foi alterado por outro usuário. Atualize a página.");
  }

  // Log de auditoria
  const { error: logError } = await supabase.from("agendamento_status_log").insert({
    agendamento_id: id,
    status_anterior: statusAtual,
    status_novo: novoStatus,
    user_id: ctx.userId,
  });
  if (logError) {
    console.error("Falha ao inserir log de auditoria:", logError.message);
  }

  revalidatePath("/agenda");
  revalidatePath("/", "page");
}

export async function atualizarAgendamento(
  _prev: AgendamentoFormState,
  formData: FormData
): Promise<AgendamentoFormState> {
  const id = formData.get("id") as string;
  if (!uuidValido(id)) {
    return { error: "ID inválido." };
  }

  const { paciente_id, data, hora_inicio, tipo, observacoes, fieldErrors } =
    validarCamposAgendamento(formData);

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const supabase = await createClient();
  const ctx = await getClinicaAtual();
  if (!ctx) return { error: "Clínica não selecionada." };

  const medicoUserId = await getMedicoId();

  // Obter duração configurada (padrão 15 min)
  const config = await getHorarioConfig(supabase, ctx.clinicaId, medicoUserId);
  const duracao = config.duracao_consulta ? parseInt(config.duracao_consulta, 10) : 15;
  const hora_fim = calcularHoraFim(hora_inicio, duracao);

  const foraExpediente = await validarHorarioComercial(supabase, ctx.clinicaId, data, hora_inicio, hora_fim, medicoUserId);
  if (foraExpediente) {
    return { fieldErrors: { hora_inicio: foraExpediente } };
  }

  const forcarEncaixe = formData.get("forcar_encaixe") === "true";
  if (!forcarEncaixe) {
    const conflito = await verificarConflito(supabase, data, hora_inicio, hora_fim, ctx.clinicaId, id);
    if (conflito) {
      return { conflito, formValues: { data, hora_inicio, tipo: tipo ?? "" } };
    }
  }

  const valor = await determinarValor(supabase, ctx.clinicaId, paciente_id!, tipo);

  const { error } = await supabase
    .from("agendamentos")
    .update({
      paciente_id,
      data,
      hora_inicio,
      hora_fim,
      tipo,
      valor,
      observacoes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("clinica_id", ctx.clinicaId);

  if (error) {
    return { error: tratarErroSupabase(error, "atualizar", "agendamento") };
  }

  revalidatePath("/agenda");
  revalidatePath("/", "page");
  redirect(`/agenda/${id}?success=Agendamento+atualizado`);
}

export async function excluirAgendamento(id: string, data: string): Promise<void> {
  if (!uuidValido(id)) {
    throw new Error("ID inválido.");
  }
  if (!DATE_RE.test(data)) {
    throw new Error("Data inválida.");
  }

  const supabase = await createClient();
  const ctx = await getClinicaAtual();
  if (!ctx) throw new Error("Clínica não selecionada.");

  const { error } = await supabase.from("agendamentos").delete().eq("id", id).eq("clinica_id", ctx.clinicaId);

  if (error) {
    throw new Error(tratarErroSupabase(error, "excluir", "agendamento"));
  }

  revalidatePath("/agenda");
  revalidatePath("/", "page");
  redirect(`/agenda?data=${encodeURIComponent(data)}&success=Agendamento+exclu%C3%ADdo`);
}
