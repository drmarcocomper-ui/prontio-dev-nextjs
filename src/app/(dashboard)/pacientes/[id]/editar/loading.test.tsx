import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import EditarPacienteLoading from "./loading";

describe("EditarPacienteLoading", () => {
  it("renderiza skeletons de carregamento", () => {
    const { container } = render(<EditarPacienteLoading />);
    const skeletons = container.querySelectorAll(".skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
