import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import EditarExameLoading from "./loading";

describe("EditarExameLoading", () => {
  it("renderiza skeletons de carregamento", () => {
    const { container } = render(<EditarExameLoading />);
    const skeletons = container.querySelectorAll(".skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
