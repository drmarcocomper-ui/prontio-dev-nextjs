"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { tratarErroSupabase } from "@/lib/supabase-errors";
import { campoObrigatorio, tamanhoMaximo, valorPermitido, uuidValido } from "@/lib/validators";
import {
  INDICACAO_CLINICA_MAX_LENGTH,
  PROCEDIMENTOS_MAX_LENGTH,
  OBSERVACOES_MAX_LENGTH,
  CARACTERES_ATENDIMENTO,
  TIPOS_INTERNACAO,
  REGIMES_INTERNACAO,
  INDICACOES_ACIDENTE,
} from "./types";
import { getClinicaAtual, getMedicoIdSafe, isProfissional } from "@/lib/clinica";
import { rateLimit } from "@/lib/rate-limit";
import { logAuditEvent } from "@/lib/audit";

export type InternacaoFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

function validarCamposInternacao(formData: FormData) {
  const paciente_id = (formData.get("paciente_id") as string) || null;
  const data = (formData.get("data") as string) || null;
  const hospital_nome = (formData.get("hospital_nome") as string)?.trim() || null;
  const data_sugerida_internacao = (formData.get("data_sugerida_internacao") as string) || null;
  const carater_atendimento = (formData.get("carater_atendimento") as string) || null;
  const tipo_internacao = (formData.get("tipo_internacao") as string) || null;
  const regime_internacao = (formData.get("regime_internacao") as string) || null;
  const diarias_raw = (formData.get("diarias_solicitadas") as string) || null;
  const diarias_solicitadas = diarias_raw ? parseInt(diarias_raw, 10) : null;
  const previsao_opme = formData.get("previsao_opme") === "sim";
  const previsao_quimioterapico = formData.get("previsao_quimioterapico") === "sim";
  const indicacao_clinica = (formData.get("indicacao_clinica") as string)?.trim() || null;
  const cid_principal = (formData.get("cid_principal") as string)?.trim() || null;
  const cid_2 = (formData.get("cid_2") as string)?.trim() || null;
  const cid_3 = (formData.get("cid_3") as string)?.trim() || null;
  const cid_4 = (formData.get("cid_4") as string)?.trim() || null;
  const indicacao_acidente = (formData.get("indicacao_acidente") as string) || null;
  const procedimentos = (formData.get("procedimentos") as string)?.trim() || null;
  const observacoes = (formData.get("observacoes") as string)?.trim() || null;

  const fieldErrors: Record<string, string> = {};

  if (campoObrigatorio(fieldErrors, "paciente_id", paciente_id, "Selecione um paciente.")) {
    if (!uuidValido(paciente_id!)) fieldErrors.paciente_id = "Paciente inválido.";
  }

  campoObrigatorio(fieldErrors, "indicacao_clinica", indicacao_clinica, "Indicação clínica é obrigatória.");
  tamanhoMaximo(fieldErrors, "indicacao_clinica", indicacao_clinica, INDICACAO_CLINICA_MAX_LENGTH);
  tamanhoMaximo(fieldErrors, "procedimentos", procedimentos, PROCEDIMENTOS_MAX_LENGTH);
  tamanhoMaximo(fieldErrors, "observacoes", observacoes, OBSERVACOES_MAX_LENGTH);

  valorPermitido(fieldErrors, "carater_atendimento", carater_atendimento, CARACTERES_ATENDIMENTO);
  valorPermitido(fieldErrors, "tipo_internacao", tipo_internacao, TIPOS_INTERNACAO);
  valorPermitido(fieldErrors, "regime_internacao", regime_internacao, REGIMES_INTERNACAO);
  valorPermitido(fieldErrors, "indicacao_acidente", indicacao_acidente, INDICACOES_ACIDENTE);

  if (diarias_solicitadas !== null && (isNaN(diarias_solicitadas) || diarias_solicitadas < 1)) {
    fieldErrors.diarias_solicitadas = "Número de diárias deve ser maior que zero.";
  }

  return {
    paciente_id,
    data,
    hospital_nome,
    data_sugerida_internacao,
    carater_atendimento,
    tipo_internacao,
    regime_internacao,
    diarias_solicitadas,
    previsao_opme,
    previsao_quimioterapico,
    indicacao_clinica,
    cid_principal,
    cid_2,
    cid_3,
    cid_4,
    indicacao_acidente,
    procedimentos,
    observacoes,
    fieldErrors,
  };
}

export async function criarInternacao(
  _prev: InternacaoFormState,
  formData: FormData
): Promise<InternacaoFormState> {
  const { fieldErrors, ...fields } = validarCamposInternacao(formData);

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const ctx = await getClinicaAtual();
  if (!ctx || !isProfissional(ctx.papel)) {
    return { error: "Apenas profissionais de saúde podem solicitar internações." };
  }

  const supabase = await createClient();
  const medicoId = await getMedicoIdSafe();
  if (!medicoId) return { error: "Não foi possível identificar o médico responsável." };

  const { success: allowed } = await rateLimit({
    key: `criar_internacao:${medicoId}`,
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
    .from("internacoes")
    .insert({
      paciente_id: fields.paciente_id,
      medico_id: medicoId,
      data: fields.data,
      hospital_nome: fields.hospital_nome,
      data_sugerida_internacao: fields.data_sugerida_internacao,
      carater_atendimento: fields.carater_atendimento,
      tipo_internacao: fields.tipo_internacao,
      regime_internacao: fields.regime_internacao,
      diarias_solicitadas: fields.diarias_solicitadas,
      previsao_opme: fields.previsao_opme,
      previsao_quimioterapico: fields.previsao_quimioterapico,
      indicacao_clinica: fields.indicacao_clinica,
      cid_principal: fields.cid_principal,
      cid_2: fields.cid_2,
      cid_3: fields.cid_3,
      cid_4: fields.cid_4,
      indicacao_acidente: fields.indicacao_acidente,
      procedimentos: fields.procedimentos,
      observacoes: fields.observacoes,
    })
    .select("id")
    .single();

  if (error) {
    return { error: tratarErroSupabase(error, "criar", "internação") };
  }

  void logAuditEvent({ userId: ctx.userId, clinicaId: ctx.clinicaId, acao: "criar", recurso: "internacao", detalhes: { paciente_id: fields.paciente_id } });

  revalidatePath("/internacoes");
  revalidatePath("/", "page");
  revalidatePath(`/pacientes/${fields.paciente_id}`);
  redirect(`/pacientes/${fields.paciente_id}?tab=prontuario&success=Interna%C3%A7%C3%A3o+registrada`);
}

export async function atualizarInternacao(
  _prev: InternacaoFormState,
  formData: FormData
): Promise<InternacaoFormState> {
  const id = formData.get("id") as string;
  if (!uuidValido(id)) {
    return { error: "ID inválido." };
  }

  const { fieldErrors, ...fields } = validarCamposInternacao(formData);

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const ctx = await getClinicaAtual();
  if (!ctx || !isProfissional(ctx.papel)) {
    return { error: "Apenas profissionais de saúde podem editar internações." };
  }

  const supabase = await createClient();
  const medicoId = await getMedicoIdSafe();
  if (!medicoId) return { error: "Não foi possível identificar o médico responsável." };

  const { success: allowed } = await rateLimit({
    key: `atualizar_internacao:${medicoId}`,
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
    .from("internacoes")
    .update({
      paciente_id: fields.paciente_id,
      data: fields.data,
      hospital_nome: fields.hospital_nome,
      data_sugerida_internacao: fields.data_sugerida_internacao,
      carater_atendimento: fields.carater_atendimento,
      tipo_internacao: fields.tipo_internacao,
      regime_internacao: fields.regime_internacao,
      diarias_solicitadas: fields.diarias_solicitadas,
      previsao_opme: fields.previsao_opme,
      previsao_quimioterapico: fields.previsao_quimioterapico,
      indicacao_clinica: fields.indicacao_clinica,
      cid_principal: fields.cid_principal,
      cid_2: fields.cid_2,
      cid_3: fields.cid_3,
      cid_4: fields.cid_4,
      indicacao_acidente: fields.indicacao_acidente,
      procedimentos: fields.procedimentos,
      observacoes: fields.observacoes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("medico_id", medicoId);

  if (error) {
    return { error: tratarErroSupabase(error, "atualizar", "internação") };
  }

  void logAuditEvent({ userId: ctx.userId, clinicaId: ctx.clinicaId, acao: "atualizar", recurso: "internacao", recursoId: id });

  revalidatePath("/internacoes");
  revalidatePath("/", "page");
  revalidatePath(`/pacientes/${fields.paciente_id}`);
  redirect(`/internacoes/${id}?success=Interna%C3%A7%C3%A3o+atualizada`);
}

export async function excluirInternacao(id: string): Promise<void> {
  if (!uuidValido(id)) {
    throw new Error("ID inválido.");
  }

  const ctx = await getClinicaAtual();
  if (!ctx || !isProfissional(ctx.papel)) {
    throw new Error("Apenas profissionais de saúde podem excluir internações.");
  }

  const supabase = await createClient();
  const medicoId = await getMedicoIdSafe();
  if (!medicoId) {
    throw new Error("Não foi possível identificar o médico responsável.");
  }

  const { success: allowed } = await rateLimit({
    key: `excluir_internacao:${medicoId}`,
    maxAttempts: 20,
    windowMs: 60 * 60 * 1000,
  });
  if (!allowed) {
    throw new Error("Muitas tentativas. Aguarde antes de tentar novamente.");
  }

  const { data: internacao } = await supabase
    .from("internacoes")
    .select("paciente_id")
    .eq("id", id)
    .eq("medico_id", medicoId)
    .single();

  const pacienteId = internacao?.paciente_id;

  const { error } = await supabase.from("internacoes").delete().eq("id", id).eq("medico_id", medicoId);

  if (error) {
    throw new Error(tratarErroSupabase(error, "excluir", "internação"));
  }

  void logAuditEvent({ userId: ctx.userId, clinicaId: ctx.clinicaId, acao: "excluir", recurso: "internacao", recursoId: id });

  revalidatePath("/internacoes");
  revalidatePath("/", "page");
  if (pacienteId) {
    revalidatePath(`/pacientes/${pacienteId}`);
    redirect(`/pacientes/${pacienteId}?tab=prontuario&success=Interna%C3%A7%C3%A3o+exclu%C3%ADda`);
  }
  redirect("/pacientes");
}
