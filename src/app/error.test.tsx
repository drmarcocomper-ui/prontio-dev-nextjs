import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import GlobalError from "./error";

describe("GlobalError", () => {
  it("renderiza o título \"Algo deu errado\"", () => {
    render(<GlobalError error={new Error("fail")} reset={vi.fn()} />);
    expect(screen.getByText("Algo deu errado")).toBeInTheDocument();
  });

  it("renderiza a descrição", () => {
    render(<GlobalError error={new Error("fail")} reset={vi.fn()} />);
    expect(
      screen.getByText("Ocorreu um erro inesperado. Tente novamente."),
    ).toBeInTheDocument();
  });

  it("chama reset ao clicar em \"Tentar novamente\"", async () => {
    const reset = vi.fn();
    render(<GlobalError error={new Error("fail")} reset={reset} />);
    await userEvent.click(screen.getByText("Tentar novamente"));
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
