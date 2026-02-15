import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";

vi.mock("@/components/module-error", () => ({
  ModuleError: ({
    reset,
    backHref,
    backLabel,
  }: {
    reset: () => void;
    backHref: string;
    backLabel: string;
  }) => (
    <div>
      <span data-testid="backHref">{backHref}</span>
      <span data-testid="backLabel">{backLabel}</span>
      <button onClick={reset}>Reset</button>
    </div>
  ),
}));

import DashboardError from "./error";

describe("DashboardError", () => {
  it("renderiza ModuleError com backHref \"/\" e backLabel \"Voltar ao painel\"", () => {
    render(
      <DashboardError error={new Error("fail")} reset={vi.fn()} />,
    );
    expect(screen.getByTestId("backHref")).toHaveTextContent("/");
    expect(screen.getByTestId("backLabel")).toHaveTextContent(
      "Voltar ao painel",
    );
  });

  it("passa a função reset para ModuleError", async () => {
    const reset = vi.fn();
    render(<DashboardError error={new Error("fail")} reset={reset} />);
    await userEvent.click(screen.getByText("Reset"));
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
