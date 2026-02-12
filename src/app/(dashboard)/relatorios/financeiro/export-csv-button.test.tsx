import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ExportCsvButton, type TransacaoCSV } from "./export-csv-button";

const mockData: TransacaoCSV[] = [
  {
    data: "15/06/2024",
    tipo: "Receita",
    categoria: "Consulta",
    descricao: "Consulta particular",
    valor: "350,00",
    forma_pagamento: "PIX",
    status: "Pago",
    paciente: "Maria Silva",
  },
  {
    data: "14/06/2024",
    tipo: "Despesa",
    categoria: "Material",
    descricao: 'Material "especial"',
    valor: "120,00",
    forma_pagamento: "Cartão de crédito",
    status: "Pendente",
    paciente: "",
  },
];

function readBlobText(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(blob, "utf-8");
  });
}

describe("ExportCsvButton", () => {
  let mockCreateObjectURL: ReturnType<typeof vi.fn>;
  let mockRevokeObjectURL: ReturnType<typeof vi.fn>;
  let mockClick: ReturnType<typeof vi.fn>;
  const originalCreateElement = document.createElement.bind(document);

  beforeEach(() => {
    mockCreateObjectURL = vi.fn().mockReturnValue("blob:test");
    mockRevokeObjectURL = vi.fn();
    mockClick = vi.fn();

    global.URL.createObjectURL = mockCreateObjectURL as typeof URL.createObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL as typeof URL.revokeObjectURL;

    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "a") {
        return { click: mockClick, href: "", download: "" } as unknown as HTMLAnchorElement;
      }
      return originalCreateElement(tag);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renderiza o botão Exportar CSV", () => {
    render(<ExportCsvButton data={mockData} month="2024-06" />);
    expect(screen.getByText("Exportar CSV")).toBeInTheDocument();
  });

  it("gera e faz download do CSV ao clicar", async () => {
    render(<ExportCsvButton data={mockData} month="2024-06" />);
    await userEvent.click(screen.getByText("Exportar CSV"));

    expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
    const blob = mockCreateObjectURL.mock.calls[0][0] as Blob;
    expect(blob.type).toBe("text/csv;charset=utf-8;");

    expect(mockClick).toHaveBeenCalledTimes(1);
    expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:test");
  });

  it("usa ponto-e-vírgula como delimitador", async () => {
    render(<ExportCsvButton data={mockData} month="2024-06" />);
    await userEvent.click(screen.getByText("Exportar CSV"));

    const blob = mockCreateObjectURL.mock.calls[0][0] as Blob;
    const text = await readBlobText(blob);
    expect(text).toContain(";");
    expect(text).toContain("Data;Tipo;Categoria");
  });

  it("inclui BOM para UTF-8", async () => {
    render(<ExportCsvButton data={mockData} month="2024-06" />);
    await userEvent.click(screen.getByText("Exportar CSV"));

    const blob = mockCreateObjectURL.mock.calls[0][0] as Blob;
    // Read raw bytes to verify BOM presence
    const rawText = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const arr = new Uint8Array(reader.result as ArrayBuffer);
        // BOM in UTF-8 is EF BB BF
        resolve(arr.slice(0, 3).join(","));
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(blob);
    });
    expect(rawText).toBe("239,187,191");
  });

  it("escapa aspas duplas nos valores", async () => {
    render(<ExportCsvButton data={mockData} month="2024-06" />);
    await userEvent.click(screen.getByText("Exportar CSV"));

    const blob = mockCreateObjectURL.mock.calls[0][0] as Blob;
    const text = await readBlobText(blob);
    expect(text).toContain('""especial""');
  });

  it("SVG tem aria-hidden", () => {
    render(<ExportCsvButton data={mockData} month="2024-06" />);
    const svg = document.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });
});
