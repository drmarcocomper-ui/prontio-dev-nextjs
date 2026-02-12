"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { tratarErroSupabase } from "@/lib/supabase-errors";
import { campoObrigatorio, tamanhoMaximo, dataNaoFutura, emailValido } from "@/lib/validators";
import {
  NOME_MAX_LENGTH, RG_MAX_LENGTH, EMAIL_MAX_LENGTH,
  ENDERECO_MAX_LENGTH, NUMERO_MAX_LENGTH, COMPLEMENTO_MAX_LENGTH,
  BAIRRO_MAX_LENGTH, CIDADE_MAX_LENGTH, CONVENIO_MAX_LENGTH,
  OBSERVACOES_MAX_LENGTH, validarCPF,
} from "./types";

export type PacienteFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

function validarCamposPaciente(formData: FormData) {
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

  campoObrigatorio(fieldErrors, "nome", nome, "Nome é obrigatório.");
  tamanhoMaximo(fieldErrors, "nome", nome, NOME_MAX_LENGTH);

  if (cpf && !validarCPF(cpf)) {
    fieldErrors.cpf = "CPF inválido.";
  }

  emailValido(fieldErrors, "email", email);
  tamanhoMaximo(fieldErrors, "email", email, EMAIL_MAX_LENGTH);

  if (telefone && (telefone.length < 10 || telefone.length > 11)) {
    fieldErrors.telefone = "Telefone deve ter 10 ou 11 dígitos.";
  }

  if (cep && cep.length !== 8) {
    fieldErrors.cep = "CEP deve ter 8 dígitos.";
  }

  dataNaoFutura(fieldErrors, "data_nascimento", data_nascimento, "A data de nascimento não pode ser no futuro.");

  tamanhoMaximo(fieldErrors, "rg", rg, RG_MAX_LENGTH);
  tamanhoMaximo(fieldErrors, "endereco", endereco, ENDERECO_MAX_LENGTH);
  tamanhoMaximo(fieldErrors, "numero", numero, NUMERO_MAX_LENGTH);
  tamanhoMaximo(fieldErrors, "complemento", complemento, COMPLEMENTO_MAX_LENGTH);
  tamanhoMaximo(fieldErrors, "bairro", bairro, BAIRRO_MAX_LENGTH);
  tamanhoMaximo(fieldErrors, "cidade", cidade, CIDADE_MAX_LENGTH);
  tamanhoMaximo(fieldErrors, "convenio", convenio, CONVENIO_MAX_LENGTH);
  tamanhoMaximo(fieldErrors, "observacoes", observacoes, OBSERVACOES_MAX_LENGTH);

  return {
    nome, cpf, rg, data_nascimento, sexo, estado_civil,
    telefone, email, cep, endereco, numero, complemento,
    bairro, cidade, estado, convenio, observacoes,
    fieldErrors,
  };
}

export async function criarPaciente(
  _prev: PacienteFormState,
  formData: FormData
): Promise<PacienteFormState> {
  const {
    nome, cpf, rg, data_nascimento, sexo, estado_civil,
    telefone, email, cep, endereco, numero, complemento,
    bairro, cidade, estado, convenio, observacoes,
    fieldErrors,
  } = validarCamposPaciente(formData);

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("pacientes").insert({
    nome, cpf, rg, data_nascimento, sexo, estado_civil,
    telefone, email, cep, endereco, numero, complemento,
    bairro, cidade, estado, convenio, observacoes,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Já existe um paciente com este CPF." };
    }
    return { error: tratarErroSupabase(error, "criar", "paciente") };
  }

  revalidatePath("/pacientes");
  revalidatePath("/");
  redirect("/pacientes?success=Paciente+cadastrado");
}

export async function atualizarPaciente(
  _prev: PacienteFormState,
  formData: FormData
): Promise<PacienteFormState> {
  const id = formData.get("id") as string;
  const {
    nome, cpf, rg, data_nascimento, sexo, estado_civil,
    telefone, email, cep, endereco, numero, complemento,
    bairro, cidade, estado, convenio, observacoes,
    fieldErrors,
  } = validarCamposPaciente(formData);

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("pacientes")
    .update({
      nome, cpf, rg, data_nascimento, sexo, estado_civil,
      telefone, email, cep, endereco, numero, complemento,
      bairro, cidade, estado, convenio, observacoes,
    })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") {
      return { error: "Já existe um paciente com este CPF." };
    }
    return { error: tratarErroSupabase(error, "atualizar", "paciente") };
  }

  revalidatePath("/pacientes");
  revalidatePath("/");
  redirect(`/pacientes/${id}?success=Paciente+atualizado`);
}

export async function excluirPaciente(id: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from("pacientes").delete().eq("id", id);

  if (error) {
    throw new Error(tratarErroSupabase(error, "excluir", "paciente"));
  }

  revalidatePath("/pacientes");
  revalidatePath("/");
  redirect("/pacientes?success=Paciente+exclu%C3%ADdo");
}
