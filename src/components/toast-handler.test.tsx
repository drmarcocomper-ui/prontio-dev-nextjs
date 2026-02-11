import { render } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockReplace = vi.fn();
let mockSearchParams = new URLSearchParams();
let mockPathname = "/";

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams,
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => mockPathname,
}));

const { mockToastSuccess } = vi.hoisted(() => ({
  mockToastSuccess: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: mockToastSuccess },
}));

import { ToastHandler } from "./toast-handler";

describe("ToastHandler", () => {
  beforeEach(() => {
    mockSearchParams = new URLSearchParams();
    mockPathname = "/";
    mockReplace.mockClear();
    mockToastSuccess.mockClear();
  });

  it("não renderiza nada visualmente", () => {
    const { container } = render(<ToastHandler />);
    expect(container.innerHTML).toBe("");
  });

  it("exibe toast de sucesso quando search param success existe", () => {
    mockSearchParams = new URLSearchParams("success=Paciente+criado");
    render(<ToastHandler />);
    expect(mockToastSuccess).toHaveBeenCalledWith("Paciente criado");
  });

  it("remove o param success da URL após exibir o toast", () => {
    mockPathname = "/pacientes";
    mockSearchParams = new URLSearchParams("success=Salvo");
    render(<ToastHandler />);
    expect(mockReplace).toHaveBeenCalledWith("/pacientes", { scroll: false });
  });

  it("preserva outros search params ao remover success", () => {
    mockPathname = "/pacientes";
    mockSearchParams = new URLSearchParams("success=Salvo&page=2");
    render(<ToastHandler />);
    expect(mockReplace).toHaveBeenCalledWith("/pacientes?page=2", { scroll: false });
  });

  it("não exibe toast quando search param success não existe", () => {
    mockSearchParams = new URLSearchParams("page=1");
    render(<ToastHandler />);
    expect(mockToastSuccess).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
