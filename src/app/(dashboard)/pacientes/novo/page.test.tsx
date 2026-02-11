import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("./paciente-form", () => ({
  PacienteForm: () => <form data-testid="paciente-form" />,
}));

import NovoPacientePage from "./page";

describe("NovoPacientePage", () => {
  it("renderiza o título Novo paciente", () => {
    render(<NovoPacientePage />);
    expect(screen.getByText("Novo paciente")).toBeInTheDocument();
  });

  it("renderiza o breadcrumb para pacientes", () => {
    render(<NovoPacientePage />);
    const link = screen.getByText("Pacientes").closest("a");
    expect(link).toHaveAttribute("href", "/pacientes");
  });

  it("renderiza o PacienteForm", () => {
    render(<NovoPacientePage />);
    expect(screen.getByTestId("paciente-form")).toBeInTheDocument();
  });
});
