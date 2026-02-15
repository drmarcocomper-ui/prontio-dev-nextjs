import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import EditarTransacaoLoading from "./loading";

describe("EditarTransacaoLoading", () => {
  it("renderiza skeletons de carregamento", () => {
    const { container } = render(<EditarTransacaoLoading />);
    const skeletons = container.querySelectorAll(".skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
