import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { DadosForm } from "./dados-form";

const originalFetch = global.fetch;

describe("DadosForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("renderiza título 'Backup dos dados'", () => {
    render(<DadosForm />);
    expect(screen.getByText("Backup dos dados")).toBeInTheDocument();
  });

  it("renderiza botão 'Baixar backup'", () => {
    render(<DadosForm />);
    expect(screen.getByRole("button", { name: /Baixar backup/ })).toBeInTheDocument();
  });

  it("renderiza seção 'Sobre seus dados'", () => {
    render(<DadosForm />);
    expect(screen.getByText("Sobre seus dados")).toBeInTheDocument();
  });

  it("renderiza itens de segurança", () => {
    render(<DadosForm />);
    expect(screen.getByText("Criptografia em trânsito (HTTPS/TLS)")).toBeInTheDocument();
    expect(screen.getByText("Criptografia em repouso (AES-256)")).toBeInTheDocument();
    expect(screen.getByText("Controle de acesso por linha (RLS)")).toBeInTheDocument();
  });

  it("chama fetch ao clicar no botão", async () => {
    const mockBlob = new Blob(["test"], { type: "application/json" });
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
      headers: new Headers({ "Content-Disposition": 'attachment; filename="backup.json"' }),
    });
    URL.createObjectURL = vi.fn(() => "blob:test");
    URL.revokeObjectURL = vi.fn();

    const user = userEvent.setup();
    render(<DadosForm />);

    await user.click(screen.getByRole("button", { name: /Baixar backup/ }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/backup");
    });
  });

  it("exibe 'Gerando backup...' durante o download", async () => {
    let resolveFetch!: (value: unknown) => void;
    const fetchPromise = new Promise((resolve) => {
      resolveFetch = resolve;
    });
    global.fetch = vi.fn().mockReturnValue(fetchPromise);

    const user = userEvent.setup();
    render(<DadosForm />);

    await user.click(screen.getByRole("button", { name: /Baixar backup/ }));

    expect(screen.getByText("Gerando backup...")).toBeInTheDocument();

    const mockBlob = new Blob(["test"], { type: "application/json" });
    URL.createObjectURL = vi.fn(() => "blob:test");
    URL.revokeObjectURL = vi.fn();
    resolveFetch({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
      headers: new Headers({ "Content-Disposition": 'attachment; filename="backup.json"' }),
    });

    await waitFor(() => {
      expect(screen.getByText("Baixar backup")).toBeInTheDocument();
    });
  });

  it("exibe alert quando fetch falha", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    const user = userEvent.setup();
    render(<DadosForm />);

    await user.click(screen.getByRole("button", { name: /Baixar backup/ }));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Erro ao baixar o backup. Tente novamente.");
    });
  });
});
