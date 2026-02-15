import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { PrintButton } from "./print-button";

window.print = vi.fn();

describe("PrintButton", () => {
  it("renderiza botão \"Imprimir\"", () => {
    render(<PrintButton />);
    expect(screen.getByText("Imprimir")).toBeInTheDocument();
  });

  it("chama window.print ao clicar", async () => {
    render(<PrintButton />);
    await userEvent.click(screen.getByText("Imprimir"));
    expect(window.print).toHaveBeenCalledTimes(1);
  });
});
