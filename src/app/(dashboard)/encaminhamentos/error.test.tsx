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

import EncaminhamentosError from "./error";

describe("EncaminhamentosError", () => {
  it("renderiza ModuleError com props corretas", () => {
    render(<EncaminhamentosError error={new Error("fail")} reset={vi.fn()} />);
    expect(screen.getByTestId("backHref")).toHaveTextContent("/encaminhamentos");
    expect(screen.getByTestId("backLabel")).toHaveTextContent("Voltar a encaminhamentos");
  });

  it("passa a função reset para ModuleError", async () => {
    const reset = vi.fn();
    render(<EncaminhamentosError error={new Error("fail")} reset={reset} />);
    await userEvent.click(screen.getByText("Reset"));
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
