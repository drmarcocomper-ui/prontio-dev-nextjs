import { render, screen, fireEvent } from "@testing-library/react";
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

  it("não fecha ao pressionar tecla diferente de Escape", () => {
    const onClose = vi.fn();
    render(<ConfirmModal {...defaultProps} onClose={onClose} />);
    fireEvent.keyDown(document, { key: "a" });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("aplica scroll lock no body quando aberto", () => {
    render(<ConfirmModal {...defaultProps} />);
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("restaura scroll do body ao fechar", () => {
    document.body.style.overflow = "auto";
    const { unmount } = render(<ConfirmModal {...defaultProps} />);
    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).toBe("auto");
  });

  it("mantém foco dentro do modal com Tab", async () => {
    render(<ConfirmModal {...defaultProps} />);
    const cancelButton = screen.getByText("Cancelar");
    const confirmButton = screen.getByText("Excluir").closest("button")!;

    // Focus the last button (Excluir), then tab should wrap to first (Cancelar)
    (confirmButton as HTMLElement).focus();
    await userEvent.tab();
    expect(document.activeElement).toBe(cancelButton);
  });

  it("mantém foco dentro do modal com Shift+Tab", async () => {
    render(<ConfirmModal {...defaultProps} />);
    const cancelButton = screen.getByText("Cancelar");
    const confirmButton = screen.getByText("Excluir").closest("button")!;

    // Focus the first button (Cancelar), then shift+tab should wrap to last (Excluir)
    cancelButton.focus();
    await userEvent.tab({ shift: true });
    expect(document.activeElement).toBe(confirmButton);
  });

  it("não responde ao Escape quando modal está fechado", async () => {
    const onClose = vi.fn();
    const { rerender } = render(<ConfirmModal {...defaultProps} open={true} onClose={onClose} />);
    rerender(<ConfirmModal {...defaultProps} open={false} onClose={onClose} />);
    onClose.mockClear();
    await userEvent.keyboard("{Escape}");
    expect(onClose).not.toHaveBeenCalled();
  });
});
