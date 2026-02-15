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

import DashboardNotFound from "./not-found";

describe("DashboardNotFound", () => {
  it("renderiza ModuleNotFound com backHref \"/\" e backLabel \"Voltar ao painel\"", () => {
    render(<DashboardNotFound />);
    expect(screen.getByTestId("backHref")).toHaveTextContent("/");
    expect(screen.getByTestId("backLabel")).toHaveTextContent(
      "Voltar ao painel",
    );
  });
});
