export { INPUT_CLASS } from "@/components/form-utils";

export const NOME_CONSULTORIO_MAX = 255;
export const ENDERECO_MAX = 255;
export const CIDADE_MAX = 100;
export const ESTADO_MAX = 2;
export const CNPJ_MAX = 18; // formatted: 00.000.000/0000-00
export const TELEFONE_MAX = 15; // formatted: (00) 00000-0000
export const NOME_PROFISSIONAL_MAX = 255;
export const ESPECIALIDADE_MAX = 100;
export const CRM_MAX = 50;
export const RQE_MAX = 50;
export const EMAIL_MAX = 254;
export const SENHA_MIN = 6;
export const SENHA_MAX = 128;

export const DIAS = [
  { key: "seg", label: "Segunda-feira" },
  { key: "ter", label: "Terça-feira" },
  { key: "qua", label: "Quarta-feira" },
  { key: "qui", label: "Quinta-feira" },
  { key: "sex", label: "Sexta-feira" },
  { key: "sab", label: "Sábado" },
];

// --- Máscaras de input (re-exports) ---
export { maskCNPJ, maskPhone } from "@/lib/masks";
