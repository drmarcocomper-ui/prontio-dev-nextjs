import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import ProntuarioDetalhesLoading from "./loading";

describe("ProntuarioDetalhesLoading", () => {
  it("renderiza skeletons de carregamento", () => {
    const { container } = render(<ProntuarioDetalhesLoading />);
    const skeletons = container.querySelectorAll(".skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
