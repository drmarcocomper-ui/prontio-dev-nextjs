import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import EditarUsuarioLoading from "./loading";

describe("EditarUsuarioLoading", () => {
  it("renderiza skeletons de carregamento", () => {
    const { container } = render(<EditarUsuarioLoading />);
    const skeletons = container.querySelectorAll(".skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
