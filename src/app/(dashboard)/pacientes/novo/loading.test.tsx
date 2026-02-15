import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import NovoPacienteLoading from "./loading";

describe("NovoPacienteLoading", () => {
  it("renderiza skeletons de carregamento", () => {
    const { container } = render(<NovoPacienteLoading />);
    const skeletons = container.querySelectorAll(".skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
