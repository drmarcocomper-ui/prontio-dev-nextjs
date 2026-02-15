import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import NovoProntuarioLoading from "./loading";

describe("NovoProntuarioLoading", () => {
  it("renderiza skeletons de carregamento", () => {
    const { container } = render(<NovoProntuarioLoading />);
    const skeletons = container.querySelectorAll(".skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
