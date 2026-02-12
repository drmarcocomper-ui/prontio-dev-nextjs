"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TEXTO_MAX_LENGTH, OBSERVACOES_MAX_LENGTH, CID_MAX_LENGTH } from "./types";

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

  if (!paciente_id) fieldErrors.paciente_id = "Selecione um paciente.";
  if (!data) {
    fieldErrors.data = "Data é obrigatória.";
  } else {
    const today = new Date().toISOString().split("T")[0];
    if (data > today) {
      fieldErrors.data = "A data não pode ser no futuro.";
    }
  }
  if (!queixa_principal && !conduta) {
    fieldErrors.queixa_principal = "Preencha ao menos a queixa principal ou a conduta.";
  }

  if (cid && cid.length > CID_MAX_LENGTH) {
    fieldErrors.cid = `Máximo de ${CID_MAX_LENGTH} caracteres.`;
  }
  if (queixa_principal && queixa_principal.length > TEXTO_MAX_LENGTH) {
    fieldErrors.queixa_principal = `Máximo de ${TEXTO_MAX_LENGTH} caracteres.`;
  }
  if (historia_doenca && historia_doenca.length > TEXTO_MAX_LENGTH) {
    fieldErrors.historia_doenca = `Máximo de ${TEXTO_MAX_LENGTH} caracteres.`;
  }
  if (exame_fisico && exame_fisico.length > TEXTO_MAX_LENGTH) {
    fieldErrors.exame_fisico = `Máximo de ${TEXTO_MAX_LENGTH} caracteres.`;
  }
  if (hipotese_diagnostica && hipotese_diagnostica.length > TEXTO_MAX_LENGTH) {
    fieldErrors.hipotese_diagnostica = `Máximo de ${TEXTO_MAX_LENGTH} caracteres.`;
  }
  if (conduta && conduta.length > TEXTO_MAX_LENGTH) {
    fieldErrors.conduta = `Máximo de ${TEXTO_MAX_LENGTH} caracteres.`;
  }
  if (observacoes && observacoes.length > OBSERVACOES_MAX_LENGTH) {
    fieldErrors.observacoes = `Máximo de ${OBSERVACOES_MAX_LENGTH} caracteres.`;
  }

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

  const { data: inserted, error } = await supabase
    .from("prontuarios")
    .insert({
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
    })
    .select("id")
    .single();

  if (error) {
    return { error: "Erro ao salvar prontuário. Tente novamente." };
  }

  redirect(`/prontuarios/${inserted.id}?success=Prontu%C3%A1rio+registrado`);
}

export async function atualizarProntuario(
  _prev: ProntuarioFormState,
  formData: FormData
): Promise<ProntuarioFormState> {
  const id = formData.get("id") as string;
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
    .eq("id", id);

  if (error) {
    return { error: "Erro ao atualizar prontuário. Tente novamente." };
  }

  redirect(`/prontuarios/${id}?success=Prontu%C3%A1rio+atualizado`);
}

export async function excluirProntuario(id: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from("prontuarios").delete().eq("id", id);

  if (error) {
    throw new Error("Erro ao excluir prontuário.");
  }

  redirect("/prontuarios?success=Prontu%C3%A1rio+exclu%C3%ADdo");
}
