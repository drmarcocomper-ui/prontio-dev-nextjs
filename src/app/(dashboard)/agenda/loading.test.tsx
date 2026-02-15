import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import AgendaLoading from "./loading";

describe("AgendaLoading", () => {
  it("renderiza skeletons de carregamento", () => {
    const { container } = render(<AgendaLoading />);
    const skeletons = container.querySelectorAll(".skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renderiza 4 cards de agendamento", () => {
    const { container } = render(<AgendaLoading />);
    const cards = container.querySelectorAll(".rounded-xl.border");
    expect(cards.length).toBe(4);
  });
});
