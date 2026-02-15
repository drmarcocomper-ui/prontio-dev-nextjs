import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("./esqueci-senha-form", () => ({
  EsqueciSenhaForm: () => <div data-testid="esqueci-senha-form" />,
}));

import EsqueciSenhaPage from "./page";

describe("EsqueciSenhaPage", () => {
  it("renderiza o título \"Recuperar senha\"", () => {
    render(<EsqueciSenhaPage />);
    expect(screen.getByText("Recuperar senha")).toBeInTheDocument();
  });

  it("renderiza a descrição do formulário", () => {
    render(<EsqueciSenhaPage />);
    expect(
      screen.getByText("Informe seu e-mail para receber um link de redefinição de senha")
    ).toBeInTheDocument();
  });

  it("renderiza o componente EsqueciSenhaForm", () => {
    render(<EsqueciSenhaPage />);
    expect(screen.getByTestId("esqueci-senha-form")).toBeInTheDocument();
  });
});
