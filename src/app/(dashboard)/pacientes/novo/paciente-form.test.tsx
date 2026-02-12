import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

const formState = vi.hoisted(() => ({ current: {} as Record<string, unknown> }));
const formPending = vi.hoisted(() => ({ current: false }));

vi.mock("react", async () => {
  const actual = await vi.importActual("react");
  return { ...actual, useActionState: () => [formState.current, vi.fn(), formPending.current] };
});

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("../actions", () => ({
  criarPaciente: vi.fn(),
  atualizarPaciente: vi.fn(),
}));

vi.mock("../types", async () => {
  const actual = await vi.importActual("../types");
  return { ...actual };
});

import { PacienteForm } from "./paciente-form";

const defaults = {
  id: "abc-123",
  nome: "Maria Silva",
  cpf: "12345678901",
  rg: "123456789",
  data_nascimento: "1990-05-15",
  sexo: "feminino",
  estado_civil: "casado",
  telefone: "11999998888",
  email: "maria@email.com",
  cep: "01001000",
  endereco: "Rua das Flores",
  numero: "100",
  complemento: "Apto 42",
  bairro: "Centro",
  cidade: "São Paulo",
  estado: "SP",
  convenio: "Unimed",
  observacoes: "Alergia a dipirona",
};

describe("PacienteForm", () => {
  beforeEach(() => {
    formState.current = {};
    formPending.current = false;
  });

  describe("modo criação", () => {
    it("renderiza todas as seções do formulário", () => {
      render(<PacienteForm />);
      expect(screen.getByText("Dados pessoais")).toBeInTheDocument();
      expect(screen.getByText("Contato")).toBeInTheDocument();
      expect(screen.getByText("Endereço")).toBeInTheDocument();
      expect(screen.getByText("Informações adicionais")).toBeInTheDocument();
    });

    it("renderiza todos os campos do formulário", () => {
      render(<PacienteForm />);
      expect(screen.getByLabelText(/Nome completo/)).toBeInTheDocument();
      expect(screen.getByLabelText("CPF")).toBeInTheDocument();
      expect(screen.getByLabelText("RG")).toBeInTheDocument();
      expect(screen.getByLabelText("Data de nascimento")).toBeInTheDocument();
      expect(screen.getByLabelText("Sexo")).toBeInTheDocument();
      expect(screen.getByLabelText("Estado civil")).toBeInTheDocument();
      expect(screen.getByLabelText("Telefone")).toBeInTheDocument();
      expect(screen.getByLabelText("E-mail")).toBeInTheDocument();
      expect(screen.getByLabelText("CEP")).toBeInTheDocument();
      expect(screen.getByLabelText("Rua / Avenida")).toBeInTheDocument();
      expect(screen.getByLabelText("Número")).toBeInTheDocument();
      expect(screen.getByLabelText("Complemento")).toBeInTheDocument();
      expect(screen.getByLabelText("Bairro")).toBeInTheDocument();
      expect(screen.getByLabelText("Cidade")).toBeInTheDocument();
      expect(screen.getByLabelText("Estado")).toBeInTheDocument();
      expect(screen.getByLabelText("Convênio")).toBeInTheDocument();
      expect(screen.getByLabelText("Observações")).toBeInTheDocument();
    });

    it("exibe botão Cadastrar paciente", () => {
      render(<PacienteForm />);
      expect(screen.getByRole("button", { name: "Cadastrar paciente" })).toBeInTheDocument();
    });

    it("link Cancelar aponta para /pacientes", () => {
      render(<PacienteForm />);
      const link = screen.getByText("Cancelar").closest("a");
      expect(link).toHaveAttribute("href", "/pacientes");
    });

    it("campo nome é obrigatório", () => {
      render(<PacienteForm />);
      expect(screen.getByLabelText(/Nome completo/)).toBeRequired();
    });
  });

  describe("modo edição", () => {
    it("exibe botão Salvar alterações", () => {
      render(<PacienteForm defaults={defaults} />);
      expect(screen.getByRole("button", { name: "Salvar alterações" })).toBeInTheDocument();
    });

    it("link Cancelar aponta para detalhes do paciente", () => {
      render(<PacienteForm defaults={defaults} />);
      const link = screen.getByText("Cancelar").closest("a");
      expect(link).toHaveAttribute("href", "/pacientes/abc-123");
    });

    it("preenche os campos com os valores padrão", () => {
      render(<PacienteForm defaults={defaults} />);
      expect(screen.getByLabelText(/Nome completo/)).toHaveValue("Maria Silva");
      expect(screen.getByLabelText("RG")).toHaveValue("123456789");
      expect(screen.getByLabelText("Data de nascimento")).toHaveValue("1990-05-15");
      expect(screen.getByLabelText("E-mail")).toHaveValue("maria@email.com");
      expect(screen.getByLabelText("Rua / Avenida")).toHaveValue("Rua das Flores");
      expect(screen.getByLabelText("Número")).toHaveValue("100");
      expect(screen.getByLabelText("Complemento")).toHaveValue("Apto 42");
      expect(screen.getByLabelText("Bairro")).toHaveValue("Centro");
      expect(screen.getByLabelText("Cidade")).toHaveValue("São Paulo");
      expect(screen.getByLabelText("Convênio")).toHaveValue("Unimed");
      expect(screen.getByLabelText("Observações")).toHaveValue("Alergia a dipirona");
    });

    it("preenche selects com valores padrão", () => {
      render(<PacienteForm defaults={defaults} />);
      expect(screen.getByLabelText("Sexo")).toHaveValue("feminino");
      expect(screen.getByLabelText("Estado civil")).toHaveValue("casado");
      expect(screen.getByLabelText("Estado")).toHaveValue("SP");
    });

    it("inclui campo hidden com id do paciente", () => {
      const { container } = render(<PacienteForm defaults={defaults} />);
      const hidden = container.querySelector('input[type="hidden"][name="id"]');
      expect(hidden).toHaveValue("abc-123");
    });
  });

  describe("estados do formulário", () => {
    it("exibe mensagem de erro quando state.error está definido", () => {
      formState.current = { error: "Erro ao cadastrar paciente." };
      render(<PacienteForm />);
      expect(screen.getByText("Erro ao cadastrar paciente.")).toBeInTheDocument();
    });

    it("exibe erro de campo quando fieldErrors está definido", () => {
      formState.current = { fieldErrors: { nome: "Nome é obrigatório." } };
      render(<PacienteForm />);
      expect(screen.getByText("Nome é obrigatório.")).toBeInTheDocument();
    });

    it("desabilita botão e exibe spinner quando isPending", () => {
      formPending.current = true;
      render(<PacienteForm />);
      const button = screen.getByRole("button", { name: /Cadastrar paciente/ });
      expect(button).toBeDisabled();
    });
  });

  describe("limites e validação de data", () => {
    it("campo nome tem maxLength", () => {
      render(<PacienteForm />);
      const input = screen.getByLabelText(/Nome completo/) as HTMLInputElement;
      expect(input.maxLength).toBe(255);
    });

    it("campo observações tem maxLength", () => {
      render(<PacienteForm />);
      const textarea = screen.getByLabelText("Observações") as HTMLTextAreaElement;
      expect(textarea.maxLength).toBe(1000);
    });

    it("campo data de nascimento tem max igual a hoje", () => {
      render(<PacienteForm />);
      const input = screen.getByLabelText("Data de nascimento") as HTMLInputElement;
      const today = new Date().toISOString().split("T")[0];
      expect(input.max).toBe(today);
    });
  });

  describe("máscaras", () => {
    it("aplica máscara de CPF ao digitar", async () => {
      render(<PacienteForm />);
      const input = screen.getByLabelText("CPF");
      await userEvent.type(input, "12345678901");
      expect(input).toHaveValue("123.456.789-01");
    });

    it("aplica máscara de telefone ao digitar", async () => {
      render(<PacienteForm />);
      const input = screen.getByLabelText("Telefone");
      await userEvent.type(input, "11999998888");
      expect(input).toHaveValue("(11) 99999-8888");
    });

    it("aplica máscara de CEP ao digitar", async () => {
      render(<PacienteForm />);
      const input = screen.getByLabelText("CEP");
      await userEvent.type(input, "01001000");
      expect(input).toHaveValue("01001-000");
    });
  });
});
