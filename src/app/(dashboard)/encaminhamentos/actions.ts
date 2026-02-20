"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { tratarErroSupabase } from "@/lib/supabase-errors";
import { campoObrigatorio, tamanhoMaximo, dataNaoFutura, uuidValido } from "@/lib/validators";
import {
  MOTIVO_MAX_LENGTH,
  PROFISSIONAL_DESTINO_MAX_LENGTH,
  ESPECIALIDADE_MAX_LENGTH,
  TELEFONE_MAX_LENGTH,
  OBSERVACOES_MAX_LENGTH,
} from "./types";
import { getClinicaAtual, getMedicoIdSafe, isProfissional } from "@/lib/clinica";
import { rateLimit } from "@/lib/rate-limit";

export type EncaminhamentoFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

function validarCamposEncaminhamento(formData: FormData) {
  const paciente_id = (formData.get("paciente_id") as string) || null;
  const data = (formData.get("data") as string) || null;
  const profissional_destino = (formData.get("profissional_destino") as string)?.trim() || null;
  const especialidade = (formData.get("especialidade") as string)?.trim() || null;
  const telefone_profissional = (formData.get("telefone_profissional") as string)?.trim() || null;
  const motivo = (formData.get("motivo") as string)?.trim() || null;
  const observacoes = (formData.get("observacoes") as string)?.trim() || null;

  const fieldErrors: Record<string, string> = {};

  if (campoObrigatorio(fieldErrors, "paciente_id", paciente_id, "Selecione um paciente.")) {
    if (!uuidValido(paciente_id!)) fieldErrors.paciente_id = "Paciente inválido.";
  }

  dataNaoFutura(fieldErrors, "data", data);

  campoObrigatorio(fieldErrors, "profissional_destino", profissional_destino, "Informe o profissional de destino.");
  tamanhoMaximo(fieldErrors, "profissional_destino", profissional_destino, PROFISSIONAL_DESTINO_MAX_LENGTH);

  campoObrigatorio(fieldErrors, "especialidade", especialidade, "Informe a especialidade.");
  tamanhoMaximo(fieldErrors, "especialidade", especialidade, ESPECIALIDADE_MAX_LENGTH);

  tamanhoMaximo(fieldErrors, "telefone_profissional", telefone_profissional, TELEFONE_MAX_LENGTH);

  campoObrigatorio(fieldErrors, "motivo", motivo, "Informe o motivo do encaminhamento.");
  tamanhoMaximo(fieldErrors, "motivo", motivo, MOTIVO_MAX_LENGTH);

  tamanhoMaximo(fieldErrors, "observacoes", observacoes, OBSERVACOES_MAX_LENGTH);

  return { paciente_id, data, profissional_destino, especialidade, telefone_profissional, motivo, observacoes, fieldErrors };
}

export async function criarEncaminhamento(
  _prev: EncaminhamentoFormState,
  formData: FormData
): Promise<EncaminhamentoFormState> {
  const { fieldErrors, ...fields } = validarCamposEncaminhamento(formData);

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const ctx = await getClinicaAtual();
  if (!ctx || !isProfissional(ctx.papel)) {
    return { error: "Apenas profissionais de saúde podem criar encaminhamentos." };
  }

  const supabase = await createClient();
  const medicoId = await getMedicoIdSafe();
  if (!medicoId) return { error: "Não foi possível identificar o médico responsável." };

  const { success: allowed } = await rateLimit({
    key: `criar_encaminhamento:${medicoId}`,
    maxAttempts: 30,
    windowMs: 60 * 60 * 1000,
  });
  if (!allowed) {
    return { error: "Muitas tentativas. Aguarde antes de tentar novamente." };
  }

  const { data: paciente } = await supabase
    .from("pacientes")
    .select("id")
    .eq("id", fields.paciente_id)
    .single();

  if (!paciente) {
    return { fieldErrors: { paciente_id: "Paciente não encontrado." } };
  }

  const { data: inserted, error } = await supabase
    .from("encaminhamentos")
    .insert({
      paciente_id: fields.paciente_id,
      medico_id: medicoId,
      data: fields.data,
      profissional_destino: fields.profissional_destino,
      especialidade: fields.especialidade,
      telefone_profissional: fields.telefone_profissional,
      motivo: fields.motivo,
      observacoes: fields.observacoes,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return { error: tratarErroSupabase(error!, "criar", "encaminhamento") };
  }

  revalidatePath("/encaminhamentos");
  revalidatePath("/", "page");
  revalidatePath(`/pacientes/${fields.paciente_id}`);
  redirect(`/encaminhamentos/${inserted.id}?success=Encaminhamento+registrado`);
}

export async function atualizarEncaminhamento(
  _prev: EncaminhamentoFormState,
  formData: FormData
): Promise<EncaminhamentoFormState> {
  const id = formData.get("id") as string;
  if (!uuidValido(id)) {
    return { error: "ID inválido." };
  }

  const { fieldErrors, ...fields } = validarCamposEncaminhamento(formData);

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const ctx = await getClinicaAtual();
  if (!ctx || !isProfissional(ctx.papel)) {
    return { error: "Apenas profissionais de saúde podem editar encaminhamentos." };
  }

  const supabase = await createClient();
  const medicoId = await getMedicoIdSafe();
  if (!medicoId) return { error: "Não foi possível identificar o médico responsável." };

  const { success: allowed } = await rateLimit({
    key: `atualizar_encaminhamento:${medicoId}`,
    maxAttempts: 30,
    windowMs: 60 * 60 * 1000,
  });
  if (!allowed) {
    return { error: "Muitas tentativas. Aguarde antes de tentar novamente." };
  }

  const { data: paciente } = await supabase
    .from("pacientes")
    .select("id")
    .eq("id", fields.paciente_id)
    .single();

  if (!paciente) {
    return { fieldErrors: { paciente_id: "Paciente não encontrado." } };
  }

  const { error } = await supabase
    .from("encaminhamentos")
    .update({
      paciente_id: fields.paciente_id,
      data: fields.data,
      profissional_destino: fields.profissional_destino,
      especialidade: fields.especialidade,
      telefone_profissional: fields.telefone_profissional,
      motivo: fields.motivo,
      observacoes: fields.observacoes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("medico_id", medicoId);

  if (error) {
    return { error: tratarErroSupabase(error, "atualizar", "encaminhamento") };
  }

  revalidatePath("/encaminhamentos");
  revalidatePath("/", "page");
  revalidatePath(`/pacientes/${fields.paciente_id}`);
  redirect(`/encaminhamentos/${id}?success=Encaminhamento+atualizado`);
}

export async function excluirEncaminhamento(id: string): Promise<void> {
  if (!uuidValido(id)) {
    throw new Error("ID inválido.");
  }

  const ctx = await getClinicaAtual();
  if (!ctx || !isProfissional(ctx.papel)) {
    throw new Error("Apenas profissionais de saúde podem excluir encaminhamentos.");
  }

  const supabase = await createClient();
  const medicoId = await getMedicoIdSafe();
  if (!medicoId) {
    throw new Error("Não foi possível identificar o médico responsável.");
  }

  const { success: allowed } = await rateLimit({
    key: `excluir_encaminhamento:${medicoId}`,
    maxAttempts: 20,
    windowMs: 60 * 60 * 1000,
  });
  if (!allowed) {
    throw new Error("Muitas tentativas. Aguarde antes de tentar novamente.");
  }

  const { data: encaminhamento } = await supabase
    .from("encaminhamentos")
    .select("paciente_id")
    .eq("id", id)
    .eq("medico_id", medicoId)
    .single();

  const pacienteId = encaminhamento?.paciente_id;

  const { error } = await supabase.from("encaminhamentos").delete().eq("id", id).eq("medico_id", medicoId);

  if (error) {
    throw new Error(tratarErroSupabase(error, "excluir", "encaminhamento"));
  }

  revalidatePath("/encaminhamentos");
  revalidatePath("/", "page");
  if (pacienteId) {
    revalidatePath(`/pacientes/${pacienteId}`);
    redirect(`/pacientes/${pacienteId}?tab=prontuario&success=Encaminhamento+exclu%C3%ADdo`);
  }
  redirect("/pacientes");
}
