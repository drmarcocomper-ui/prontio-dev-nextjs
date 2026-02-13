"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { tratarErroSupabase } from "@/lib/supabase-errors";
import { campoObrigatorio, tamanhoMaximo, dataNaoFutura, valorPermitido, uuidValido } from "@/lib/validators";
import { TEXTO_MAX_LENGTH, OBSERVACOES_MAX_LENGTH, CID_MAX_LENGTH, TIPO_LABELS } from "./types";
import { getMedicoId } from "@/lib/clinica";

export type ProntuarioFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

function validarCamposProntuario(formData: FormData) {
  const paciente_id = (formData.get("paciente_id") as string) || null;
  const data = formData.get("data") as string;
  const tipo = (formData.get("tipo") as string) || null;
  const cid = (formData.get("cid") as string)?.trim() || null;
  const queixa_principal = (formData.get("queixa_principal") as string)?.trim() || null;
  const historia_doenca = (formData.get("historia_doenca") as string)?.trim() || null;
  const exame_fisico = (formData.get("exame_fisico") as string)?.trim() || null;
  const hipotese_diagnostica = (formData.get("hipotese_diagnostica") as string)?.trim() || null;
  const conduta = (formData.get("conduta") as string)?.trim() || null;
  const observacoes = (formData.get("observacoes") as string)?.trim() || null;

  const fieldErrors: Record<string, string> = {};

  campoObrigatorio(fieldErrors, "paciente_id", paciente_id, "Selecione um paciente.");
  if (campoObrigatorio(fieldErrors, "data", data, "Data é obrigatória.")) {
    dataNaoFutura(fieldErrors, "data", data);
  }
  if (!queixa_principal && !conduta) {
    fieldErrors.queixa_principal = "Preencha ao menos a queixa principal ou a conduta.";
  }

  valorPermitido(fieldErrors, "tipo", tipo, Object.keys(TIPO_LABELS));
  tamanhoMaximo(fieldErrors, "cid", cid, CID_MAX_LENGTH);
  tamanhoMaximo(fieldErrors, "queixa_principal", queixa_principal, TEXTO_MAX_LENGTH);
  tamanhoMaximo(fieldErrors, "historia_doenca", historia_doenca, TEXTO_MAX_LENGTH);
  tamanhoMaximo(fieldErrors, "exame_fisico", exame_fisico, TEXTO_MAX_LENGTH);
  tamanhoMaximo(fieldErrors, "hipotese_diagnostica", hipotese_diagnostica, TEXTO_MAX_LENGTH);
  tamanhoMaximo(fieldErrors, "conduta", conduta, TEXTO_MAX_LENGTH);
  tamanhoMaximo(fieldErrors, "observacoes", observacoes, OBSERVACOES_MAX_LENGTH);

  return {
    paciente_id, data, tipo, cid,
    queixa_principal, historia_doenca, exame_fisico,
    hipotese_diagnostica, conduta, observacoes,
    fieldErrors,
  };
}

export async function criarProntuario(
  _prev: ProntuarioFormState,
  formData: FormData
): Promise<ProntuarioFormState> {
  const {
    paciente_id, data, tipo, cid,
    queixa_principal, historia_doenca, exame_fisico,
    hipotese_diagnostica, conduta, observacoes,
    fieldErrors,
  } = validarCamposProntuario(formData);

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const supabase = await createClient();
  let medicoId: string;
  try {
    medicoId = await getMedicoId();
  } catch {
    return { error: "Não foi possível identificar o médico responsável." };
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
      cid,
      queixa_principal,
      historia_doenca,
      exame_fisico,
      hipotese_diagnostica,
      conduta,
      observacoes,
    })
    .select("id")
    .single();

  if (error) {
    return { error: tratarErroSupabase(error, "criar", "prontuário") };
  }

  revalidatePath("/prontuarios");
  revalidatePath("/");
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
    paciente_id, data, tipo, cid,
    queixa_principal, historia_doenca, exame_fisico,
    hipotese_diagnostica, conduta, observacoes,
    fieldErrors,
  } = validarCamposProntuario(formData);

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const supabase = await createClient();
  let medicoId: string;
  try {
    medicoId = await getMedicoId();
  } catch {
    return { error: "Não foi possível identificar o médico responsável." };
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
      cid,
      queixa_principal,
      historia_doenca,
      exame_fisico,
      hipotese_diagnostica,
      conduta,
      observacoes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("medico_id", medicoId);

  if (error) {
    return { error: tratarErroSupabase(error, "atualizar", "prontuário") };
  }

  revalidatePath("/prontuarios");
  revalidatePath("/");
  redirect(`/prontuarios/${id}?success=Prontu%C3%A1rio+atualizado`);
}

export async function excluirProntuario(id: string): Promise<void> {
  if (!uuidValido(id)) {
    throw new Error("ID inválido.");
  }

  const supabase = await createClient();
  const medicoId = await getMedicoId();

  const { error } = await supabase.from("prontuarios").delete().eq("id", id).eq("medico_id", medicoId);

  if (error) {
    throw new Error(tratarErroSupabase(error, "excluir", "prontuário"));
  }

  revalidatePath("/prontuarios");
  revalidatePath("/");
  redirect("/prontuarios?success=Prontu%C3%A1rio+exclu%C3%ADdo");
}
