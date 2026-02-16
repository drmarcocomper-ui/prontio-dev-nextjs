export type ReceitaTipo = "simples" | "especial" | "controle_especial";

export interface ReceitaPaciente {
  id: string;
  nome: string;
}

export interface ReceitaListItem {
  id: string;
  data: string | null;
  tipo: ReceitaTipo;
  medicamentos: string;
  pacientes: ReceitaPaciente;
}

export interface Receita {
  id: string;
  data: string | null;
  tipo: ReceitaTipo;
  medicamentos: string;
  observacoes: string | null;
  created_at: string;
  pacientes: ReceitaPaciente;
}

export interface ReceitaImpressao {
  id: string;
  data: string | null;
  tipo: ReceitaTipo;
  medicamentos: string;
  observacoes: string | null;
  pacientes: {
    id: string;
    nome: string;
    cpf: string | null;
  };
}

export interface ReceitaDefaults {
  id?: string;
  paciente_id?: string;
  paciente_nome?: string;
  data?: string | null;
  tipo?: ReceitaTipo | null;
  medicamentos?: string | null;
  observacoes?: string | null;
}

export interface ReceitaComPaciente {
  id: string;
  data: string | null;
  tipo: ReceitaTipo;
  medicamentos: string;
  observacoes: string | null;
  pacientes: ReceitaPaciente;
}

export const MEDICAMENTOS_MAX_LENGTH = 5000;
export const OBSERVACOES_MAX_LENGTH = 1000;

export const TIPO_LABELS: Record<ReceitaTipo, string> = {
  simples: "Simples",
  especial: "Especial",
  controle_especial: "Controle Especial",
};

export const TIPO_LABELS_IMPRESSAO: Record<ReceitaTipo, string> = {
  simples: "Receita Simples",
  especial: "Receita Especial",
  controle_especial: "Receita de Controle Especial",
};

// --- Helpers de formatação (re-exports) ---
export { formatDate, formatDateLong, formatDateMedium, getInitials, formatCPF } from "@/lib/format";

// --- Parser de medicamentos para impressão ---
export interface MedicamentoItem {
  nome: string;
  detalhes: string | null;
}

/**
 * Analisa o texto de medicamentos e extrai itens estruturados.
 * Formato esperado do catálogo:
 *   - Nome do Medicamento
 *     Posologia | Quantidade | Via
 *
 * Linhas que não seguem o padrão são tratadas como texto livre.
 */
export function parseMedicamentos(text: string): { items: MedicamentoItem[]; freeText: string[] } {
  const lines = text.split("\n");
  const items: MedicamentoItem[] = [];
  const freeText: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Line starting with "- " is a medication name
    if (/^-\s+/.test(trimmed)) {
      const nome = trimmed.replace(/^-\s+/, "");
      // Check if next line is indented details
      let detalhes: string | null = null;
      if (i + 1 < lines.length) {
        const next = lines[i + 1];
        if (/^\s{2,}/.test(next) && next.trim() && !/^-\s+/.test(next.trim())) {
          detalhes = next.trim();
          i++; // skip the details line
        }
      }
      items.push({ nome, detalhes });
    } else {
      freeText.push(trimmed);
    }
  }

  return { items, freeText };
}
