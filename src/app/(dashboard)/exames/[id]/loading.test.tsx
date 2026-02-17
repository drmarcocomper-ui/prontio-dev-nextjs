import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import ExameDetailLoading from "./loading";

describe("ExameDetailLoading", () => {
  it("renderiza skeletons de carregamento", () => {
    const { container } = render(<ExameDetailLoading />);
    const skeletons = container.querySelectorAll(".skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
