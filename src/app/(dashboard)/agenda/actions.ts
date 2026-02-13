"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { tratarErroSupabase } from "@/lib/supabase-errors";
import { campoObrigatorio, tamanhoMaximo } from "@/lib/validators";
import { STATUS_TRANSITIONS, OBSERVACOES_MAX_LENGTH, type AgendaStatus } from "./types";
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
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function validarCamposAgendamento(formData: FormData) {
  const paciente_id = (formData.get("paciente_id") as string) || null;
  const data = formData.get("data") as string;
  const hora_inicio = formData.get("hora_inicio") as string;
  const hora_fim = formData.get("hora_fim") as string;
  const tipo = (formData.get("tipo") as string) || null;
  const observacoes = (formData.get("observacoes") as string)?.trim() || null;

  const fieldErrors: Record<string, string> = {};

  campoObrigatorio(fieldErrors, "paciente_id", paciente_id, "Selecione um paciente.");
  campoObrigatorio(fieldErrors, "data", data, "Data é obrigatória.");
  campoObrigatorio(fieldErrors, "hora_inicio", hora_inicio, "Horário de início é obrigatório.");
  campoObrigatorio(fieldErrors, "hora_fim", hora_fim, "Horário de término é obrigatório.");
  if (hora_inicio && hora_fim && hora_inicio >= hora_fim) {
    fieldErrors.hora_fim = "Horário de término deve ser após o início.";
  }
  if (
    hora_inicio &&
    hora_fim &&
    hora_inicio < hora_fim &&
    timeToMinutes(hora_fim) - timeToMinutes(hora_inicio) < 15
  ) {
    fieldErrors.hora_fim = "A consulta deve ter no mínimo 15 minutos.";
  }
  tamanhoMaximo(fieldErrors, "observacoes", observacoes, OBSERVACOES_MAX_LENGTH);

  return { paciente_id, data, hora_inicio, hora_fim, tipo, observacoes, fieldErrors };
}

function addDaysToDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function getRecurrenceDates(
  baseDate: string,
  recorrencia: string,
  vezes: number
): string[] {
  const dates: string[] = [baseDate];
  const intervalDays =
    recorrencia === "semanal" ? 7 : recorrencia === "quinzenal" ? 14 : 0;

  for (let i = 1; i < vezes; i++) {
    if (recorrencia === "mensal") {
      const base = new Date(baseDate + "T00:00:00");
      const next = new Date(base.getFullYear(), base.getMonth() + i, base.getDate());
      dates.push(next.toISOString().split("T")[0]);
    } else if (intervalDays > 0) {
      dates.push(addDaysToDate(baseDate, intervalDays * i));
    }
  }

  return dates;
}

export async function criarAgendamento(
  _prev: AgendamentoFormState,
  formData: FormData
): Promise<AgendamentoFormState> {
  const { paciente_id, data, hora_inicio, hora_fim, tipo, observacoes, fieldErrors } =
    validarCamposAgendamento(formData);

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const recorrencia = (formData.get("recorrencia") as string) || "";
  const recorrenciaVezes = Math.min(52, Math.max(2, Number(formData.get("recorrencia_vezes")) || 4));

  const supabase = await createClient();
  const ctx = await getClinicaAtual();
  if (!ctx) return { error: "Clínica não selecionada." };
  const clinicaId = ctx.clinicaId;

  if (recorrencia && ["semanal", "quinzenal", "mensal"].includes(recorrencia)) {
    // Recurring appointment
    const dates = getRecurrenceDates(data, recorrencia, recorrenciaVezes);

    // Check conflicts for all dates
    for (const d of dates) {
      const conflito = await verificarConflito(supabase, d, hora_inicio, hora_fim, clinicaId);
      if (conflito) {
        const dateFmt = new Date(d + "T00:00:00").toLocaleDateString("pt-BR");
        return { fieldErrors: { hora_inicio: `${dateFmt}: ${conflito}` } };
      }
    }

    const rows = dates.map((d) => ({
      paciente_id,
      clinica_id: clinicaId,
      data: d,
      hora_inicio,
      hora_fim,
      tipo,
      status: "agendado" as const,
      observacoes,
    }));

    const { error } = await supabase.from("agendamentos").insert(rows);
    if (error) {
      return { error: tratarErroSupabase(error, "criar", "agendamentos") };
    }

    revalidatePath("/agenda");
    revalidatePath("/");
    redirect(`/agenda?data=${data}&success=${dates.length}+agendamentos+criados`);
  }

  // Single appointment
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
  const supabase = await createClient();

  const { data: agendamento } = await supabase
    .from("agendamentos")
    .select("status")
    .eq("id", id)
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
    .update({ status: novoStatus })
    .eq("id", id);

  if (error) {
    throw new Error(tratarErroSupabase(error, "atualizar", "status"));
  }

  revalidatePath("/agenda");
  revalidatePath("/");
}

export async function atualizarAgendamento(
  _prev: AgendamentoFormState,
  formData: FormData
): Promise<AgendamentoFormState> {
  const id = formData.get("id") as string;
  if (!id) {
    return { error: "ID inválido." };
  }

  const { paciente_id, data, hora_inicio, hora_fim, tipo, observacoes, fieldErrors } =
    validarCamposAgendamento(formData);

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const supabase = await createClient();
  const ctx = await getClinicaAtual();
  if (!ctx) return { error: "Clínica não selecionada." };

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
      observacoes,
    })
    .eq("id", id);

  if (error) {
    return { error: tratarErroSupabase(error, "atualizar", "agendamento") };
  }

  revalidatePath("/agenda");
  revalidatePath("/");
  redirect(`/agenda/${id}?success=Agendamento+atualizado`);
}

export async function excluirAgendamento(id: string, data: string): Promise<void> {
  if (!id) {
    throw new Error("ID inválido.");
  }

  const supabase = await createClient();

  const { error } = await supabase.from("agendamentos").delete().eq("id", id);

  if (error) {
    throw new Error(tratarErroSupabase(error, "excluir", "agendamento"));
  }

  revalidatePath("/agenda");
  revalidatePath("/");
  redirect(`/agenda?data=${data}&success=Agendamento+exclu%C3%ADdo`);
}
