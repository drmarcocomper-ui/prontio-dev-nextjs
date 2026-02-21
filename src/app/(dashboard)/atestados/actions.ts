"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { tratarErroSupabase } from "@/lib/supabase-errors";
import { campoObrigatorio, tamanhoMaximo, dataNaoFutura, uuidValido, valorPermitido } from "@/lib/validators";
import { CONTEUDO_MAX_LENGTH, CID_MAX_LENGTH, OBSERVACOES_MAX_LENGTH, TIPOS_ATESTADO } from "./types";
import { getClinicaAtual, getMedicoIdSafe, isProfissional } from "@/lib/clinica";
import { rateLimit } from "@/lib/rate-limit";
import { logAuditEvent } from "@/lib/audit";

export type AtestadoFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

function validarCamposAtestado(formData: FormData) {
  const paciente_id = (formData.get("paciente_id") as string) || null;
  const data = (formData.get("data") as string) || null;
  const tipo = (formData.get("tipo") as string) || null;
  const conteudo = (formData.get("conteudo") as string)?.trim() || null;
  const cid = (formData.get("cid") as string)?.trim() || null;
  const dias_afastamento_raw = (formData.get("dias_afastamento") as string)?.trim() || null;
  const observacoes = (formData.get("observacoes") as string)?.trim() || null;

  const fieldErrors: Record<string, string> = {};

  if (campoObrigatorio(fieldErrors, "paciente_id", paciente_id, "Selecione um paciente.")) {
    if (!uuidValido(paciente_id!)) fieldErrors.paciente_id = "Paciente inválido.";
  }

  dataNaoFutura(fieldErrors, "data", data);

  campoObrigatorio(fieldErrors, "tipo", tipo, "Selecione o tipo de atestado.");
  valorPermitido(fieldErrors, "tipo", tipo, TIPOS_ATESTADO, "Tipo de atestado inválido.");

  campoObrigatorio(fieldErrors, "conteudo", conteudo, "Conteúdo é obrigatório.");
  tamanhoMaximo(fieldErrors, "conteudo", conteudo, CONTEUDO_MAX_LENGTH);
  tamanhoMaximo(fieldErrors, "cid", cid, CID_MAX_LENGTH);
  tamanhoMaximo(fieldErrors, "observacoes", observacoes, OBSERVACOES_MAX_LENGTH);

  let dias_afastamento: number | null = null;
  if (dias_afastamento_raw) {
    const parsed = parseInt(dias_afastamento_raw, 10);
    if (isNaN(parsed) || parsed <= 0) {
      fieldErrors.dias_afastamento = "Informe um número inteiro positivo.";
    } else {
      dias_afastamento = parsed;
    }
  }

  return { paciente_id, data, tipo, conteudo, cid, dias_afastamento, observacoes, fieldErrors };
}

export async function criarAtestado(
  _prev: AtestadoFormState,
  formData: FormData
): Promise<AtestadoFormState> {
  const { fieldErrors, ...fields } = validarCamposAtestado(formData);

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const ctx = await getClinicaAtual();
  if (!ctx || !isProfissional(ctx.papel)) {
    return { error: "Apenas profissionais de saúde podem emitir atestados." };
  }

  const supabase = await createClient();
  const medicoId = await getMedicoIdSafe();
  if (!medicoId) return { error: "Não foi possível identificar o médico responsável." };

  const { success: allowed } = await rateLimit({
    key: `criar_atestado:${medicoId}`,
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
    .from("atestados")
    .insert({
      paciente_id: fields.paciente_id,
      medico_id: medicoId,
      data: fields.data,
      tipo: fields.tipo,
      conteudo: fields.conteudo,
      cid: fields.cid,
      dias_afastamento: fields.dias_afastamento,
      observacoes: fields.observacoes,
    })
    .select("id")
    .single();

  if (error) {
    return { error: tratarErroSupabase(error, "criar", "atestado") };
  }

  void logAuditEvent({ userId: ctx.userId, clinicaId: ctx.clinicaId, acao: "criar", recurso: "atestado", detalhes: { tipo: fields.tipo, paciente_id: fields.paciente_id } });

  revalidatePath("/atestados");
  revalidatePath("/", "page");
  revalidatePath(`/pacientes/${fields.paciente_id}`);
  redirect(`/pacientes/${fields.paciente_id}?tab=prontuario&success=Atestado+registrado`);
}

export async function atualizarAtestado(
  _prev: AtestadoFormState,
  formData: FormData
): Promise<AtestadoFormState> {
  const id = formData.get("id") as string;
  if (!uuidValido(id)) {
    return { error: "ID inválido." };
  }

  const { fieldErrors, ...fields } = validarCamposAtestado(formData);

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const ctx = await getClinicaAtual();
  if (!ctx || !isProfissional(ctx.papel)) {
    return { error: "Apenas profissionais de saúde podem editar atestados." };
  }

  const supabase = await createClient();
  const medicoId = await getMedicoIdSafe();
  if (!medicoId) return { error: "Não foi possível identificar o médico responsável." };

  const { success: allowed } = await rateLimit({
    key: `atualizar_atestado:${medicoId}`,
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
    .from("atestados")
    .update({
      paciente_id: fields.paciente_id,
      data: fields.data,
      tipo: fields.tipo,
      conteudo: fields.conteudo,
      cid: fields.cid,
      dias_afastamento: fields.dias_afastamento,
      observacoes: fields.observacoes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("medico_id", medicoId);

  if (error) {
    return { error: tratarErroSupabase(error, "atualizar", "atestado") };
  }

  void logAuditEvent({ userId: ctx.userId, clinicaId: ctx.clinicaId, acao: "atualizar", recurso: "atestado", recursoId: id });

  revalidatePath("/atestados");
  revalidatePath("/", "page");
  revalidatePath(`/pacientes/${fields.paciente_id}`);
  redirect(`/atestados/${id}?success=Atestado+atualizado`);
}

export async function excluirAtestado(id: string): Promise<void> {
  if (!uuidValido(id)) {
    throw new Error("ID inválido.");
  }

  const ctx = await getClinicaAtual();
  if (!ctx || !isProfissional(ctx.papel)) {
    throw new Error("Apenas profissionais de saúde podem excluir atestados.");
  }

  const supabase = await createClient();
  const medicoId = await getMedicoIdSafe();
  if (!medicoId) {
    throw new Error("Não foi possível identificar o médico responsável.");
  }

  const { success: allowed } = await rateLimit({
    key: `excluir_atestado:${medicoId}`,
    maxAttempts: 20,
    windowMs: 60 * 60 * 1000,
  });
  if (!allowed) {
    throw new Error("Muitas tentativas. Aguarde antes de tentar novamente.");
  }

  const { data: atestado } = await supabase
    .from("atestados")
    .select("paciente_id")
    .eq("id", id)
    .eq("medico_id", medicoId)
    .single();

  const pacienteId = atestado?.paciente_id;

  const { error } = await supabase.from("atestados").delete().eq("id", id).eq("medico_id", medicoId);

  if (error) {
    throw new Error(tratarErroSupabase(error, "excluir", "atestado"));
  }

  void logAuditEvent({ userId: ctx.userId, clinicaId: ctx.clinicaId, acao: "excluir", recurso: "atestado", recursoId: id });

  revalidatePath("/atestados");
  revalidatePath("/", "page");
  if (pacienteId) {
    revalidatePath(`/pacientes/${pacienteId}`);
    redirect(`/pacientes/${pacienteId}?tab=prontuario&success=Atestado+exclu%C3%ADdo`);
  }
  redirect("/pacientes");
}
