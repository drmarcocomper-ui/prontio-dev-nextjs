"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { tratarErroSupabase } from "@/lib/supabase-errors";
import { campoObrigatorio, tamanhoMaximo, dataNaoFutura, uuidValido } from "@/lib/validators";
import { CONTEUDO_MAX_LENGTH, OBSERVACOES_MAX_LENGTH } from "./types";
import { getClinicaAtual, getMedicoIdSafe, isProfissional } from "@/lib/clinica";
import { rateLimit } from "@/lib/rate-limit";
import { logAuditEvent } from "@/lib/audit";

export type LaudoFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

function validarCamposLaudo(formData: FormData) {
  const paciente_id = (formData.get("paciente_id") as string) || null;
  const data = (formData.get("data") as string) || null;
  const conteudo = (formData.get("conteudo") as string)?.trim() || null;
  const observacoes = (formData.get("observacoes") as string)?.trim() || null;

  const fieldErrors: Record<string, string> = {};

  if (campoObrigatorio(fieldErrors, "paciente_id", paciente_id, "Selecione um paciente.")) {
    if (!uuidValido(paciente_id!)) fieldErrors.paciente_id = "Paciente inválido.";
  }

  dataNaoFutura(fieldErrors, "data", data);

  campoObrigatorio(fieldErrors, "conteudo", conteudo, "Conteúdo é obrigatório.");
  tamanhoMaximo(fieldErrors, "conteudo", conteudo, CONTEUDO_MAX_LENGTH);
  tamanhoMaximo(fieldErrors, "observacoes", observacoes, OBSERVACOES_MAX_LENGTH);

  return { paciente_id, data, conteudo, observacoes, fieldErrors };
}

export async function criarLaudo(
  _prev: LaudoFormState,
  formData: FormData
): Promise<LaudoFormState> {
  const { fieldErrors, ...fields } = validarCamposLaudo(formData);

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const ctx = await getClinicaAtual();
  if (!ctx || !isProfissional(ctx.papel)) {
    return { error: "Apenas profissionais de saúde podem emitir laudos." };
  }

  const supabase = await createClient();
  const medicoId = await getMedicoIdSafe();
  if (!medicoId) return { error: "Não foi possível identificar o médico responsável." };

  const { success: allowed } = await rateLimit({
    key: `criar_laudo:${medicoId}`,
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
    .from("laudos")
    .insert({
      paciente_id: fields.paciente_id,
      medico_id: medicoId,
      data: fields.data,
      conteudo: fields.conteudo,
      observacoes: fields.observacoes,
    })
    .select("id")
    .single();

  if (error) {
    return { error: tratarErroSupabase(error, "criar", "laudo") };
  }

  void logAuditEvent({ userId: ctx.userId, clinicaId: ctx.clinicaId, acao: "criar", recurso: "laudo", detalhes: { paciente_id: fields.paciente_id } });

  revalidatePath("/laudos");
  revalidatePath("/", "page");
  revalidatePath(`/pacientes/${fields.paciente_id}`);
  redirect(`/pacientes/${fields.paciente_id}?tab=prontuario&success=Laudo+registrado`);
}

export async function atualizarLaudo(
  _prev: LaudoFormState,
  formData: FormData
): Promise<LaudoFormState> {
  const id = formData.get("id") as string;
  if (!uuidValido(id)) {
    return { error: "ID inválido." };
  }

  const { fieldErrors, ...fields } = validarCamposLaudo(formData);

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const ctx = await getClinicaAtual();
  if (!ctx || !isProfissional(ctx.papel)) {
    return { error: "Apenas profissionais de saúde podem editar laudos." };
  }

  const supabase = await createClient();
  const medicoId = await getMedicoIdSafe();
  if (!medicoId) return { error: "Não foi possível identificar o médico responsável." };

  const { success: allowed } = await rateLimit({
    key: `atualizar_laudo:${medicoId}`,
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
    .from("laudos")
    .update({
      paciente_id: fields.paciente_id,
      data: fields.data,
      conteudo: fields.conteudo,
      observacoes: fields.observacoes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("medico_id", medicoId);

  if (error) {
    return { error: tratarErroSupabase(error, "atualizar", "laudo") };
  }

  void logAuditEvent({ userId: ctx.userId, clinicaId: ctx.clinicaId, acao: "atualizar", recurso: "laudo", recursoId: id });

  revalidatePath("/laudos");
  revalidatePath("/", "page");
  revalidatePath(`/pacientes/${fields.paciente_id}`);
  redirect(`/laudos/${id}?success=Laudo+atualizado`);
}

export async function excluirLaudo(id: string): Promise<void> {
  if (!uuidValido(id)) {
    throw new Error("ID inválido.");
  }

  const ctx = await getClinicaAtual();
  if (!ctx || !isProfissional(ctx.papel)) {
    throw new Error("Apenas profissionais de saúde podem excluir laudos.");
  }

  const supabase = await createClient();
  const medicoId = await getMedicoIdSafe();
  if (!medicoId) {
    throw new Error("Não foi possível identificar o médico responsável.");
  }

  const { success: allowed } = await rateLimit({
    key: `excluir_laudo:${medicoId}`,
    maxAttempts: 20,
    windowMs: 60 * 60 * 1000,
  });
  if (!allowed) {
    throw new Error("Muitas tentativas. Aguarde antes de tentar novamente.");
  }

  const { data: laudo } = await supabase
    .from("laudos")
    .select("paciente_id")
    .eq("id", id)
    .eq("medico_id", medicoId)
    .single();

  const pacienteId = laudo?.paciente_id;

  const { error } = await supabase.from("laudos").delete().eq("id", id).eq("medico_id", medicoId);

  if (error) {
    throw new Error(tratarErroSupabase(error, "excluir", "laudo"));
  }

  void logAuditEvent({ userId: ctx.userId, clinicaId: ctx.clinicaId, acao: "excluir", recurso: "laudo", recursoId: id });

  revalidatePath("/laudos");
  revalidatePath("/", "page");
  if (pacienteId) {
    revalidatePath(`/pacientes/${pacienteId}`);
    redirect(`/pacientes/${pacienteId}?tab=prontuario&success=Laudo+exclu%C3%ADdo`);
  }
  redirect("/pacientes");
}
