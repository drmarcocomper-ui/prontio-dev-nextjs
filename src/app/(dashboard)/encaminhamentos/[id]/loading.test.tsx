import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import EncaminhamentoDetalhesLoading from "./loading";

describe("EncaminhamentoDetalhesLoading", () => {
  it("renderiza skeletons de carregamento", () => {
    const { container } = render(<EncaminhamentoDetalhesLoading />);
    const skeletons = container.querySelectorAll(".skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
