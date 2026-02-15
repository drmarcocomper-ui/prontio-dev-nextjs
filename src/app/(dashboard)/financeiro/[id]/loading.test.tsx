import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import TransacaoDetalhesLoading from "./loading";

describe("TransacaoDetalhesLoading", () => {
  it("renderiza skeletons de carregamento", () => {
    const { container } = render(<TransacaoDetalhesLoading />);
    const skeletons = container.querySelectorAll(".skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
