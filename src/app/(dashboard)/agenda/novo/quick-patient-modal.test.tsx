import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCriarPacienteRapido = vi.fn();

vi.mock("@/app/(dashboard)/pacientes/actions", () => ({
  criarPacienteRapido: (...args: unknown[]) => mockCriarPacienteRapido(...args),
}));

vi.mock("@/app/(dashboard)/pacientes/types", async () => {
  const actual = await vi.importActual("@/app/(dashboard)/pacientes/types");
  return { ...actual };
});

import { QuickPatientModal } from "./quick-patient-modal";

describe("QuickPatientModal", () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onCreated: vi.fn(),
    defaultNome: "João",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCriarPacienteRapido.mockResolvedValue({ id: "new-1", nome: "João" });
  });

  it("renderiza campos quando open=true", () => {
    render(<QuickPatientModal {...defaultProps} />);
    expect(screen.getByLabelText(/nome/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/telefone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/convênio/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salvar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeInTheDocument();
  });

  it("nome vem pré-preenchido do defaultNome", () => {
    render(<QuickPatientModal {...defaultProps} defaultNome="Maria Silva" />);
    expect(screen.getByLabelText(/nome/i)).toHaveValue("Maria Silva");
  });

  it("não renderiza quando open=false", () => {
    render(<QuickPatientModal {...defaultProps} open={false} />);
    expect(screen.queryByLabelText(/nome/i)).not.toBeInTheDocument();
  });

  it("chama onClose ao clicar Cancelar", async () => {
    render(<QuickPatientModal {...defaultProps} />);
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("chama onClose ao pressionar Escape", () => {
    render(<QuickPatientModal {...defaultProps} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("exibe título do modal", () => {
    render(<QuickPatientModal {...defaultProps} />);
    expect(screen.getByText("Cadastro rápido de paciente")).toBeInTheDocument();
  });
});
