"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type PacienteFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function criarPaciente(
  _prev: PacienteFormState,
  formData: FormData
): Promise<PacienteFormState> {
  const nome = (formData.get("nome") as string)?.trim();
  const cpf = (formData.get("cpf") as string)?.replace(/\D/g, "") || null;
  const rg = (formData.get("rg") as string)?.trim() || null;
  const data_nascimento = (formData.get("data_nascimento") as string) || null;
  const sexo = (formData.get("sexo") as string) || null;
  const estado_civil = (formData.get("estado_civil") as string) || null;
  const telefone = (formData.get("telefone") as string)?.replace(/\D/g, "") || null;
  const email = (formData.get("email") as string)?.trim() || null;
  const cep = (formData.get("cep") as string)?.replace(/\D/g, "") || null;
  const endereco = (formData.get("endereco") as string)?.trim() || null;
  const numero = (formData.get("numero") as string)?.trim() || null;
  const complemento = (formData.get("complemento") as string)?.trim() || null;
  const bairro = (formData.get("bairro") as string)?.trim() || null;
  const cidade = (formData.get("cidade") as string)?.trim() || null;
  const estado = (formData.get("estado") as string) || null;
  const convenio = (formData.get("convenio") as string)?.trim() || null;
  const observacoes = (formData.get("observacoes") as string)?.trim() || null;

  // Validação
  const fieldErrors: Record<string, string> = {};

  if (!nome) {
    fieldErrors.nome = "Nome é obrigatório.";
  }

  if (cpf && cpf.length !== 11) {
    fieldErrors.cpf = "CPF deve ter 11 dígitos.";
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fieldErrors.email = "E-mail inválido.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("pacientes").insert({
    nome,
    cpf,
    rg,
    data_nascimento,
    sexo,
    estado_civil,
    telefone,
    email,
    cep,
    endereco,
    numero,
    complemento,
    bairro,
    cidade,
    estado,
    convenio,
    observacoes,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Já existe um paciente com este CPF." };
    }
    return { error: "Erro ao cadastrar paciente. Tente novamente." };
  }

  redirect("/pacientes?success=Paciente+cadastrado");
}

export async function atualizarPaciente(
  _prev: PacienteFormState,
  formData: FormData
): Promise<PacienteFormState> {
  const id = formData.get("id") as string;
  const nome = (formData.get("nome") as string)?.trim();
  const cpf = (formData.get("cpf") as string)?.replace(/\D/g, "") || null;
  const rg = (formData.get("rg") as string)?.trim() || null;
  const data_nascimento = (formData.get("data_nascimento") as string) || null;
  const sexo = (formData.get("sexo") as string) || null;
  const estado_civil = (formData.get("estado_civil") as string) || null;
  const telefone = (formData.get("telefone") as string)?.replace(/\D/g, "") || null;
  const email = (formData.get("email") as string)?.trim() || null;
  const cep = (formData.get("cep") as string)?.replace(/\D/g, "") || null;
  const endereco = (formData.get("endereco") as string)?.trim() || null;
  const numero = (formData.get("numero") as string)?.trim() || null;
  const complemento = (formData.get("complemento") as string)?.trim() || null;
  const bairro = (formData.get("bairro") as string)?.trim() || null;
  const cidade = (formData.get("cidade") as string)?.trim() || null;
  const estado = (formData.get("estado") as string) || null;
  const convenio = (formData.get("convenio") as string)?.trim() || null;
  const observacoes = (formData.get("observacoes") as string)?.trim() || null;

  const fieldErrors: Record<string, string> = {};

  if (!nome) {
    fieldErrors.nome = "Nome é obrigatório.";
  }

  if (cpf && cpf.length !== 11) {
    fieldErrors.cpf = "CPF deve ter 11 dígitos.";
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fieldErrors.email = "E-mail inválido.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("pacientes")
    .update({
      nome,
      cpf,
      rg,
      data_nascimento,
      sexo,
      estado_civil,
      telefone,
      email,
      cep,
      endereco,
      numero,
      complemento,
      bairro,
      cidade,
      estado,
      convenio,
      observacoes,
    })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") {
      return { error: "Já existe um paciente com este CPF." };
    }
    return { error: "Erro ao atualizar paciente. Tente novamente." };
  }

  redirect(`/pacientes/${id}?success=Paciente+atualizado`);
}

export async function excluirPaciente(id: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from("pacientes").delete().eq("id", id);

  if (error) {
    throw new Error("Erro ao excluir paciente.");
  }

  redirect("/pacientes?success=Paciente+exclu%C3%ADdo");
}
