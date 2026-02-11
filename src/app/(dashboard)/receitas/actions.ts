"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ReceitaFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function criarReceita(
  _prev: ReceitaFormState,
  formData: FormData
): Promise<ReceitaFormState> {
  const paciente_id = (formData.get("paciente_id") as string) || null;
  const data = formData.get("data") as string;
  const tipo = (formData.get("tipo") as string) || null;
  const medicamentos = (formData.get("medicamentos") as string)?.trim() || null;
  const observacoes = (formData.get("observacoes") as string)?.trim() || null;

  const fieldErrors: Record<string, string> = {};

  if (!paciente_id) fieldErrors.paciente_id = "Selecione um paciente.";
  if (!data) fieldErrors.data = "Data é obrigatória.";
  if (!tipo) fieldErrors.tipo = "Selecione o tipo da receita.";
  if (!medicamentos) fieldErrors.medicamentos = "Medicamentos é obrigatório.";

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const supabase = await createClient();

  const { data: inserted, error } = await supabase
    .from("receitas")
    .insert({
      paciente_id,
      data,
      tipo,
      medicamentos,
      observacoes,
    })
    .select("id")
    .single();

  if (error) {
    return { error: "Erro ao salvar receita. Tente novamente." };
  }

  redirect(`/receitas/${inserted.id}?success=Receita+registrada`);
}

export async function atualizarReceita(
  _prev: ReceitaFormState,
  formData: FormData
): Promise<ReceitaFormState> {
  const id = formData.get("id") as string;
  const paciente_id = (formData.get("paciente_id") as string) || null;
  const data = formData.get("data") as string;
  const tipo = (formData.get("tipo") as string) || null;
  const medicamentos = (formData.get("medicamentos") as string)?.trim() || null;
  const observacoes = (formData.get("observacoes") as string)?.trim() || null;

  const fieldErrors: Record<string, string> = {};

  if (!paciente_id) fieldErrors.paciente_id = "Selecione um paciente.";
  if (!data) fieldErrors.data = "Data é obrigatória.";
  if (!tipo) fieldErrors.tipo = "Selecione o tipo da receita.";
  if (!medicamentos) fieldErrors.medicamentos = "Medicamentos é obrigatório.";

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("receitas")
    .update({
      paciente_id,
      data,
      tipo,
      medicamentos,
      observacoes,
    })
    .eq("id", id);

  if (error) {
    return { error: "Erro ao atualizar receita. Tente novamente." };
  }

  redirect(`/receitas/${id}?success=Receita+atualizada`);
}

export async function excluirReceita(id: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from("receitas").delete().eq("id", id);

  if (error) {
    throw new Error("Erro ao excluir receita.");
  }

  redirect("/receitas?success=Receita+exclu%C3%ADda");
}
