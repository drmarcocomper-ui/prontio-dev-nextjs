import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { FieldError, FormError, SubmitButton, INPUT_CLASS } from "./form-utils";

describe("INPUT_CLASS", () => {
  it("é uma string não vazia", () => {
    expect(typeof INPUT_CLASS).toBe("string");
    expect(INPUT_CLASS.length).toBeGreaterThan(0);
  });

  it("contém classes de estilo esperadas", () => {
    expect(INPUT_CLASS).toContain("rounded-lg");
    expect(INPUT_CLASS).toContain("border-gray-300");
  });
});

describe("FieldError", () => {
  it("retorna null quando message não está definida", () => {
    const { container } = render(<FieldError />);
    expect(container.innerHTML).toBe("");
  });

  it("retorna null quando message é string vazia", () => {
    const { container } = render(<FieldError message="" />);
    expect(container.innerHTML).toBe("");
  });

  it("renderiza a mensagem de erro com role=alert", () => {
    render(<FieldError message="Campo obrigatório" />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Campo obrigatório");
  });
});

describe("FormError", () => {
  it("retorna null quando message não está definida", () => {
    const { container } = render(<FormError />);
    expect(container.innerHTML).toBe("");
  });

  it("retorna null quando message é string vazia", () => {
    const { container } = render(<FormError message="" />);
    expect(container.innerHTML).toBe("");
  });

  it("renderiza a mensagem de erro com role=alert", () => {
    render(<FormError message="Erro ao salvar dados." />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Erro ao salvar dados.");
  });

  it("tem estilo de borda vermelha", () => {
    render(<FormError message="Erro" />);
    const alert = screen.getByRole("alert");
    expect(alert.className).toContain("border-red-200");
  });
});

describe("SubmitButton", () => {
  it("renderiza o label", () => {
    render(<SubmitButton label="Salvar" isPending={false} />);
    expect(screen.getByRole("button", { name: "Salvar" })).toBeInTheDocument();
  });

  it("é do tipo submit", () => {
    render(<SubmitButton label="Salvar" isPending={false} />);
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });

  it("fica desabilitado quando isPending é true", () => {
    render(<SubmitButton label="Salvar" isPending={true} />);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("fica habilitado quando isPending é false", () => {
    render(<SubmitButton label="Salvar" isPending={false} />);
    expect(screen.getByRole("button")).not.toBeDisabled();
  });

  it("mostra spinner quando isPending é true", () => {
    render(<SubmitButton label="Salvando..." isPending={true} />);
    const button = screen.getByRole("button");
    expect(button.querySelector("[aria-hidden='true']")).toBeInTheDocument();
  });

  it("não mostra spinner quando isPending é false", () => {
    render(<SubmitButton label="Salvar" isPending={false} />);
    const button = screen.getByRole("button");
    expect(button.querySelector("[aria-hidden='true']")).not.toBeInTheDocument();
  });
});
