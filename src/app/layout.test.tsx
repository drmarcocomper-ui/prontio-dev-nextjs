import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "--font-geist-sans" }),
  Geist_Mono: () => ({ variable: "--font-geist-mono" }),
}));

vi.mock("sonner", () => ({
  Toaster: () => <div data-testid="toaster" />,
}));

vi.mock("@/lib/theme.server", () => ({
  getTheme: vi.fn().mockResolvedValue("sky"),
}));

import RootLayout from "./layout";

describe("RootLayout", () => {
  it("renderiza children", async () => {
    const layout = await RootLayout({
      children: <div data-testid="child">Conteúdo</div>,
    });
    render(layout);
    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(screen.getByText("Conteúdo")).toBeInTheDocument();
  });

  it("renderiza o Toaster", async () => {
    const layout = await RootLayout({ children: <div /> });
    render(layout);
    expect(screen.getByTestId("toaster")).toBeInTheDocument();
  });
});
