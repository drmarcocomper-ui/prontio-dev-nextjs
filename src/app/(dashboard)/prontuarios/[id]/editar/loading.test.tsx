import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import EditarProntuarioLoading from "./loading";

describe("EditarProntuarioLoading", () => {
  it("renderiza skeletons de carregamento", () => {
    const { container } = render(<EditarProntuarioLoading />);
    const skeletons = container.querySelectorAll(".skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
