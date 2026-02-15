import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import NovaReceitaLoading from "./loading";

describe("NovaReceitaLoading", () => {
  it("renderiza skeletons de carregamento", () => {
    const { container } = render(<NovaReceitaLoading />);
    const skeletons = container.querySelectorAll(".skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
