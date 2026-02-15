import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import NovoAgendamentoLoading from "./loading";

describe("NovoAgendamentoLoading", () => {
  it("renderiza skeletons de carregamento", () => {
    const { container } = render(<NovoAgendamentoLoading />);
    const skeletons = container.querySelectorAll(".skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
