import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("@/components/sidebar", () => ({
  Sidebar: () => <aside data-testid="sidebar">Sidebar</aside>,
}));

vi.mock("@/components/toast-handler", () => ({
  ToastHandler: () => null,
}));

import DashboardLayout from "./layout";

describe("DashboardLayout", () => {
  it("renderiza a Sidebar", () => {
    render(<DashboardLayout><p>conteúdo</p></DashboardLayout>);
    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
  });

  it("renderiza o conteúdo children dentro do main", () => {
    render(<DashboardLayout><p>conteúdo de teste</p></DashboardLayout>);
    const main = screen.getByRole("main");
    expect(main).toBeInTheDocument();
    expect(main).toHaveTextContent("conteúdo de teste");
  });

  it("renderiza o layout com estrutura flex", () => {
    const { container } = render(
      <DashboardLayout><p>conteúdo</p></DashboardLayout>
    );
    const wrapper = container.firstElementChild;
    expect(wrapper?.className).toContain("flex");
    expect(wrapper?.className).toContain("h-screen");
  });
});
