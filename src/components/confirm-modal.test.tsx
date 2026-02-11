import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { ConfirmModal } from "./confirm-modal";

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  onConfirm: vi.fn(),
  title: "Confirmar exclusão",
  description: "Tem certeza que deseja excluir este item?",
};

describe("ConfirmModal", () => {
  it("não renderiza nada quando open=false", () => {
    const { container } = render(
      <ConfirmModal {...defaultProps} open={false} />
    );
    expect(container.innerHTML).toBe("");
  });

  it("renderiza título e descrição quando open=true", () => {
    render(<ConfirmModal {...defaultProps} />);
    expect(screen.getByText("Confirmar exclusão")).toBeInTheDocument();
    expect(
      screen.getByText("Tem certeza que deseja excluir este item?")
    ).toBeInTheDocument();
  });

  it("chama onClose ao clicar em Cancelar", async () => {
    const onClose = vi.fn();
    render(<ConfirmModal {...defaultProps} onClose={onClose} />);
    await userEvent.click(screen.getByText("Cancelar"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("chama onClose ao pressionar Escape", async () => {
    const onClose = vi.fn();
    render(<ConfirmModal {...defaultProps} onClose={onClose} />);
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("chama onClose ao clicar no overlay", async () => {
    const onClose = vi.fn();
    render(<ConfirmModal {...defaultProps} onClose={onClose} />);
    const overlay = screen.getByText("Confirmar exclusão").closest(".fixed");
    await userEvent.click(overlay!);
    expect(onClose).toHaveBeenCalled();
  });

  it("chama onConfirm ao clicar no botão de confirmação", async () => {
    const onConfirm = vi.fn();
    render(<ConfirmModal {...defaultProps} onConfirm={onConfirm} />);
    await userEvent.click(screen.getByText("Excluir"));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("mostra spinner e desabilita botões quando isPending=true", () => {
    render(<ConfirmModal {...defaultProps} isPending={true} />);
    const cancelBtn = screen.getByText("Cancelar");
    const confirmBtn = screen.getByText("Excluir").closest("button")!;
    expect(cancelBtn).toBeDisabled();
    expect(confirmBtn).toBeDisabled();
  });

  it("usa confirmLabel customizado", () => {
    render(<ConfirmModal {...defaultProps} confirmLabel="Remover" />);
    expect(screen.getByText("Remover")).toBeInTheDocument();
  });
});
