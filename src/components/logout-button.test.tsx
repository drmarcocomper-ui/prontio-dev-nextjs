import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";

const mockLogout = vi.fn();

vi.mock("@/app/login/actions", () => ({
  logout: (...args: unknown[]) => mockLogout(...args),
}));

import { LogoutButton } from "./logout-button";

describe("LogoutButton", () => {
  it("renderiza o botão com texto Sair", () => {
    render(<LogoutButton />);
    expect(screen.getByText("Sair")).toBeInTheDocument();
  });

  it("renderiza como um botão", () => {
    render(<LogoutButton />);
    expect(screen.getByRole("button", { name: "Sair" })).toBeInTheDocument();
  });

  it("chama logout ao clicar", async () => {
    render(<LogoutButton />);
    await userEvent.click(screen.getByText("Sair"));
    expect(mockLogout).toHaveBeenCalledOnce();
  });

  it("renderiza o ícone SVG", () => {
    render(<LogoutButton />);
    const button = screen.getByRole("button", { name: "Sair" });
    const svg = button.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });
});
