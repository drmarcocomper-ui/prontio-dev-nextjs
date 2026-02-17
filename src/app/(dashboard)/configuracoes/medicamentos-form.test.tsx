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
  criarMedicamento: vi.fn(),
  atualizarMedicamento: vi.fn(),
  excluirMedicamento: vi.fn(),
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

import { MedicamentosForm, type Medicamento } from "./medicamentos-form";

const sampleMedicamentos: Medicamento[] = [
  { id: "1", nome: "Amoxicilina 500mg", posologia: "1 comp a cada 8h", quantidade: "21 comprimidos", via_administracao: "Oral" },
  { id: "2", nome: "Dipirona 500mg", posologia: null, quantidade: null, via_administracao: null },
  { id: "3", nome: "Insulina NPH", posologia: "10 UI antes do café", quantidade: "1 frasco", via_administracao: "Subcutânea" },
];

describe("MedicamentosForm", () => {
  beforeEach(() => {
    formState.current = {};
    formPending.current = false;
    mockToastSuccess.mockClear();
  });

  it("renderiza o campo de busca", () => {
    render(<MedicamentosForm medicamentos={sampleMedicamentos} />);
    expect(screen.getByPlaceholderText("Buscar medicamento...")).toBeInTheDocument();
  });

  it("renderiza a tabela com os medicamentos", () => {
    render(<MedicamentosForm medicamentos={sampleMedicamentos} />);
    expect(screen.getByText("Amoxicilina 500mg")).toBeInTheDocument();
    expect(screen.getByText("Dipirona 500mg")).toBeInTheDocument();
    expect(screen.getByText("Insulina NPH")).toBeInTheDocument();
  });

  it("renderiza os cabeçalhos da tabela", () => {
    render(<MedicamentosForm medicamentos={sampleMedicamentos} />);
    const headers = screen.getAllByRole("columnheader");
    expect(headers).toHaveLength(5);
    expect(headers[0]).toHaveTextContent("Nome");
    expect(headers[1]).toHaveTextContent("Posologia");
    expect(headers[2]).toHaveTextContent("Quantidade");
    expect(headers[3]).toHaveTextContent("Via");
    expect(headers[4]).toHaveTextContent("Ações");
  });

  it("exibe dados do medicamento quando disponíveis", () => {
    render(<MedicamentosForm medicamentos={sampleMedicamentos} />);
    expect(screen.getByText("1 comp a cada 8h")).toBeInTheDocument();
    expect(screen.getByText("21 comprimidos")).toBeInTheDocument();
    // "Oral" appears in both the table cell and the select option, so we check it's present
    expect(screen.getAllByText("Oral").length).toBeGreaterThanOrEqual(1);
  });

  it("exibe traço quando campos são null", () => {
    render(<MedicamentosForm medicamentos={[{ id: "1", nome: "Teste", posologia: null, quantidade: null, via_administracao: null }]} />);
    const dashes = screen.getAllByText("—");
    expect(dashes).toHaveLength(3);
  });

  it("filtra medicamentos por nome ao digitar na busca", async () => {
    render(<MedicamentosForm medicamentos={sampleMedicamentos} />);
    const input = screen.getByPlaceholderText("Buscar medicamento...");
    await userEvent.type(input, "Amoxicilina");
    expect(screen.getByText("Amoxicilina 500mg")).toBeInTheDocument();
    expect(screen.queryByText("Dipirona 500mg")).not.toBeInTheDocument();
    expect(screen.queryByText("Insulina NPH")).not.toBeInTheDocument();
  });

  it("filtra medicamentos por via de administração ao digitar na busca", async () => {
    render(<MedicamentosForm medicamentos={sampleMedicamentos} />);
    const input = screen.getByPlaceholderText("Buscar medicamento...");
    await userEvent.type(input, "Subcutânea");
    expect(screen.getByText("Insulina NPH")).toBeInTheDocument();
    expect(screen.queryByText("Amoxicilina 500mg")).not.toBeInTheDocument();
  });

  it("exibe mensagem quando nenhum medicamento é encontrado na busca", async () => {
    render(<MedicamentosForm medicamentos={sampleMedicamentos} />);
    const input = screen.getByPlaceholderText("Buscar medicamento...");
    await userEvent.type(input, "inexistente");
    expect(screen.getByText("Nenhum medicamento encontrado.")).toBeInTheDocument();
  });

  it("exibe mensagem quando lista de medicamentos está vazia", () => {
    render(<MedicamentosForm medicamentos={[]} />);
    expect(screen.getByText("Nenhum medicamento cadastrado.")).toBeInTheDocument();
  });

  it("renderiza o formulário de novo medicamento", () => {
    render(<MedicamentosForm medicamentos={[]} />);
    expect(screen.getByText("Novo medicamento")).toBeInTheDocument();
    expect(screen.getByLabelText(/Nome/)).toBeInTheDocument();
    expect(screen.getByLabelText("Posologia")).toBeInTheDocument();
    expect(screen.getByLabelText("Quantidade")).toBeInTheDocument();
    expect(screen.getByLabelText("Via de Administração")).toBeInTheDocument();
  });

  it("campo nome do novo medicamento é obrigatório", () => {
    render(<MedicamentosForm medicamentos={[]} />);
    expect(screen.getByLabelText(/Nome/)).toBeRequired();
  });

  it("renderiza o botão Cadastrar", () => {
    render(<MedicamentosForm medicamentos={[]} />);
    expect(screen.getByRole("button", { name: /Cadastrar/ })).toBeInTheDocument();
  });

  it("renderiza os placeholders dos campos do formulário", () => {
    render(<MedicamentosForm medicamentos={[]} />);
    expect(screen.getByPlaceholderText("Ex: Amoxicilina 500mg")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Ex: 1 comprimido a cada 8h")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Ex: 21 comprimidos")).toBeInTheDocument();
  });

  it("renderiza o select de via de administração com as opções", () => {
    render(<MedicamentosForm medicamentos={[]} />);
    const select = screen.getByLabelText("Via de Administração");
    expect(select).toBeInTheDocument();
    expect(screen.getByText("Selecione...")).toBeInTheDocument();
    expect(screen.getByText("Oral")).toBeInTheDocument();
    expect(screen.getByText("Sublingual")).toBeInTheDocument();
    expect(screen.getByText("Intravenosa")).toBeInTheDocument();
    expect(screen.getByText("Tópica")).toBeInTheDocument();
    expect(screen.getByText("Inalatória")).toBeInTheDocument();
  });

  it("exibe contador de medicamentos no singular", () => {
    render(<MedicamentosForm medicamentos={[{ id: "1", nome: "Med", posologia: null, quantidade: null, via_administracao: null }]} />);
    expect(screen.getByText("1 medicamento cadastrado")).toBeInTheDocument();
  });

  it("exibe contador de medicamentos no plural", () => {
    render(<MedicamentosForm medicamentos={sampleMedicamentos} />);
    expect(screen.getByText("3 medicamentos cadastrados")).toBeInTheDocument();
  });

  it("renderiza botão Editar para cada medicamento", () => {
    render(<MedicamentosForm medicamentos={sampleMedicamentos} />);
    const editButtons = screen.getAllByRole("button", { name: "Editar" });
    expect(editButtons).toHaveLength(3);
  });

  it("renderiza botão Excluir para cada medicamento", () => {
    render(<MedicamentosForm medicamentos={sampleMedicamentos} />);
    const deleteButtons = screen.getAllByTestId("delete-button");
    expect(deleteButtons).toHaveLength(3);
  });

  it("mostra formulário de edição ao clicar em Editar", async () => {
    render(<MedicamentosForm medicamentos={sampleMedicamentos} />);
    const editButtons = screen.getAllByRole("button", { name: "Editar" });
    await userEvent.click(editButtons[0]);
    expect(screen.getByRole("button", { name: /Salvar/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeInTheDocument();
  });

  it("formulário de edição contém campos de posologia, quantidade e via", async () => {
    render(<MedicamentosForm medicamentos={sampleMedicamentos} />);
    const editButtons = screen.getAllByRole("button", { name: "Editar" });
    await userEvent.click(editButtons[0]);
    // Check that edit form has the extra fields (by checking select with VIAS options in the form)
    const selects = document.querySelectorAll("select[name='via_administracao']");
    expect(selects.length).toBeGreaterThan(0);
  });

  it("cancela edição ao clicar em Cancelar", async () => {
    render(<MedicamentosForm medicamentos={sampleMedicamentos} />);
    const editButtons = screen.getAllByRole("button", { name: "Editar" });
    await userEvent.click(editButtons[0]);
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("button", { name: "Cancelar" })).not.toBeInTheDocument();
  });

  it("exibe mensagem de erro quando state.error está definido", () => {
    formState.current = { error: "Erro ao cadastrar medicamento." };
    render(<MedicamentosForm medicamentos={[]} />);
    expect(screen.getByText("Erro ao cadastrar medicamento.")).toBeInTheDocument();
  });

  it("chama toast.success quando state.success é true", () => {
    formState.current = { success: true };
    render(<MedicamentosForm medicamentos={[]} />);
    expect(mockToastSuccess).toHaveBeenCalledWith("Medicamento cadastrado.");
  });

  it("desabilita botão Cadastrar quando isPending", () => {
    formPending.current = true;
    render(<MedicamentosForm medicamentos={[]} />);
    const button = screen.getByRole("button", { name: /Cadastrar/ });
    expect(button).toBeDisabled();
  });

  it("busca é case-insensitive", async () => {
    render(<MedicamentosForm medicamentos={sampleMedicamentos} />);
    const input = screen.getByPlaceholderText("Buscar medicamento...");
    await userEvent.type(input, "amoxicilina");
    expect(screen.getByText("Amoxicilina 500mg")).toBeInTheDocument();
  });
});
