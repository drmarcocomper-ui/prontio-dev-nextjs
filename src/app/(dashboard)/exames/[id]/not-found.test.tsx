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

import ExameNotFound from "./not-found";

describe("ExameNotFound", () => {
  it("renderiza ModuleNotFound com props corretas", () => {
    render(<ExameNotFound />);
    expect(screen.getByTestId("backHref")).toHaveTextContent("/exames");
    expect(screen.getByTestId("backLabel")).toHaveTextContent("Voltar a exames");
  });
});
