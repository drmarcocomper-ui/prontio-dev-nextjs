import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("./redefinir-senha-form", () => ({
  RedefinirSenhaForm: () => <div data-testid="redefinir-senha-form" />,
}));

import RedefinirSenhaPage from "./page";

describe("RedefinirSenhaPage", () => {
  it("renderiza o título \"Nova senha\"", () => {
    render(<RedefinirSenhaPage />);
    expect(screen.getByText("Nova senha")).toBeInTheDocument();
  });

  it("renderiza a descrição", () => {
    render(<RedefinirSenhaPage />);
    expect(
      screen.getByText("Escolha uma nova senha para sua conta")
    ).toBeInTheDocument();
  });

  it("renderiza o componente RedefinirSenhaForm", () => {
    render(<RedefinirSenhaPage />);
    expect(screen.getByTestId("redefinir-senha-form")).toBeInTheDocument();
  });
});
