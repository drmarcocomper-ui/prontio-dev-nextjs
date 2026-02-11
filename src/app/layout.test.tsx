import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "--font-geist-sans" }),
  Geist_Mono: () => ({ variable: "--font-geist-mono" }),
}));

vi.mock("sonner", () => ({
  Toaster: () => <div data-testid="toaster" />,
}));

import RootLayout from "./layout";

describe("RootLayout", () => {
  it("renderiza children", () => {
    render(
      <RootLayout>
        <div data-testid="child">Conteúdo</div>
      </RootLayout>
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(screen.getByText("Conteúdo")).toBeInTheDocument();
  });

  it("renderiza o Toaster", () => {
    render(
      <RootLayout>
        <div />
      </RootLayout>
    );
    expect(screen.getByTestId("toaster")).toBeInTheDocument();
  });
});
