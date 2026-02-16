"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { tratarErroSupabase } from "@/lib/supabase-errors";
import { campoObrigatorio, tamanhoMaximo, dataNaoFutura, emailValido, valorPermitido, uuidValido } from "@/lib/validators";
import {
  NOME_MAX_LENGTH, RG_MAX_LENGTH, EMAIL_MAX_LENGTH,
  ENDERECO_MAX_LENGTH, NUMERO_MAX_LENGTH, COMPLEMENTO_MAX_LENGTH,
  BAIRRO_MAX_LENGTH, CIDADE_MAX_LENGTH,
  OBSERVACOES_MAX_LENGTH, validarCPF,
  SEXO_LABELS, ESTADO_CIVIL_LABELS, ESTADOS_UF, CONVENIO_LABELS,
} from "./types";
import { getMedicoId } from "@/lib/clinica";

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

  valorPermitido(fieldErrors, "sexo", sexo, Object.keys(SEXO_LABELS));
  valorPermitido(fieldErrors, "estado_civil", estado_civil, Object.keys(ESTADO_CIVIL_LABELS));
  dataNaoFutura(fieldErrors, "data_nascimento", data_nascimento, "A data de nascimento não pode ser no futuro.");

  tamanhoMaximo(fieldErrors, "rg", rg, RG_MAX_LENGTH);
  tamanhoMaximo(fieldErrors, "endereco", endereco, ENDERECO_MAX_LENGTH);
  tamanhoMaximo(fieldErrors, "numero", numero, NUMERO_MAX_LENGTH);
  tamanhoMaximo(fieldErrors, "complemento", complemento, COMPLEMENTO_MAX_LENGTH);
  tamanhoMaximo(fieldErrors, "bairro", bairro, BAIRRO_MAX_LENGTH);
  tamanhoMaximo(fieldErrors, "cidade", cidade, CIDADE_MAX_LENGTH);
  valorPermitido(fieldErrors, "estado", estado, ESTADOS_UF);
  valorPermitido(fieldErrors, "convenio", convenio, Object.keys(CONVENIO_LABELS));
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
  let medicoId: string;
  try {
    medicoId = await getMedicoId();
  } catch {
    return { error: "Não foi possível identificar o médico responsável." };
  }

  const { error } = await supabase.from("pacientes").insert({
    medico_id: medicoId,
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
  if (!uuidValido(id)) {
    return { error: "ID inválido." };
  }

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
  let medicoId: string;
  try {
    medicoId = await getMedicoId();
  } catch {
    return { error: "Não foi possível identificar o médico responsável." };
  }

  const { error } = await supabase
    .from("pacientes")
    .update({
      nome, cpf, rg, data_nascimento, sexo, estado_civil,
      telefone, email, cep, endereco, numero, complemento,
      bairro, cidade, estado, convenio, observacoes,
    })
    .eq("id", id)
    .eq("medico_id", medicoId);

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

export type QuickPacienteResult =
  | { id: string; nome: string; error?: undefined; fieldErrors?: undefined }
  | { id?: undefined; nome?: undefined; error?: string; fieldErrors?: Record<string, string> };

export async function criarPacienteRapido(data: {
  nome: string;
  telefone?: string;
  convenio?: string;
}): Promise<QuickPacienteResult> {
  const nome = data.nome?.trim();
  const telefone = data.telefone?.replace(/\D/g, "") || null;
  const convenio = data.convenio || null;

  const fieldErrors: Record<string, string> = {};

  campoObrigatorio(fieldErrors, "nome", nome, "Nome é obrigatório.");
  tamanhoMaximo(fieldErrors, "nome", nome, NOME_MAX_LENGTH);

  if (telefone && (telefone.length < 10 || telefone.length > 11)) {
    fieldErrors.telefone = "Telefone deve ter 10 ou 11 dígitos.";
  }

  valorPermitido(fieldErrors, "convenio", convenio, Object.keys(CONVENIO_LABELS));

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  let medicoId: string;
  try {
    medicoId = await getMedicoId();
  } catch {
    return { error: "Não foi possível identificar o médico responsável." };
  }

  const supabase = await createClient();
  const { data: inserted, error } = await supabase
    .from("pacientes")
    .insert({ medico_id: medicoId, nome, telefone, convenio })
    .select("id")
    .single();

  if (error) {
    return { error: tratarErroSupabase(error, "criar", "paciente") };
  }

  revalidatePath("/pacientes");
  revalidatePath("/");
  return { id: inserted.id, nome: nome! };
}

export async function excluirPaciente(id: string): Promise<void> {
  if (!uuidValido(id)) {
    throw new Error("ID inválido.");
  }

  const supabase = await createClient();
  const medicoId = await getMedicoId();

  const { error } = await supabase.from("pacientes").delete().eq("id", id).eq("medico_id", medicoId);

  if (error) {
    throw new Error(tratarErroSupabase(error, "excluir", "paciente"));
  }

  revalidatePath("/pacientes");
  revalidatePath("/");
  redirect("/pacientes?success=Paciente+exclu%C3%ADdo");
}
