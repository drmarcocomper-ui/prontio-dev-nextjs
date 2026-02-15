import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import ProntuariosLoading from "./loading";

describe("ProntuariosLoading", () => {
  it("renderiza skeletons de carregamento", () => {
    const { container } = render(<ProntuariosLoading />);
    const skeletons = container.querySelectorAll(".skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renderiza 5 cards de prontuários", () => {
    const { container } = render(<ProntuariosLoading />);
    const cards = container.querySelectorAll(".rounded-xl.border");
    expect(cards.length).toBe(5);
  });
});
