"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { tratarErroSupabase } from "@/lib/supabase-errors";
import { campoObrigatorio, tamanhoMaximo, valorPermitido, uuidValido } from "@/lib/validators";
import { parseLocalDate } from "@/lib/date";
import { STATUS_TRANSITIONS, OBSERVACOES_MAX_LENGTH, TIPO_LABELS, type AgendaStatus } from "./types";
import { getClinicaAtual } from "@/lib/clinica";

export type AgendamentoFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
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

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").slice(0, 2).map(Number);
  return h * 60 + m;
}

const DIAS_SEMANA: Record<number, { key: string; label: string }> = {
  1: { key: "seg", label: "segunda-feira" },
  2: { key: "ter", label: "terça-feira" },
  3: { key: "qua", label: "quarta-feira" },
  4: { key: "qui", label: "quinta-feira" },
  5: { key: "sex", label: "sexta-feira" },
  6: { key: "sab", label: "sábado" },
};

// Cache de configurações de horário comercial (TTL 5 min)
const HORARIO_CACHE_TTL = 5 * 60 * 1000;
const horarioCache = new Map<string, { data: Record<string, string>; timestamp: number }>();

async function getHorarioConfig(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clinicaId: string,
): Promise<Record<string, string>> {
  const cached = horarioCache.get(clinicaId);
  if (cached && Date.now() - cached.timestamp < HORARIO_CACHE_TTL) {
    return cached.data;
  }

  const allKeys = Object.values(DIAS_SEMANA).flatMap((d) => [
    `horario_${d.key}_inicio`,
    `horario_${d.key}_fim`,
  ]);

  const { data: rows } = await supabase
    .from("configuracoes")
    .select("chave, valor")
    .eq("clinica_id", clinicaId)
    .in("chave", allKeys);

  const config: Record<string, string> = {};
  (rows ?? []).forEach((r: { chave: string; valor: string }) => {
    config[r.chave] = r.valor;
  });

  horarioCache.set(clinicaId, { data: config, timestamp: Date.now() });
  return config;
}

export async function invalidarCacheHorario(clinicaId: string) {
  horarioCache.delete(clinicaId);
}

async function validarHorarioComercial(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clinicaId: string,
  data: string,
  horaInicio: string,
  horaFim: string,
): Promise<string | null> {
  const date = parseLocalDate(data);
  const dayOfWeek = date.getDay();

  const dia = DIAS_SEMANA[dayOfWeek];
  if (!dia) {
    return "Não há expediente aos domingos.";
  }

  const config = await getHorarioConfig(supabase, clinicaId);

  const inicio = config[`horario_${dia.key}_inicio`] || "08:00";
  const fim = config[`horario_${dia.key}_fim`] || "18:00";

  if (timeToMinutes(horaInicio) < timeToMinutes(inicio) || timeToMinutes(horaFim) > timeToMinutes(fim)) {
    return `Horário fora do expediente de ${dia.label} (${inicio}–${fim}).`;
  }

  return null;
}

function calcularHoraFim(horaInicio: string): string {
  const minutos = timeToMinutes(horaInicio) + 15;
  const h = Math.floor(minutos / 60).toString().padStart(2, "0");
  const m = (minutos % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

function parseCurrencyToNumber(raw: string | null): number | null {
  if (!raw || !raw.trim()) return null;
  const cleaned = raw.replace(/\./g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  if (isNaN(num) || num < 0) return null;
  return num;
}

function validarCamposAgendamento(formData: FormData) {
  const paciente_id = (formData.get("paciente_id") as string) || null;
  const data = formData.get("data") as string;
  const hora_inicio = formData.get("hora_inicio") as string;
  const tipo = (formData.get("tipo") as string) || null;
  const valorRaw = (formData.get("valor") as string) || null;
  const observacoes = (formData.get("observacoes") as string)?.trim() || null;

  const fieldErrors: Record<string, string> = {};

  campoObrigatorio(fieldErrors, "paciente_id", paciente_id, "Selecione um paciente.");
  campoObrigatorio(fieldErrors, "data", data, "Data é obrigatória.");
  campoObrigatorio(fieldErrors, "hora_inicio", hora_inicio, "Horário de início é obrigatório.");
  valorPermitido(fieldErrors, "tipo", tipo, Object.keys(TIPO_LABELS));
  tamanhoMaximo(fieldErrors, "observacoes", observacoes, OBSERVACOES_MAX_LENGTH);

  const hora_fim = hora_inicio ? calcularHoraFim(hora_inicio) : "";
  const valor = parseCurrencyToNumber(valorRaw);

  return { paciente_id, data, hora_inicio, hora_fim, tipo, valor, observacoes, fieldErrors };
}

export async function criarAgendamento(
  _prev: AgendamentoFormState,
  formData: FormData
): Promise<AgendamentoFormState> {
  const { paciente_id, data, hora_inicio, hora_fim, tipo, valor, observacoes, fieldErrors } =
    validarCamposAgendamento(formData);

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const supabase = await createClient();
  const ctx = await getClinicaAtual();
  if (!ctx) return { error: "Clínica não selecionada." };
  const clinicaId = ctx.clinicaId;

  // Validar horário comercial
  const foraExpediente = await validarHorarioComercial(supabase, clinicaId, data, hora_inicio, hora_fim);
  if (foraExpediente) {
    return { fieldErrors: { hora_inicio: foraExpediente } };
  }

  const conflito = await verificarConflito(supabase, data, hora_inicio, hora_fim, clinicaId);
  if (conflito) {
    return { fieldErrors: { hora_inicio: conflito } };
  }

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
  revalidatePath("/");
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

  const { error } = await supabase
    .from("agendamentos")
    .update({ status: novoStatus, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("clinica_id", ctx.clinicaId);

  if (error) {
    throw new Error(tratarErroSupabase(error, "atualizar", "status"));
  }

  // Log de auditoria
  await supabase.from("agendamento_status_log").insert({
    agendamento_id: id,
    status_anterior: statusAtual,
    status_novo: novoStatus,
    user_id: ctx.userId,
  });

  revalidatePath("/agenda");
  revalidatePath("/");
}

export async function atualizarAgendamento(
  _prev: AgendamentoFormState,
  formData: FormData
): Promise<AgendamentoFormState> {
  const id = formData.get("id") as string;
  if (!uuidValido(id)) {
    return { error: "ID inválido." };
  }

  const { paciente_id, data, hora_inicio, hora_fim, tipo, valor, observacoes, fieldErrors } =
    validarCamposAgendamento(formData);

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const supabase = await createClient();
  const ctx = await getClinicaAtual();
  if (!ctx) return { error: "Clínica não selecionada." };

  const foraExpediente = await validarHorarioComercial(supabase, ctx.clinicaId, data, hora_inicio, hora_fim);
  if (foraExpediente) {
    return { fieldErrors: { hora_inicio: foraExpediente } };
  }

  const conflito = await verificarConflito(supabase, data, hora_inicio, hora_fim, ctx.clinicaId, id);
  if (conflito) {
    return { fieldErrors: { hora_inicio: conflito } };
  }

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
  revalidatePath("/");
  redirect(`/agenda/${id}?success=Agendamento+atualizado`);
}

export async function excluirAgendamento(id: string, data: string): Promise<void> {
  if (!uuidValido(id)) {
    throw new Error("ID inválido.");
  }

  const supabase = await createClient();
  const ctx = await getClinicaAtual();
  if (!ctx) throw new Error("Clínica não selecionada.");

  const { error } = await supabase.from("agendamentos").delete().eq("id", id).eq("clinica_id", ctx.clinicaId);

  if (error) {
    throw new Error(tratarErroSupabase(error, "excluir", "agendamento"));
  }

  revalidatePath("/agenda");
  revalidatePath("/");
  redirect(`/agenda?data=${data}&success=Agendamento+exclu%C3%ADdo`);
}
