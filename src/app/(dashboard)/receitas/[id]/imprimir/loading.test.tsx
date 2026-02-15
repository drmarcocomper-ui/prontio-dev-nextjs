import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import Loading from "./loading";

describe("ImprimirReceitaLoading", () => {
  it("renderiza skeletons de carregamento", () => {
    const { container } = render(<Loading />);
    const skeletons = container.querySelectorAll(".skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
