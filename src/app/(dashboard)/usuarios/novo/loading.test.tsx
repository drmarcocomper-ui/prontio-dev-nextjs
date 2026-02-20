import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import NovoUsuarioLoading from "./loading";

describe("NovoUsuarioLoading", () => {
  it("renderiza skeletons de carregamento", () => {
    const { container } = render(<NovoUsuarioLoading />);
    const skeletons = container.querySelectorAll(".skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
