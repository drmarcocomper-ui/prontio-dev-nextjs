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

import AgendaError from "./error";

describe("AgendaError", () => {
  it("renderiza ModuleError com props corretas", () => {
    render(<AgendaError error={new Error("fail")} reset={vi.fn()} />);
    expect(screen.getByTestId("backHref")).toHaveTextContent("/agenda");
    expect(screen.getByTestId("backLabel")).toHaveTextContent("Voltar à agenda");
  });

  it("passa a função reset para ModuleError", async () => {
    const reset = vi.fn();
    render(<AgendaError error={new Error("fail")} reset={reset} />);
    await userEvent.click(screen.getByText("Reset"));
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
