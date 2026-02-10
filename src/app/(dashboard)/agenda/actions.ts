"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AgendamentoFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function criarAgendamento(
  _prev: AgendamentoFormState,
  formData: FormData
): Promise<AgendamentoFormState> {
  const paciente_id = (formData.get("paciente_id") as string) || null;
  const data = formData.get("data") as string;
  const hora_inicio = formData.get("hora_inicio") as string;
  const hora_fim = formData.get("hora_fim") as string;
  const tipo = (formData.get("tipo") as string) || null;
  const observacoes = (formData.get("observacoes") as string)?.trim() || null;

  const fieldErrors: Record<string, string> = {};

  if (!paciente_id) fieldErrors.paciente_id = "Selecione um paciente.";
  if (!data) fieldErrors.data = "Data é obrigatória.";
  if (!hora_inicio) fieldErrors.hora_inicio = "Horário de início é obrigatório.";
  if (!hora_fim) fieldErrors.hora_fim = "Horário de término é obrigatório.";
  if (hora_inicio && hora_fim && hora_inicio >= hora_fim) {
    fieldErrors.hora_fim = "Horário de término deve ser após o início.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("agendamentos").insert({
    paciente_id,
    data,
    hora_inicio,
    hora_fim,
    tipo,
    status: "agendado",
    observacoes,
  });

  if (error) {
    return { error: "Erro ao criar agendamento. Tente novamente." };
  }

  redirect(`/agenda?data=${data}`);
}

export async function atualizarStatusAgendamento(
  id: string,
  status: string
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("agendamentos")
    .update({ status })
    .eq("id", id);

  if (error) {
    throw new Error("Erro ao atualizar status.");
  }
}

export async function excluirAgendamento(id: string, data: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from("agendamentos").delete().eq("id", id);

  if (error) {
    throw new Error("Erro ao excluir agendamento.");
  }

  redirect(`/agenda?data=${data}`);
}
