import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import NotFound from "./not-found";

describe("NotFound", () => {
  it("renderiza o título \"Página não encontrada\"", () => {
    render(<NotFound />);
    expect(screen.getByText("Página não encontrada")).toBeInTheDocument();
  });

  it("renderiza a descrição", () => {
    render(<NotFound />);
    expect(
      screen.getByText(
        "A página que você procura não existe ou foi removida.",
      ),
    ).toBeInTheDocument();
  });

  it("renderiza link \"Ir para o início\" com href \"/\"", () => {
    render(<NotFound />);
    const link = screen.getByText("Ir para o início").closest("a");
    expect(link).toHaveAttribute("href", "/");
  });
});
