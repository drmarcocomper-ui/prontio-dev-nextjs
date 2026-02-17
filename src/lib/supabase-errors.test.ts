import { describe, it, expect } from "vitest";
import { tratarErroSupabase } from "./supabase-errors";

describe("tratarErroSupabase", () => {
  it("retorna mensagem de duplicata para código 23505", () => {
    const result = tratarErroSupabase({ code: "23505" }, "criar", "paciente");
    expect(result).toContain("Já existe um registro");
  });

  it("retorna mensagem de vínculo para código 23503 ao excluir", () => {
    const result = tratarErroSupabase({ code: "23503" }, "excluir", "paciente");
    expect(result).toContain("Não é possível excluir");
    expect(result).toContain("registros vinculados");
  });

  it("retorna mensagem de referência inválida para código 23503 ao criar", () => {
    const result = tratarErroSupabase({ code: "23503" }, "criar", "agendamento");
    expect(result).toContain("Referência inválida");
  });

  it("retorna mensagem de permissão para código 42501", () => {
    const result = tratarErroSupabase({ code: "42501" }, "criar", "paciente");
    expect(result).toContain("Sem permissão");
  });

  it("retorna mensagem de sessão expirada para código PGRST301", () => {
    const result = tratarErroSupabase({ code: "PGRST301" }, "buscar", "paciente");
    expect(result).toContain("Sessão expirada");
  });

  it("retorna mensagem genérica para código desconhecido", () => {
    const result = tratarErroSupabase({ code: "99999" }, "criar", "paciente");
    expect(result).toBe("Erro ao criar paciente. Tente novamente.");
  });

  it("retorna mensagem genérica quando error é null", () => {
    const result = tratarErroSupabase(null, "criar", "paciente");
    expect(result).toBe("Erro ao criar paciente. Tente novamente.");
  });

  it("retorna mensagem genérica quando code é undefined", () => {
    const result = tratarErroSupabase({ message: "unknown" }, "atualizar", "agendamento");
    expect(result).toBe("Erro ao atualizar agendamento. Tente novamente.");
  });

  it("usa operação e entidade corretas na mensagem genérica", () => {
    const result = tratarErroSupabase({ code: "unknown" }, "excluir", "transação");
    expect(result).toBe("Erro ao excluir transação. Tente novamente.");
  });

  it("usa operação salvar na mensagem genérica", () => {
    const result = tratarErroSupabase({ code: "unknown" }, "salvar", "configuração");
    expect(result).toBe("Erro ao salvar configuração. Tente novamente.");
  });
});
