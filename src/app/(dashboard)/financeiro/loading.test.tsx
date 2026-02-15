import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import FinanceiroLoading from "./loading";

describe("FinanceiroLoading", () => {
  it("renderiza skeletons de carregamento", () => {
    const { container } = render(<FinanceiroLoading />);
    const skeletons = container.querySelectorAll(".skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renderiza 3 cards de resumo", () => {
    const { container } = render(<FinanceiroLoading />);
    const grid = container.querySelector(".sm\\:grid-cols-3");
    const cards = grid!.querySelectorAll(".rounded-xl.border");
    expect(cards.length).toBe(3);
  });
});
