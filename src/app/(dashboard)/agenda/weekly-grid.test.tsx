import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import { WeeklyGrid } from "./weekly-grid";
import type { TimeSlot } from "./time-grid";
import type { Agendamento } from "./types";

const agendamentoMock: Agendamento = {
  id: "ag-1",
  paciente_id: "p-1",
  data: "2024-06-11",
  hora_inicio: "09:00:00",
  hora_fim: "09:30:00",
  tipo: "consulta",
  status: "agendado",
  valor: 350,
  observacoes: null,
  created_at: "2024-06-11T08:00:00Z",
  pacientes: { id: "p-1", nome: "Maria Silva" },
};

// Mon-Sat week: 2024-06-10 (Mon) to 2024-06-15 (Sat)
const weekDates = ["2024-06-10", "2024-06-11", "2024-06-12", "2024-06-13", "2024-06-14", "2024-06-15"];

function makeSlots(type: TimeSlot["type"] = "available", agendamento?: Agendamento): TimeSlot[] {
  return [
    { time: "09:00", timeEnd: "09:30", type, agendamento },
  ];
}

describe("WeeklyGrid", () => {
  it("exibe mensagem quando não há horários configurados", () => {
    const slotsByDate: Record<string, TimeSlot[]> = {};
    render(<WeeklyGrid slotsByDate={slotsByDate} weekDates={weekDates} todayStr="2024-06-12" />);
    expect(screen.getByText("Nenhum horário configurado")).toBeInTheDocument();
    expect(screen.getByText("Configure os horários de atendimento nas configurações.")).toBeInTheDocument();
  });

  it("renderiza cabeçalhos dos dias da semana", () => {
    const slotsByDate: Record<string, TimeSlot[]> = {
      "2024-06-10": makeSlots(),
      "2024-06-11": makeSlots(),
      "2024-06-12": makeSlots(),
      "2024-06-13": makeSlots(),
      "2024-06-14": makeSlots(),
      "2024-06-15": makeSlots(),
    };
    render(<WeeklyGrid slotsByDate={slotsByDate} weekDates={weekDates} todayStr="2024-06-12" />);
    expect(screen.getByText("seg")).toBeInTheDocument();
    expect(screen.getByText("ter")).toBeInTheDocument();
    expect(screen.getByText("qua")).toBeInTheDocument();
    expect(screen.getByText("qui")).toBeInTheDocument();
    expect(screen.getByText("sex")).toBeInTheDocument();
  });

  it("renderiza números dos dias", () => {
    const slotsByDate: Record<string, TimeSlot[]> = {
      "2024-06-10": makeSlots(),
    };
    render(<WeeklyGrid slotsByDate={slotsByDate} weekDates={weekDates} todayStr="2024-06-12" />);
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("renderiza horário na coluna lateral", () => {
    const slotsByDate: Record<string, TimeSlot[]> = {
      "2024-06-10": makeSlots(),
    };
    render(<WeeklyGrid slotsByDate={slotsByDate} weekDates={weekDates} todayStr="2024-06-12" />);
    expect(screen.getByText("09:00")).toBeInTheDocument();
  });

  it("renderiza slot disponível com link para agendar", () => {
    const slotsByDate: Record<string, TimeSlot[]> = {
      "2024-06-10": makeSlots("available"),
    };
    render(<WeeklyGrid slotsByDate={slotsByDate} weekDates={weekDates} todayStr="2024-06-12" />);
    const links = screen.getAllByRole("link");
    const agendarLink = links.find((l) => l.getAttribute("href") === "/agenda/novo?data=2024-06-10&hora=09:00");
    expect(agendarLink).toBeTruthy();
  });

  it("renderiza slot ocupado com iniciais do paciente", () => {
    const slotsByDate: Record<string, TimeSlot[]> = {
      "2024-06-11": makeSlots("occupied", agendamentoMock),
    };
    render(<WeeklyGrid slotsByDate={slotsByDate} weekDates={weekDates} todayStr="2024-06-12" />);
    expect(screen.getByText("MS")).toBeInTheDocument();
  });

  it("renderiza link para detalhes do agendamento ocupado", () => {
    const slotsByDate: Record<string, TimeSlot[]> = {
      "2024-06-11": makeSlots("occupied", agendamentoMock),
    };
    render(<WeeklyGrid slotsByDate={slotsByDate} weekDates={weekDates} todayStr="2024-06-12" />);
    const link = screen.getByText("MS").closest("a");
    expect(link).toHaveAttribute("href", "/agenda/ag-1");
    expect(link).toHaveAttribute("title", "Maria Silva");
  });

  it("renderiza slot de intervalo com traço", () => {
    const slotsByDate: Record<string, TimeSlot[]> = {
      "2024-06-10": makeSlots("break"),
    };
    const { container } = render(<WeeklyGrid slotsByDate={slotsByDate} weekDates={weekDates} todayStr="2024-06-12" />);
    // Break slots render an mdash character
    expect(container.querySelector(".text-gray-300")).toBeInTheDocument();
  });

  it("exibe mensagem vazia quando todos os dias têm slots vazios", () => {
    // Empty arrays for all days = no time labels = empty state
    const slotsByDate: Record<string, TimeSlot[]> = {
      "2024-06-10": [],
      "2024-06-11": [],
      "2024-06-12": [],
      "2024-06-13": [],
      "2024-06-14": [],
      "2024-06-15": [],
    };
    render(<WeeklyGrid slotsByDate={slotsByDate} weekDates={weekDates} todayStr="2024-06-12" />);
    expect(screen.getByText("Nenhum horário configurado")).toBeInTheDocument();
  });
});
