import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

const formState = vi.hoisted(() => ({ current: {} as Record<string, unknown> }));
const formPending = vi.hoisted(() => ({ current: false }));
const mockToastSuccess = vi.hoisted(() => vi.fn());
const mockToastError = vi.hoisted(() => vi.fn());
const mockAlternarStatus = vi.hoisted(() => vi.fn());
const mockExcluirClinica = vi.hoisted(() => vi.fn());

vi.mock("react", async () => {
  const actual = await vi.importActual("react");
  return {
    ...actual,
    useActionState: () => [formState.current, vi.fn(), formPending.current],
  };
});

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}));

vi.mock("./actions", () => ({
  criarClinica: vi.fn(),
  criarUsuario: vi.fn(),
  editarClinica: vi.fn(),
  alternarStatusClinica: mockAlternarStatus,
  excluirClinica: mockExcluirClinica,
}));

vi.mock("./constants", async () => {
  const actual = await vi.importActual("./constants");
  return { ...actual };
});

import { ClinicasForm } from "./clinicas-form";

const clinicasAtivas = [
  { id: "c-1", nome: "Clínica Alpha", ativo: true },
  { id: "c-2", nome: "Clínica Beta", ativo: true },
];

const clinicaInativa = [
  { id: "c-3", nome: "Clínica Gamma", ativo: false },
];

const vinculos = [
  { id: "c-1", user_id: "u-1", papel: "profissional_saude", email: "dr@test.com" },
  { id: "c-1", user_id: "u-2", papel: "secretaria", email: "sec@test.com" },
  { id: "c-2", user_id: "u-3", papel: "superadmin", email: "admin@test.com" },
];

describe("ClinicasForm", () => {
  beforeEach(() => {
    formState.current = {};
    formPending.current = false;
    mockToastSuccess.mockClear();
    mockToastError.mockClear();
    mockAlternarStatus.mockClear();
    mockExcluirClinica.mockClear();
  });

  // --- Rendering ---

  it("renderiza os nomes das clínicas", () => {
    render(<ClinicasForm clinicas={clinicasAtivas} vinculos={[]} />);
    // Names appear in clinic list and in invite dropdown
    expect(screen.getAllByText("Clínica Alpha").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Clínica Beta").length).toBeGreaterThanOrEqual(1);
  });

  it("renderiza badge 'Ativo' para clínicas ativas", () => {
    render(<ClinicasForm clinicas={[clinicasAtivas[0]]} vinculos={[]} />);
    expect(screen.getByText("Ativo")).toBeInTheDocument();
  });

  it("renderiza badge 'Inativo' para clínicas inativas", () => {
    render(<ClinicasForm clinicas={clinicaInativa} vinculos={[]} />);
    expect(screen.getByText("Inativo")).toBeInTheDocument();
  });

  it("renderiza os vínculos com badges de papel", () => {
    render(<ClinicasForm clinicas={clinicasAtivas} vinculos={vinculos} />);
    expect(screen.getAllByText("Prof. Saúde").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Secretária").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Superadmin")).toBeInTheDocument();
  });

  it("renderiza emails dos vínculos", () => {
    render(<ClinicasForm clinicas={clinicasAtivas} vinculos={vinculos} />);
    expect(screen.getByText("dr@test.com")).toBeInTheDocument();
    expect(screen.getByText("sec@test.com")).toBeInTheDocument();
    expect(screen.getByText("admin@test.com")).toBeInTheDocument();
  });

  it("mostra user_id truncado quando email não existe", () => {
    const vinculoSemEmail = [
      { id: "c-1", user_id: "abcdefgh-1234", papel: "profissional_saude" },
    ];
    render(<ClinicasForm clinicas={[clinicasAtivas[0]]} vinculos={vinculoSemEmail} />);
    expect(screen.getByText("abcdefgh")).toBeInTheDocument();
  });

  it("renderiza títulos das seções", () => {
    render(<ClinicasForm clinicas={clinicasAtivas} vinculos={[]} />);
    expect(screen.getByText("Suas clínicas")).toBeInTheDocument();
    expect(screen.getByText("Nova clínica")).toBeInTheDocument();
    expect(screen.getAllByText("Criar usuário").length).toBeGreaterThanOrEqual(1);
  });

  // --- Nova clínica form ---

  it("renderiza campo nome na form de criar clínica", () => {
    render(<ClinicasForm clinicas={[]} vinculos={[]} />);
    const input = screen.getByLabelText(/Nome/);
    expect(input).toBeRequired();
    expect(input).toHaveAttribute("maxlength", "255");
  });

  it("renderiza botão Criar clínica", () => {
    render(<ClinicasForm clinicas={[]} vinculos={[]} />);
    expect(screen.getByRole("button", { name: /Criar clínica/ })).toBeInTheDocument();
  });

  // --- Criar usuário form ---

  it("renderiza dropdown de clínicas no form de criar usuário", () => {
    render(<ClinicasForm clinicas={clinicasAtivas} vinculos={[]} />);
    const select = screen.getByLabelText("Clínica");
    expect(select).toBeInTheDocument();
    expect(select.querySelectorAll("option")).toHaveLength(2);
  });

  it("renderiza campo de email no form de criar usuário", () => {
    render(<ClinicasForm clinicas={clinicasAtivas} vinculos={[]} />);
    expect(screen.getByLabelText(/E-mail/)).toBeRequired();
  });

  it("renderiza campo de senha no form de criar usuário", () => {
    render(<ClinicasForm clinicas={clinicasAtivas} vinculos={[]} />);
    const senhaInput = screen.getByLabelText(/Senha/);
    expect(senhaInput).toBeRequired();
    expect(senhaInput).toHaveAttribute("type", "password");
    expect(senhaInput).toHaveAttribute("minlength", "6");
    expect(senhaInput).toHaveAttribute("maxlength", "128");
  });

  it("renderiza dropdown de papel no form de criar usuário", () => {
    render(<ClinicasForm clinicas={clinicasAtivas} vinculos={[]} />);
    const papelSelect = screen.getByLabelText("Papel");
    expect(papelSelect).toBeInTheDocument();
    const options = papelSelect.querySelectorAll("option");
    expect(options).toHaveLength(4);
    expect(options[0]).toHaveTextContent("Secretária");
    expect(options[1]).toHaveTextContent("Profissional de Saúde");
    expect(options[2]).toHaveTextContent("Gestor");
    expect(options[3]).toHaveTextContent("Financeiro");
  });

  it("renderiza botão Criar usuário", () => {
    render(<ClinicasForm clinicas={clinicasAtivas} vinculos={[]} />);
    expect(screen.getByRole("button", { name: /Criar usuário/ })).toBeInTheDocument();
  });

  // --- Action buttons ---

  it("renderiza botões de editar, inativar e excluir para cada clínica", () => {
    render(<ClinicasForm clinicas={[clinicasAtivas[0]]} vinculos={[]} />);
    expect(screen.getByLabelText("Editar nome")).toBeInTheDocument();
    expect(screen.getByLabelText("Inativar")).toBeInTheDocument();
    expect(screen.getByLabelText("Excluir")).toBeInTheDocument();
  });

  it("mostra botão 'Reativar' para clínicas inativas", () => {
    render(<ClinicasForm clinicas={clinicaInativa} vinculos={[]} />);
    expect(screen.getByLabelText("Reativar")).toBeInTheDocument();
  });

  // --- Edit mode ---

  it("entra em modo edição ao clicar no botão editar", async () => {
    render(<ClinicasForm clinicas={[clinicasAtivas[0]]} vinculos={[]} />);
    await userEvent.click(screen.getByLabelText("Editar nome"));
    const input = screen.getByRole("textbox", { name: "" });
    expect(input).toHaveValue("Clínica Alpha");
    expect(input).toHaveAttribute("name", "nome");
  });

  it("modo edição tem campo hidden clinica_id", async () => {
    const { container } = render(<ClinicasForm clinicas={[clinicasAtivas[0]]} vinculos={[]} />);
    await userEvent.click(screen.getByLabelText("Editar nome"));
    const hidden = container.querySelector('input[name="clinica_id"]');
    expect(hidden).toHaveAttribute("type", "hidden");
    expect(hidden).toHaveValue("c-1");
  });

  it("mostra botões Salvar e Cancelar no modo edição", async () => {
    render(<ClinicasForm clinicas={[clinicasAtivas[0]]} vinculos={[]} />);
    await userEvent.click(screen.getByLabelText("Editar nome"));
    expect(screen.getByTitle("Salvar")).toBeInTheDocument();
    expect(screen.getByTitle("Cancelar")).toBeInTheDocument();
  });

  it("esconde botões de ação no modo edição", async () => {
    render(<ClinicasForm clinicas={[clinicasAtivas[0]]} vinculos={[]} />);
    await userEvent.click(screen.getByLabelText("Editar nome"));
    expect(screen.queryByLabelText("Editar nome")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Inativar")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Excluir")).not.toBeInTheDocument();
  });

  it("sai do modo edição ao clicar Cancelar", async () => {
    render(<ClinicasForm clinicas={[clinicasAtivas[0]]} vinculos={[]} />);
    await userEvent.click(screen.getByLabelText("Editar nome"));
    expect(screen.getByTitle("Salvar")).toBeInTheDocument();
    await userEvent.click(screen.getByTitle("Cancelar"));
    // Edit form gone, action buttons restored
    expect(screen.queryByTitle("Salvar")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Editar nome")).toBeInTheDocument();
  });

  // --- Inativar (confirm modal) ---

  it("abre modal de confirmação ao clicar Inativar em clínica ativa", async () => {
    render(<ClinicasForm clinicas={[clinicasAtivas[0]]} vinculos={[]} />);
    await userEvent.click(screen.getByLabelText("Inativar"));
    expect(screen.getByText("Inativar clínica")).toBeInTheDocument();
    expect(screen.getByText(/ficará inativa/)).toBeInTheDocument();
  });

  it("fecha modal ao clicar Cancelar", async () => {
    render(<ClinicasForm clinicas={[clinicasAtivas[0]]} vinculos={[]} />);
    await userEvent.click(screen.getByLabelText("Inativar"));
    expect(screen.getByText("Inativar clínica")).toBeInTheDocument();
    await userEvent.click(screen.getByText("Cancelar"));
    expect(screen.queryByText("Inativar clínica")).not.toBeInTheDocument();
  });

  it("chama alternarStatusClinica ao confirmar inativação", async () => {
    mockAlternarStatus.mockResolvedValue(undefined);
    render(<ClinicasForm clinicas={[clinicasAtivas[0]]} vinculos={[]} />);
    await userEvent.click(screen.getByLabelText("Inativar"));
    // Modal confirm button (last "Inativar" button)
    const buttons = screen.getAllByRole("button", { name: "Inativar" });
    await userEvent.click(buttons[buttons.length - 1]);
    expect(mockAlternarStatus).toHaveBeenCalledWith("c-1");
  });

  // --- Reativar ---

  it("chama alternarStatusClinica diretamente ao clicar Reativar", async () => {
    mockAlternarStatus.mockResolvedValue(undefined);
    render(<ClinicasForm clinicas={clinicaInativa} vinculos={[]} />);
    await userEvent.click(screen.getByLabelText("Reativar"));
    expect(mockAlternarStatus).toHaveBeenCalledWith("c-3");
  });

  // --- Delete ---

  it("abre modal de confirmação ao clicar Excluir", async () => {
    render(<ClinicasForm clinicas={[clinicasAtivas[0]]} vinculos={[]} />);
    await userEvent.click(screen.getByLabelText("Excluir"));
    expect(screen.getByText("Excluir clínica")).toBeInTheDocument();
    expect(screen.getByText(/não pode ser desfeita/)).toBeInTheDocument();
  });

  // --- Toast on success ---

  it("chama toast.success quando criar clínica retorna sucesso", () => {
    formState.current = { success: true };
    render(<ClinicasForm clinicas={[]} vinculos={[]} />);
    expect(mockToastSuccess).toHaveBeenCalledWith("Clínica criada com sucesso.");
  });

  // --- Error display ---

  it("exibe mensagem de erro do formulário", () => {
    formState.current = { error: "Nome é obrigatório." };
    render(<ClinicasForm clinicas={[]} vinculos={[]} />);
    expect(screen.getAllByText("Nome é obrigatório.").length).toBeGreaterThan(0);
  });

  // --- Pending state ---

  it("desabilita botões quando pendente", () => {
    formPending.current = true;
    render(<ClinicasForm clinicas={[]} vinculos={[]} />);
    expect(screen.getByRole("button", { name: /Criar clínica/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Criar usuário/ })).toBeDisabled();
  });
});
