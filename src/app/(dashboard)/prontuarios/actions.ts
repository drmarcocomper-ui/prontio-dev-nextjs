"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ProntuarioFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function criarProntuario(
  _prev: ProntuarioFormState,
  formData: FormData
): Promise<ProntuarioFormState> {
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
  if (!data) fieldErrors.data = "Data é obrigatória.";
  if (!queixa_principal && !conduta) {
    fieldErrors.queixa_principal = "Preencha ao menos a queixa principal ou a conduta.";
  }

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

  redirect(`/prontuarios/${inserted.id}`);
}

export async function excluirProntuario(id: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from("prontuarios").delete().eq("id", id);

  if (error) {
    throw new Error("Erro ao excluir prontuário.");
  }

  redirect("/prontuarios");
}
