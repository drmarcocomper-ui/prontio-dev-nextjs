import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("sonner", () => ({
  toast: { error: vi.fn() },
}));

import { toast } from "sonner";
import { DeleteButton } from "./delete-button";

const defaultProps = {
  onDelete: vi.fn().mockResolvedValue(undefined),
  title: "Excluir registro",
  description: "Tem certeza que deseja excluir este registro?",
  errorMessage: "Erro ao excluir registro.",
};

describe("DeleteButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    defaultProps.onDelete = vi.fn().mockResolvedValue(undefined);
  });

  describe("variante button (default)", () => {
    it("renderiza botão com texto Excluir", () => {
      render(<DeleteButton {...defaultProps} />);
      expect(screen.getByRole("button", { name: /excluir/i })).toBeInTheDocument();
    });

    it("abre o modal ao clicar", async () => {
      render(<DeleteButton {...defaultProps} />);
      await userEvent.click(screen.getByRole("button", { name: /excluir/i }));
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Excluir registro")).toBeInTheDocument();
      expect(screen.getByText("Tem certeza que deseja excluir este registro?")).toBeInTheDocument();
    });

    it("chama onDelete ao confirmar", async () => {
      render(<DeleteButton {...defaultProps} />);
      await userEvent.click(screen.getByRole("button", { name: /excluir/i }));
      // Click the confirm button inside the modal
      const buttons = screen.getAllByRole("button", { name: /excluir/i });
      const confirmBtn = buttons.find((b) => b.closest('[role="dialog"]'));
      await userEvent.click(confirmBtn!);
      await waitFor(() => {
        expect(defaultProps.onDelete).toHaveBeenCalledTimes(1);
      });
    });

    it("fecha o modal ao clicar Cancelar", async () => {
      render(<DeleteButton {...defaultProps} />);
      await userEvent.click(screen.getByRole("button", { name: /excluir/i }));
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      await userEvent.click(screen.getByText("Cancelar"));
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("mostra toast de erro quando onDelete falha", async () => {
      defaultProps.onDelete = vi.fn().mockRejectedValue(new Error("fail"));
      render(<DeleteButton {...defaultProps} />);
      await userEvent.click(screen.getByRole("button", { name: /excluir/i }));
      const buttons = screen.getAllByRole("button", { name: /excluir/i });
      const confirmBtn = buttons.find((b) => b.closest('[role="dialog"]'));
      await userEvent.click(confirmBtn!);
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Erro ao excluir registro.");
      });
    });
  });

  describe("variante icon", () => {
    it("renderiza botão com aria-label Excluir", () => {
      render(<DeleteButton {...defaultProps} variant="icon" />);
      expect(screen.getByLabelText("Excluir")).toBeInTheDocument();
    });

    it("não renderiza texto 'Excluir' visível no botão icon", () => {
      render(<DeleteButton {...defaultProps} variant="icon" />);
      const btn = screen.getByLabelText("Excluir");
      expect(btn.textContent).toBe("");
    });

    it("abre o modal ao clicar no ícone", async () => {
      render(<DeleteButton {...defaultProps} variant="icon" />);
      await userEvent.click(screen.getByLabelText("Excluir"));
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });
});
