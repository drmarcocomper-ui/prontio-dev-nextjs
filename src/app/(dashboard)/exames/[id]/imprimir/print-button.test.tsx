import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPush = vi.fn();
let mockSearchParamsMap: Record<string, string> = {};

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({
    get: (key: string) => mockSearchParamsMap[key] ?? null,
  }),
}));

import { PrintActions } from "./print-button";

const defaultProps = {
  id: "ex-123",
  defaultFormato: "particular",
  defaultOperadora: "",
  defaultCarteirinha: "",
  defaultRegistroANS: "",
};

describe("PrintActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParamsMap = {};
  });

  it("renderiza os botões Particular, SADT e Imprimir", () => {
    render(<PrintActions {...defaultProps} />);
    expect(
      screen.getByRole("button", { name: /Particular/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /SADT/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Imprimir/i })
    ).toBeInTheDocument();
  });

  it("navega para formato particular ao clicar no botão Particular", async () => {
    render(<PrintActions {...defaultProps} />);
    await userEvent.click(
      screen.getByRole("button", { name: /Particular/i })
    );

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("/exames/ex-123/imprimir?formato=particular")
    );
  });

  it("navega para formato SADT ao clicar no botão SADT", async () => {
    render(<PrintActions {...defaultProps} />);
    await userEvent.click(screen.getByRole("button", { name: /SADT/i }));

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("/exames/ex-123/imprimir?formato=sadt")
    );
  });

  it("chama window.print ao clicar no botão Imprimir", async () => {
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});
    render(<PrintActions {...defaultProps} />);
    await userEvent.click(
      screen.getByRole("button", { name: /Imprimir/i })
    );

    expect(printSpy).toHaveBeenCalled();
    printSpy.mockRestore();
  });

  it("não exibe campos do convênio quando formato é particular", () => {
    render(<PrintActions {...defaultProps} />);
    expect(screen.queryByLabelText("Operadora")).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("N° Carteirinha")
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Registro ANS")).not.toBeInTheDocument();
  });

  it("exibe campos do convênio quando formato é SADT", () => {
    mockSearchParamsMap = { formato: "sadt" };
    render(<PrintActions {...defaultProps} />);

    expect(screen.getByLabelText("Operadora")).toBeInTheDocument();
    expect(screen.getByLabelText("N° Carteirinha")).toBeInTheDocument();
    expect(screen.getByLabelText("Registro ANS")).toBeInTheDocument();
  });

  it("preenche campos do convênio com valores padrão", () => {
    mockSearchParamsMap = { formato: "sadt" };
    render(
      <PrintActions
        {...defaultProps}
        defaultOperadora="Unimed"
        defaultCarteirinha="123456"
        defaultRegistroANS="ANS-789"
      />
    );

    expect(screen.getByLabelText("Operadora")).toHaveValue("Unimed");
    expect(screen.getByLabelText("N° Carteirinha")).toHaveValue("123456");
    expect(screen.getByLabelText("Registro ANS")).toHaveValue("ANS-789");
  });

  it("navega com dados do convênio ao clicar 'Aplicar dados'", async () => {
    mockSearchParamsMap = { formato: "sadt" };
    render(
      <PrintActions
        {...defaultProps}
        defaultOperadora="Unimed"
        defaultCarteirinha="123456"
        defaultRegistroANS="ANS-789"
      />
    );

    await userEvent.click(
      screen.getByRole("button", { name: /Aplicar dados/i })
    );

    expect(mockPush).toHaveBeenCalledTimes(1);
    const url = mockPush.mock.calls[0][0] as string;
    expect(url).toContain("formato=sadt");
    expect(url).toContain("operadora=Unimed");
    expect(url).toContain("carteirinha=123456");
    expect(url).toContain("registro_ans=ANS-789");
  });

  it("inclui dados do convênio ao navegar para SADT com campos preenchidos", async () => {
    mockSearchParamsMap = { formato: "sadt" };
    render(
      <PrintActions
        {...defaultProps}
        defaultOperadora="Unimed"
        defaultCarteirinha="123456"
        defaultRegistroANS="ANS-789"
      />
    );

    await userEvent.click(screen.getByRole("button", { name: /SADT/i }));

    const url = mockPush.mock.calls[0][0] as string;
    expect(url).toContain("formato=sadt");
    expect(url).toContain("operadora=Unimed");
    expect(url).toContain("carteirinha=123456");
    expect(url).toContain("registro_ans=ANS-789");
  });

  it("permite editar os campos do convênio", async () => {
    mockSearchParamsMap = { formato: "sadt" };
    render(<PrintActions {...defaultProps} />);

    const operadoraInput = screen.getByLabelText("Operadora");
    await userEvent.type(operadoraInput, "Bradesco");
    expect(operadoraInput).toHaveValue("Bradesco");

    const carteirinhaInput = screen.getByLabelText("N° Carteirinha");
    await userEvent.type(carteirinhaInput, "999888");
    expect(carteirinhaInput).toHaveValue("999888");

    const registroInput = screen.getByLabelText("Registro ANS");
    await userEvent.type(registroInput, "ANS-456");
    expect(registroInput).toHaveValue("ANS-456");
  });
});
