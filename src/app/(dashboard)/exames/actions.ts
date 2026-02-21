"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { tratarErroSupabase } from "@/lib/supabase-errors";
import { campoObrigatorio, tamanhoMaximo, dataNaoFutura, uuidValido } from "@/lib/validators";
import { EXAMES_MAX_LENGTH, INDICACAO_MAX_LENGTH, OBSERVACOES_MAX_LENGTH } from "./types";
import { getClinicaAtual, getMedicoIdSafe, isProfissional } from "@/lib/clinica";
import { rateLimit } from "@/lib/rate-limit";
import { logAuditEvent } from "@/lib/audit";

export type ExameFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

function validarCamposExame(formData: FormData) {
  const paciente_id = (formData.get("paciente_id") as string) || null;
  const data = (formData.get("data") as string) || null;
  const exames = (formData.get("exames") as string)?.trim() || null;
  const indicacao_clinica = (formData.get("indicacao_clinica") as string)?.trim() || null;
  const observacoes = (formData.get("observacoes") as string)?.trim() || null;

  const fieldErrors: Record<string, string> = {};

  if (campoObrigatorio(fieldErrors, "paciente_id", paciente_id, "Selecione um paciente.")) {
    if (!uuidValido(paciente_id!)) fieldErrors.paciente_id = "Paciente inválido.";
  }

  dataNaoFutura(fieldErrors, "data", data);

  campoObrigatorio(fieldErrors, "exames", exames, "Exames é obrigatório.");
  tamanhoMaximo(fieldErrors, "exames", exames, EXAMES_MAX_LENGTH);
  tamanhoMaximo(fieldErrors, "indicacao_clinica", indicacao_clinica, INDICACAO_MAX_LENGTH);
  tamanhoMaximo(fieldErrors, "observacoes", observacoes, OBSERVACOES_MAX_LENGTH);

  return { paciente_id, data, exames, indicacao_clinica, observacoes, fieldErrors };
}

export async function criarExame(
  _prev: ExameFormState,
  formData: FormData
): Promise<ExameFormState> {
  const { fieldErrors, ...fields } = validarCamposExame(formData);

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const ctx = await getClinicaAtual();
  if (!ctx || !isProfissional(ctx.papel)) {
    return { error: "Apenas profissionais de saúde podem solicitar exames." };
  }

  const supabase = await createClient();
  const medicoId = await getMedicoIdSafe();
  if (!medicoId) return { error: "Não foi possível identificar o médico responsável." };

  const { success: allowed } = await rateLimit({
    key: `criar_exame:${medicoId}`,
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
    .from("solicitacoes_exames")
    .insert({
      paciente_id: fields.paciente_id,
      medico_id: medicoId,
      data: fields.data,
      exames: fields.exames,
      indicacao_clinica: fields.indicacao_clinica,
      observacoes: fields.observacoes,
    })
    .select("id")
    .single();

  if (error) {
    return { error: tratarErroSupabase(error, "criar", "solicitação de exame") };
  }

  void logAuditEvent({ userId: ctx.userId, clinicaId: ctx.clinicaId, acao: "criar", recurso: "exame", detalhes: { paciente_id: fields.paciente_id } });

  revalidatePath("/exames");
  revalidatePath("/", "page");
  revalidatePath(`/pacientes/${fields.paciente_id}`);
  redirect(`/pacientes/${fields.paciente_id}?tab=prontuario&success=Solicitação+registrada`);
}

export async function atualizarExame(
  _prev: ExameFormState,
  formData: FormData
): Promise<ExameFormState> {
  const id = formData.get("id") as string;
  if (!uuidValido(id)) {
    return { error: "ID inválido." };
  }

  const { fieldErrors, ...fields } = validarCamposExame(formData);

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const ctx = await getClinicaAtual();
  if (!ctx || !isProfissional(ctx.papel)) {
    return { error: "Apenas profissionais de saúde podem editar solicitações de exames." };
  }

  const supabase = await createClient();
  const medicoId = await getMedicoIdSafe();
  if (!medicoId) return { error: "Não foi possível identificar o médico responsável." };

  const { success: allowed } = await rateLimit({
    key: `atualizar_exame:${medicoId}`,
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
    .from("solicitacoes_exames")
    .update({
      paciente_id: fields.paciente_id,
      data: fields.data,
      exames: fields.exames,
      indicacao_clinica: fields.indicacao_clinica,
      observacoes: fields.observacoes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("medico_id", medicoId);

  if (error) {
    return { error: tratarErroSupabase(error, "atualizar", "solicitação de exame") };
  }

  void logAuditEvent({ userId: ctx.userId, clinicaId: ctx.clinicaId, acao: "atualizar", recurso: "exame", recursoId: id });

  revalidatePath("/exames");
  revalidatePath("/", "page");
  revalidatePath(`/pacientes/${fields.paciente_id}`);
  redirect(`/exames/${id}?success=Solicitação+atualizada`);
}

export async function excluirExame(id: string): Promise<void> {
  if (!uuidValido(id)) {
    throw new Error("ID inválido.");
  }

  const ctx = await getClinicaAtual();
  if (!ctx || !isProfissional(ctx.papel)) {
    throw new Error("Apenas profissionais de saúde podem excluir solicitações de exames.");
  }

  const supabase = await createClient();
  const medicoId = await getMedicoIdSafe();
  if (!medicoId) {
    throw new Error("Não foi possível identificar o médico responsável.");
  }

  const { success: allowed } = await rateLimit({
    key: `excluir_exame:${medicoId}`,
    maxAttempts: 20,
    windowMs: 60 * 60 * 1000,
  });
  if (!allowed) {
    throw new Error("Muitas tentativas. Aguarde antes de tentar novamente.");
  }

  const { data: exame } = await supabase
    .from("solicitacoes_exames")
    .select("paciente_id")
    .eq("id", id)
    .eq("medico_id", medicoId)
    .single();

  const pacienteId = exame?.paciente_id;

  const { error } = await supabase.from("solicitacoes_exames").delete().eq("id", id).eq("medico_id", medicoId);

  if (error) {
    throw new Error(tratarErroSupabase(error, "excluir", "solicitação de exame"));
  }

  void logAuditEvent({ userId: ctx.userId, clinicaId: ctx.clinicaId, acao: "excluir", recurso: "exame", recursoId: id });

  revalidatePath("/exames");
  revalidatePath("/", "page");
  if (pacienteId) {
    revalidatePath(`/pacientes/${pacienteId}`);
    redirect(`/pacientes/${pacienteId}?tab=prontuario&success=Solicitação+exclu%C3%ADda`);
  }
  redirect("/pacientes");
}
