import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import ConfiguracoesLoading from "./loading";

describe("ConfiguracoesLoading", () => {
  it("renderiza skeletons de carregamento", () => {
    const { container } = render(<ConfiguracoesLoading />);
    const skeletons = container.querySelectorAll(".skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renderiza 4 tabs", () => {
    const { container } = render(<ConfiguracoesLoading />);
    const tabsContainer = container.querySelector(".border-b.border-gray-200");
    const tabs = tabsContainer!.querySelectorAll(".skeleton");
    expect(tabs.length).toBe(4);
  });
});
