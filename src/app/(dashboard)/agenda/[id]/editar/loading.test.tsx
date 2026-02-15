import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import EditarAgendamentoLoading from "./loading";

describe("EditarAgendamentoLoading", () => {
  it("renderiza skeletons de carregamento", () => {
    const { container } = render(<EditarAgendamentoLoading />);
    const skeletons = container.querySelectorAll(".skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
