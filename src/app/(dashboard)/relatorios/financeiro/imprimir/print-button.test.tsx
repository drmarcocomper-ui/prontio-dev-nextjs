import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { PrintButton } from "./print-button";

describe("PrintButton", () => {
  it("renderiza o botão Imprimir", () => {
    render(<PrintButton />);
    expect(screen.getByRole("button", { name: "Imprimir" })).toBeInTheDocument();
  });

  it("chama window.print ao clicar", async () => {
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});
    render(<PrintButton />);
    await userEvent.click(screen.getByRole("button", { name: "Imprimir" }));
    expect(printSpy).toHaveBeenCalledTimes(1);
    printSpy.mockRestore();
  });

  it("SVG tem aria-hidden", () => {
    render(<PrintButton />);
    const svg = document.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });
});
