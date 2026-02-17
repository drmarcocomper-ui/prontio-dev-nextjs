import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import NovaSolicitacaoExameLoading from "./loading";

describe("NovaSolicitacaoExameLoading", () => {
  it("renderiza skeletons de carregamento", () => {
    const { container } = render(<NovaSolicitacaoExameLoading />);
    const skeletons = container.querySelectorAll(".skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
