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

import TransacaoNotFound from "./not-found";

describe("TransacaoNotFound", () => {
  it("renderiza ModuleNotFound com props corretas", () => {
    render(<TransacaoNotFound />);
    expect(screen.getByTestId("backHref")).toHaveTextContent("/financeiro");
    expect(screen.getByTestId("backLabel")).toHaveTextContent("Voltar ao financeiro");
  });
});
