import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import PacientesLoading from "./loading";

describe("PacientesLoading", () => {
  it("renderiza skeletons de carregamento", () => {
    const { container } = render(<PacientesLoading />);
    const skeletons = container.querySelectorAll(".skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renderiza 6 linhas na tabela", () => {
    const { container } = render(<PacientesLoading />);
    const table = container.querySelector(".rounded-xl.border");
    const rows = table!.querySelectorAll(".border-t");
    expect(rows.length).toBe(6);
  });
});
