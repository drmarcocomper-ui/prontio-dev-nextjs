"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { tratarErroSupabase } from "@/lib/supabase-errors";
import { campoObrigatorio, tamanhoMaximo, dataNaoFutura, valorPermitido, uuidValido, DATE_RE } from "@/lib/validators";
import { TEXTO_MAX_LENGTH, TIPO_LABELS } from "./types";
import { getClinicaAtual, getMedicoIdSafe, isProfissional } from "@/lib/clinica";
import { rateLimit } from "@/lib/rate-limit";

export type ProntuarioFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

function validarCamposProntuario(formData: FormData) {
  const paciente_id = (formData.get("paciente_id") as string) || null;
  const data = formData.get("data") as string;
  const tipo = (formData.get("tipo") as string) || null;
  const queixa_principal = (formData.get("queixa_principal") as string)?.trim() || null;

  const fieldErrors: Record<string, string> = {};

  if (campoObrigatorio(fieldErrors, "paciente_id", paciente_id, "Selecione um paciente.")) {
    if (!uuidValido(paciente_id!)) fieldErrors.paciente_id = "Paciente inválido.";
  }
  if (campoObrigatorio(fieldErrors, "data", data, "Data é obrigatória.")) {
    if (!DATE_RE.test(data)) {
      fieldErrors.data = "Formato de data inválido.";
    } else {
      dataNaoFutura(fieldErrors, "data", data);
    }
  }
  campoObrigatorio(fieldErrors, "queixa_principal", queixa_principal, "Evolução é obrigatória.");

  valorPermitido(fieldErrors, "tipo", tipo, Object.keys(TIPO_LABELS));
  tamanhoMaximo(fieldErrors, "queixa_principal", queixa_principal, TEXTO_MAX_LENGTH);

  return {
    paciente_id, data, tipo,
    queixa_principal,
    fieldErrors,
  };
}

export async function criarProntuario(
  _prev: ProntuarioFormState,
  formData: FormData
): Promise<ProntuarioFormState> {
  const {
    paciente_id, data, tipo,
    queixa_principal,
    fieldErrors,
  } = validarCamposProntuario(formData);

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const ctx = await getClinicaAtual();
  if (!ctx || !isProfissional(ctx.papel)) {
    return { error: "Apenas profissionais de saúde podem registrar prontuários." };
  }

  const supabase = await createClient();
  const medicoId = await getMedicoIdSafe();
  if (!medicoId) return { error: "Não foi possível identificar o médico responsável." };

  const { success: allowed } = await rateLimit({
    key: `criar_prontuario:${medicoId}`,
    maxAttempts: 30,
    windowMs: 60 * 60 * 1000,
  });
  if (!allowed) {
    return { error: "Muitas tentativas. Aguarde antes de tentar novamente." };
  }

  const { data: paciente } = await supabase
    .from("pacientes")
    .select("id")
    .eq("id", paciente_id)
    .eq("medico_id", medicoId)
    .single();

  if (!paciente) {
    return { fieldErrors: { paciente_id: "Paciente não encontrado." } };
  }

  const { data: inserted, error } = await supabase
    .from("prontuarios")
    .insert({
      paciente_id,
      medico_id: medicoId,
      data,
      tipo,
      queixa_principal,
    })
    .select("id")
    .single();

  if (error) {
    return { error: tratarErroSupabase(error, "criar", "prontuário") };
  }

  revalidatePath("/prontuarios");
  revalidatePath("/", "page");
  redirect(`/prontuarios/${inserted.id}?success=Prontu%C3%A1rio+registrado`);
}

export async function atualizarProntuario(
  _prev: ProntuarioFormState,
  formData: FormData
): Promise<ProntuarioFormState> {
  const id = formData.get("id") as string;
  if (!uuidValido(id)) {
    return { error: "ID inválido." };
  }

  const {
    paciente_id, data, tipo,
    queixa_principal,
    fieldErrors,
  } = validarCamposProntuario(formData);

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const ctx = await getClinicaAtual();
  if (!ctx || !isProfissional(ctx.papel)) {
    return { error: "Apenas profissionais de saúde podem editar prontuários." };
  }

  const supabase = await createClient();
  const medicoId = await getMedicoIdSafe();
  if (!medicoId) return { error: "Não foi possível identificar o médico responsável." };

  const { success: allowed } = await rateLimit({
    key: `atualizar_prontuario:${medicoId}`,
    maxAttempts: 30,
    windowMs: 60 * 60 * 1000,
  });
  if (!allowed) {
    return { error: "Muitas tentativas. Aguarde antes de tentar novamente." };
  }

  const { data: paciente } = await supabase
    .from("pacientes")
    .select("id")
    .eq("id", paciente_id)
    .eq("medico_id", medicoId)
    .single();

  if (!paciente) {
    return { fieldErrors: { paciente_id: "Paciente não encontrado." } };
  }

  const { error } = await supabase
    .from("prontuarios")
    .update({
      paciente_id,
      data,
      tipo,
      queixa_principal,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("medico_id", medicoId);

  if (error) {
    return { error: tratarErroSupabase(error, "atualizar", "prontuário") };
  }

  revalidatePath("/prontuarios");
  revalidatePath("/", "page");
  redirect(`/prontuarios/${id}?success=Prontu%C3%A1rio+atualizado`);
}

export async function excluirProntuario(id: string): Promise<void> {
  if (!uuidValido(id)) {
    throw new Error("ID inválido.");
  }

  const ctx = await getClinicaAtual();
  if (!ctx || !isProfissional(ctx.papel)) {
    throw new Error("Apenas profissionais de saúde podem excluir prontuários.");
  }

  const supabase = await createClient();
  const medicoId = await getMedicoIdSafe();
  if (!medicoId) {
    throw new Error("Não foi possível identificar o médico responsável.");
  }

  const { success: allowed } = await rateLimit({
    key: `excluir_prontuario:${medicoId}`,
    maxAttempts: 20,
    windowMs: 60 * 60 * 1000,
  });
  if (!allowed) {
    throw new Error("Muitas tentativas. Aguarde antes de tentar novamente.");
  }

  const { error } = await supabase.from("prontuarios").delete().eq("id", id).eq("medico_id", medicoId);

  if (error) {
    throw new Error(tratarErroSupabase(error, "excluir", "prontuário"));
  }

  revalidatePath("/prontuarios");
  revalidatePath("/", "page");
  redirect("/prontuarios?success=Prontu%C3%A1rio+exclu%C3%ADdo");
}
