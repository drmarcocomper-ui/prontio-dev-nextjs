import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import PacienteDetalhesLoading from "./loading";

describe("PacienteDetalhesLoading", () => {
  it("renderiza skeletons de carregamento", () => {
    const { container } = render(<PacienteDetalhesLoading />);
    const skeletons = container.querySelectorAll(".skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
