import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

const formState = vi.hoisted(() => ({ current: {} as Record<string, unknown> }));
const formPending = vi.hoisted(() => ({ current: false }));
const mockToastSuccess = vi.hoisted(() => vi.fn());

vi.mock("react", async () => {
  const actual = await vi.importActual("react");
  return { ...actual, useActionState: () => [formState.current, vi.fn(), formPending.current] };
});

vi.mock("sonner", () => ({
  toast: { success: (...args: unknown[]) => mockToastSuccess(...args) },
}));

vi.mock("./actions", () => ({
  criarCatalogoExame: vi.fn(),
  atualizarCatalogoExame: vi.fn(),
  excluirCatalogoExame: vi.fn(),
}));

vi.mock("./constants", async () => {
  const actual = await vi.importActual("./constants");
  return { ...actual };
});

vi.mock("@/components/delete-button", () => ({
  DeleteButton: ({ title }: { title: string }) => (
    <button data-testid="delete-button" title={title}>Excluir</button>
  ),
}));

import { CatalogoExamesForm, type CatalogoExame } from "./catalogo-exames-form";

const sampleExames: CatalogoExame[] = [
  { id: "1", nome: "Hemograma completo", codigo_tuss: "40304361" },
  { id: "2", nome: "Glicemia de jejum", codigo_tuss: "40301630" },
  { id: "3", nome: "Raio-X de tórax", codigo_tuss: null },
];

describe("CatalogoExamesForm", () => {
  beforeEach(() => {
    formState.current = {};
    formPending.current = false;
    mockToastSuccess.mockClear();
  });

  it("renderiza o campo de busca", () => {
    render(<CatalogoExamesForm exames={sampleExames} />);
    expect(screen.getByPlaceholderText("Buscar exame...")).toBeInTheDocument();
  });

  it("renderiza a tabela com os exames", () => {
    render(<CatalogoExamesForm exames={sampleExames} />);
    expect(screen.getByText("Hemograma completo")).toBeInTheDocument();
    expect(screen.getByText("Glicemia de jejum")).toBeInTheDocument();
    expect(screen.getByText("Raio-X de tórax")).toBeInTheDocument();
  });

  it("renderiza os cabeçalhos da tabela", () => {
    render(<CatalogoExamesForm exames={sampleExames} />);
    const headers = screen.getAllByRole("columnheader");
    expect(headers).toHaveLength(3);
    expect(headers[0]).toHaveTextContent("Nome");
    expect(headers[1]).toHaveTextContent("Código TUSS");
    expect(headers[2]).toHaveTextContent("Ações");
  });

  it("exibe código TUSS quando disponível", () => {
    render(<CatalogoExamesForm exames={sampleExames} />);
    expect(screen.getByText("40304361")).toBeInTheDocument();
    expect(screen.getByText("40301630")).toBeInTheDocument();
  });

  it("exibe traço quando código TUSS é null", () => {
    render(<CatalogoExamesForm exames={[{ id: "1", nome: "Exame Teste", codigo_tuss: null }]} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("filtra exames por nome ao digitar na busca", async () => {
    render(<CatalogoExamesForm exames={sampleExames} />);
    const input = screen.getByPlaceholderText("Buscar exame...");
    await userEvent.type(input, "Hemograma");
    expect(screen.getByText("Hemograma completo")).toBeInTheDocument();
    expect(screen.queryByText("Glicemia de jejum")).not.toBeInTheDocument();
    expect(screen.queryByText("Raio-X de tórax")).not.toBeInTheDocument();
  });

  it("filtra exames por código TUSS ao digitar na busca", async () => {
    render(<CatalogoExamesForm exames={sampleExames} />);
    const input = screen.getByPlaceholderText("Buscar exame...");
    await userEvent.type(input, "40301630");
    expect(screen.getByText("Glicemia de jejum")).toBeInTheDocument();
    expect(screen.queryByText("Hemograma completo")).not.toBeInTheDocument();
  });

  it("exibe mensagem quando nenhum exame é encontrado na busca", async () => {
    render(<CatalogoExamesForm exames={sampleExames} />);
    const input = screen.getByPlaceholderText("Buscar exame...");
    await userEvent.type(input, "inexistente");
    expect(screen.getByText("Nenhum exame encontrado.")).toBeInTheDocument();
  });

  it("exibe mensagem quando lista de exames está vazia", () => {
    render(<CatalogoExamesForm exames={[]} />);
    expect(screen.getByText("Nenhum exame cadastrado.")).toBeInTheDocument();
  });

  it("renderiza o formulário de novo exame", () => {
    render(<CatalogoExamesForm exames={[]} />);
    expect(screen.getByText("Novo exame")).toBeInTheDocument();
    expect(screen.getByLabelText(/Nome/)).toBeInTheDocument();
    expect(screen.getByLabelText("Código TUSS")).toBeInTheDocument();
  });

  it("campo nome do novo exame é obrigatório", () => {
    render(<CatalogoExamesForm exames={[]} />);
    expect(screen.getByLabelText(/Nome/)).toBeRequired();
  });

  it("renderiza o botão Cadastrar", () => {
    render(<CatalogoExamesForm exames={[]} />);
    expect(screen.getByRole("button", { name: /Cadastrar/ })).toBeInTheDocument();
  });

  it("renderiza o placeholder do campo nome", () => {
    render(<CatalogoExamesForm exames={[]} />);
    expect(screen.getByPlaceholderText("Ex: Hemograma completo")).toBeInTheDocument();
  });

  it("renderiza o placeholder do campo código TUSS", () => {
    render(<CatalogoExamesForm exames={[]} />);
    expect(screen.getByPlaceholderText("Ex: 40304361")).toBeInTheDocument();
  });

  it("exibe contador de exames no singular", () => {
    render(<CatalogoExamesForm exames={[{ id: "1", nome: "Exame", codigo_tuss: null }]} />);
    expect(screen.getByText("1 exame cadastrado")).toBeInTheDocument();
  });

  it("exibe contador de exames no plural", () => {
    render(<CatalogoExamesForm exames={sampleExames} />);
    expect(screen.getByText("3 exames cadastrados")).toBeInTheDocument();
  });

  it("renderiza botão Editar para cada exame", () => {
    render(<CatalogoExamesForm exames={sampleExames} />);
    const editButtons = screen.getAllByRole("button", { name: "Editar" });
    expect(editButtons).toHaveLength(3);
  });

  it("renderiza botão Excluir para cada exame", () => {
    render(<CatalogoExamesForm exames={sampleExames} />);
    const deleteButtons = screen.getAllByTestId("delete-button");
    expect(deleteButtons).toHaveLength(3);
  });

  it("mostra formulário de edição ao clicar em Editar", async () => {
    render(<CatalogoExamesForm exames={sampleExames} />);
    const editButtons = screen.getAllByRole("button", { name: "Editar" });
    await userEvent.click(editButtons[0]);
    expect(screen.getByRole("button", { name: /Salvar/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeInTheDocument();
  });

  it("cancela edição ao clicar em Cancelar", async () => {
    render(<CatalogoExamesForm exames={sampleExames} />);
    const editButtons = screen.getAllByRole("button", { name: "Editar" });
    await userEvent.click(editButtons[0]);
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("button", { name: "Cancelar" })).not.toBeInTheDocument();
  });

  it("exibe mensagem de erro quando state.error está definido", () => {
    formState.current = { error: "Erro ao cadastrar exame." };
    render(<CatalogoExamesForm exames={[]} />);
    expect(screen.getByText("Erro ao cadastrar exame.")).toBeInTheDocument();
  });

  it("chama toast.success quando state.success é true", () => {
    formState.current = { success: true };
    render(<CatalogoExamesForm exames={[]} />);
    expect(mockToastSuccess).toHaveBeenCalledWith("Exame cadastrado.");
  });

  it("desabilita botão Cadastrar quando isPending", () => {
    formPending.current = true;
    render(<CatalogoExamesForm exames={[]} />);
    const button = screen.getByRole("button", { name: /Cadastrar/ });
    expect(button).toBeDisabled();
  });

  it("busca é case-insensitive", async () => {
    render(<CatalogoExamesForm exames={sampleExames} />);
    const input = screen.getByPlaceholderText("Buscar exame...");
    await userEvent.type(input, "hemograma");
    expect(screen.getByText("Hemograma completo")).toBeInTheDocument();
  });
});
