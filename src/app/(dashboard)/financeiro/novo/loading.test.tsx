import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import NovaTransacaoLoading from "./loading";

describe("NovaTransacaoLoading", () => {
  it("renderiza skeletons de carregamento", () => {
    const { container } = render(<NovaTransacaoLoading />);
    const skeletons = container.querySelectorAll(".skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
