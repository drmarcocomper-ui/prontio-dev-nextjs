import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import ReceitasLoading from "./loading";

describe("ReceitasLoading", () => {
  it("renderiza skeletons de carregamento", () => {
    const { container } = render(<ReceitasLoading />);
    const skeletons = container.querySelectorAll(".skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renderiza 5 cards de receita", () => {
    const { container } = render(<ReceitasLoading />);
    const cards = container.querySelectorAll(".rounded-xl.border");
    expect(cards.length).toBe(5);
  });
});
