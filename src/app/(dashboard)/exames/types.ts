export interface ExamePaciente {
  id: string;
  nome: string;
}

export interface ExameListItem {
  id: string;
  data: string;
  exames: string;
  pacientes: ExamePaciente;
}

export interface Exame {
  id: string;
  data: string;
  exames: string;
  indicacao_clinica: string | null;
  observacoes: string | null;
  created_at: string;
  pacientes: ExamePaciente;
}

export interface ExameImpressao {
  id: string;
  data: string;
  exames: string;
  indicacao_clinica: string | null;
  observacoes: string | null;
  pacientes: {
    id: string;
    nome: string;
    cpf: string | null;
    convenio: string | null;
  };
}

export interface ExameDefaults {
  id?: string;
  paciente_id?: string;
  paciente_nome?: string;
  data?: string;
  exames?: string | null;
  indicacao_clinica?: string | null;
  observacoes?: string | null;
}

export interface ExameComPaciente {
  id: string;
  data: string;
  exames: string;
  indicacao_clinica: string | null;
  observacoes: string | null;
  pacientes: ExamePaciente;
}

export const EXAMES_MAX_LENGTH = 5000;
export const INDICACAO_MAX_LENGTH = 2000;
export const OBSERVACOES_MAX_LENGTH = 1000;

// --- Helpers de formatação (re-exports) ---
export { formatDate, formatDateLong, formatDateMedium, getInitials, formatCPF } from "@/lib/format";

// --- Parser de exames para impressão ---
export interface ExameItem {
  nome: string;
  codigoTuss: string | null;
}

/**
 * Analisa o texto de exames e extrai itens estruturados.
 * Formato esperado do catálogo:
 *   - Nome do Exame (TUSS: 12345678)
 *
 * Linhas que não seguem o padrão são tratadas como texto livre.
 */
export function parseExames(text: string): { items: ExameItem[]; freeText: string[] } {
  const lines = text.split("\n");
  const items: ExameItem[] = [];
  const freeText: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (/^-\s+/.test(trimmed)) {
      const raw = trimmed.replace(/^-\s+/, "");
      const tussMatch = raw.match(/\(TUSS:\s*(\d+)\)\s*$/);
      if (tussMatch) {
        const nome = raw.replace(/\s*\(TUSS:\s*\d+\)\s*$/, "");
        items.push({ nome, codigoTuss: tussMatch[1] });
      } else {
        items.push({ nome: raw, codigoTuss: null });
      }
    } else {
      freeText.push(trimmed);
    }
  }

  return { items, freeText };
}
