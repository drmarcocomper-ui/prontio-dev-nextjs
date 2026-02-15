import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import AgendamentoDetalhesLoading from "./loading";

describe("AgendamentoDetalhesLoading", () => {
  it("renderiza skeletons de carregamento", () => {
    const { container } = render(<AgendamentoDetalhesLoading />);
    const skeletons = container.querySelectorAll(".skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
