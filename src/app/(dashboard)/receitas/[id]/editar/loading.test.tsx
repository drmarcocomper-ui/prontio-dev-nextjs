import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import EditarReceitaLoading from "./loading";

describe("EditarReceitaLoading", () => {
  it("renderiza skeletons de carregamento", () => {
    const { container } = render(<EditarReceitaLoading />);
    const skeletons = container.querySelectorAll(".skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
