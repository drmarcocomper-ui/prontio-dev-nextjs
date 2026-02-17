import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import AgendaLoading from "./loading";

describe("AgendaLoading", () => {
  it("renderiza skeletons de carregamento", () => {
    const { container } = render(<AgendaLoading />);
    const skeletons = container.querySelectorAll(".skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renderiza card com linhas de horário", () => {
    const { container } = render(<AgendaLoading />);
    const cards = container.querySelectorAll(".rounded-xl.border");
    expect(cards.length).toBe(1);
    const rows = container.querySelectorAll(".flex.items-center");
    expect(rows.length).toBeGreaterThanOrEqual(10);
  });
});
