import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import NovoEncaminhamentoLoading from "./loading";

describe("NovoEncaminhamentoLoading", () => {
  it("renderiza skeletons de carregamento", () => {
    const { container } = render(<NovoEncaminhamentoLoading />);
    const skeletons = container.querySelectorAll(".skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
