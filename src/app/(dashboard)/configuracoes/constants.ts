export const INPUT_CLASS =
  "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-50";

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

export function maskCNPJ(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 14)
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export function maskPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  }
  return digits.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
}
