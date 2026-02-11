import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { StatusBadge } from "./status-badge";

describe("StatusBadge", () => {
  it("renderiza label correto para cada status", () => {
    const statuses = [
      { value: "agendado", label: "Agendado" },
      { value: "confirmado", label: "Confirmado" },
      { value: "em_atendimento", label: "Em atendimento" },
      { value: "atendido", label: "Atendido" },
      { value: "cancelado", label: "Cancelado" },
      { value: "faltou", label: "Faltou" },
    ];

    for (const { value, label } of statuses) {
      const { unmount } = render(<StatusBadge status={value} />);
      expect(screen.getByText(label)).toBeInTheDocument();
      unmount();
    }
  });

  it("não renderiza nada para status desconhecido", () => {
    const { container } = render(<StatusBadge status="invalido" />);
    expect(container.innerHTML).toBe("");
  });

  it("aplica classes de cor corretas", () => {
    render(<StatusBadge status="atendido" />);
    const badge = screen.getByText("Atendido");
    expect(badge.className).toContain("bg-emerald-100");
    expect(badge.className).toContain("text-emerald-700");
  });
});
