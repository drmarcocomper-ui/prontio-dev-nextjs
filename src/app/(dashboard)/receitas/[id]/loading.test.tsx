import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import ReceitaDetalhesLoading from "./loading";

describe("ReceitaDetalhesLoading", () => {
  it("renderiza skeletons de carregamento", () => {
    const { container } = render(<ReceitaDetalhesLoading />);
    const skeletons = container.querySelectorAll(".skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
