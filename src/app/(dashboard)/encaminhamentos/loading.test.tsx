import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import EncaminhamentosLoading from "./loading";

describe("EncaminhamentosLoading", () => {
  it("renderiza skeletons de carregamento", () => {
    const { container } = render(<EncaminhamentosLoading />);
    const skeletons = container.querySelectorAll(".skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renderiza 5 cards de encaminhamento", () => {
    const { container } = render(<EncaminhamentosLoading />);
    const cards = container.querySelectorAll(".rounded-xl.border");
    expect(cards.length).toBe(5);
  });
});
