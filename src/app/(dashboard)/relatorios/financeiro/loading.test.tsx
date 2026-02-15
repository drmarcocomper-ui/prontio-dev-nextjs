import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import Loading from "./loading";

describe("RelatorioFinanceiroLoading", () => {
  it("renderiza skeletons de carregamento", () => {
    const { container } = render(<Loading />);
    const skeletons = container.querySelectorAll(".skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renderiza 4 KPI cards", () => {
    const { container } = render(<Loading />);
    const grid = container.querySelector(".lg\\:grid-cols-4");
    const cards = grid!.querySelectorAll(":scope > div");
    expect(cards.length).toBe(4);
  });
});
