import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("@/components/module-not-found", () => ({
  ModuleNotFound: ({
    backHref,
    backLabel,
  }: {
    backHref: string;
    backLabel: string;
  }) => (
    <div>
      <span data-testid="backHref">{backHref}</span>
      <span data-testid="backLabel">{backLabel}</span>
    </div>
  ),
}));

import AgendamentoNotFound from "./not-found";

describe("AgendamentoNotFound", () => {
  it("renderiza ModuleNotFound com props corretas", () => {
    render(<AgendamentoNotFound />);
    expect(screen.getByTestId("backHref")).toHaveTextContent("/agenda");
    expect(screen.getByTestId("backLabel")).toHaveTextContent("Voltar à agenda");
  });
});
