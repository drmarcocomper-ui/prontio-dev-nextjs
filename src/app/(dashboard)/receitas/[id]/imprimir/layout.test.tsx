import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import ImprimirLayout from "./layout";

describe("ImprimirLayout", () => {
  it("renderiza children", () => {
    render(
      <ImprimirLayout>
        <div data-testid="child">Conteúdo filho</div>
      </ImprimirLayout>,
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(screen.getByText("Conteúdo filho")).toBeInTheDocument();
  });
});
