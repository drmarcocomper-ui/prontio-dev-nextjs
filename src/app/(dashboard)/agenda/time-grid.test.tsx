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

vi.mock("./status-select", () => ({
  StatusSelect: ({ agendamentoId, currentStatus }: { agendamentoId: string; currentStatus: string }) => (
    <select data-testid={`status-select-${agendamentoId}`} defaultValue={currentStatus} />
  ),
}));

import { TimeGrid, generateTimeSlots, type TimeSlot } from "./time-grid";
import type { Agendamento } from "./types";

const agendamentoMock: Agendamento = {
  id: "ag-1",
  paciente_id: "p-1",
  data: "2024-06-15",
  hora_inicio: "09:00:00",
  hora_fim: "09:30:00",
  tipo: "consulta",
  status: "agendado",
  valor: 350,
  observacoes: "Primeira consulta",
  created_at: "2024-06-15T08:00:00Z",
  pacientes: { id: "p-1", nome: "Maria Silva" },
};

describe("TimeGrid", () => {
  it("exibe mensagem de dia sem expediente quando isDayOff é true", () => {
    render(<TimeGrid slots={[]} currentDate="2024-06-15" isDayOff={true} />);
    expect(screen.getByText("Sem expediente neste dia")).toBeInTheDocument();
    expect(screen.getByText("Selecione outro dia para ver a agenda.")).toBeInTheDocument();
  });

  it("renderiza slot disponível com link para agendar", () => {
    const slots: TimeSlot[] = [
      { time: "09:00", timeEnd: "09:15", type: "available" },
    ];
    render(<TimeGrid slots={slots} currentDate="2024-06-15" isDayOff={false} />);
    const link = screen.getByText("09:00").closest("a");
    expect(link).toHaveAttribute("href", "/agenda/novo?data=2024-06-15&hora=09:00");
  });

  it("renderiza slot de intervalo", () => {
    const slots: TimeSlot[] = [
      { time: "12:00", timeEnd: "12:15", type: "break" },
    ];
    render(<TimeGrid slots={slots} currentDate="2024-06-15" isDayOff={false} />);
    expect(screen.getByText("Intervalo")).toBeInTheDocument();
    expect(screen.getByText("12:00")).toBeInTheDocument();
  });

  it("renderiza slot ocupado com dados do agendamento", () => {
    const slots: TimeSlot[] = [
      { time: "09:00", timeEnd: "09:30", type: "occupied", agendamento: agendamentoMock },
    ];
    render(<TimeGrid slots={slots} currentDate="2024-06-15" isDayOff={false} />);
    expect(screen.getByText("Maria Silva")).toBeInTheDocument();
    expect(screen.getByText("MS")).toBeInTheDocument();
    const link = screen.getByText("Maria Silva").closest("a");
    expect(link).toHaveAttribute("href", "/agenda/ag-1");
  });

  it("renderiza StatusSelect para slot ocupado", () => {
    const slots: TimeSlot[] = [
      { time: "09:00", timeEnd: "09:30", type: "occupied", agendamento: agendamentoMock },
    ];
    render(<TimeGrid slots={slots} currentDate="2024-06-15" isDayOff={false} />);
    expect(screen.getByTestId("status-select-ag-1")).toBeInTheDocument();
  });

  it("renderiza slot de continuação com horário em cinza claro", () => {
    const slots: TimeSlot[] = [
      { time: "09:15", timeEnd: "09:30", type: "continuation", agendamento: agendamentoMock },
    ];
    const { container } = render(<TimeGrid slots={slots} currentDate="2024-06-15" isDayOff={false} />);
    expect(container.querySelector(".text-gray-300")).toBeInTheDocument();
  });

  it("exibe tipo e observações do agendamento", () => {
    const slots: TimeSlot[] = [
      { time: "09:00", timeEnd: "09:30", type: "occupied", agendamento: agendamentoMock },
    ];
    render(<TimeGrid slots={slots} currentDate="2024-06-15" isDayOff={false} />);
    expect(screen.getByText(/Consulta/)).toBeInTheDocument();
    expect(screen.getByText(/Primeira consulta/)).toBeInTheDocument();
  });

  it("renderiza múltiplos slots", () => {
    const ag2: Agendamento = {
      ...agendamentoMock,
      hora_inicio: "09:30:00",
      hora_fim: "09:45:00",
    };
    const slots: TimeSlot[] = [
      { time: "09:00", timeEnd: "09:15", type: "available" },
      { time: "09:15", timeEnd: "09:30", type: "available" },
      { time: "09:30", timeEnd: "09:45", type: "occupied", agendamento: ag2 },
    ];
    render(<TimeGrid slots={slots} currentDate="2024-06-15" isDayOff={false} />);
    expect(screen.getByText("09:00")).toBeInTheDocument();
    expect(screen.getByText("09:15")).toBeInTheDocument();
    expect(screen.getByText("Maria Silva")).toBeInTheDocument();
  });

  it("não exibe grid quando isDayOff é true", () => {
    render(<TimeGrid slots={[]} currentDate="2024-06-15" isDayOff={true} />);
    expect(screen.queryByText("Agendar")).not.toBeInTheDocument();
  });
});

describe("generateTimeSlots", () => {
  const config = {
    horario_seg_inicio: "08:00",
    horario_seg_fim: "10:00",
  };

  it("gera slots vazios quando não há agendamentos", () => {
    const slots = generateTimeSlots(config, "seg", [], 30);
    expect(slots.length).toBe(4); // 08:00, 08:30, 09:00, 09:30
    expect(slots.every((s) => s.type === "available")).toBe(true);
  });

  it("marca slot como ocupado quando há agendamento", () => {
    const ag: Agendamento = {
      ...agendamentoMock,
      hora_inicio: "08:00:00",
      hora_fim: "08:30:00",
    };
    const slots = generateTimeSlots(config, "seg", [ag], 30);
    expect(slots[0].type).toBe("occupied");
    expect(slots[0].agendamento?.id).toBe("ag-1");
    expect(slots[1].type).toBe("available");
  });

  it("marca slots de continuação para agendamentos longos", () => {
    const ag: Agendamento = {
      ...agendamentoMock,
      hora_inicio: "08:00:00",
      hora_fim: "09:00:00",
    };
    const slots = generateTimeSlots(config, "seg", [ag], 30);
    expect(slots[0].type).toBe("occupied");
    expect(slots[1].type).toBe("continuation");
    expect(slots[2].type).toBe("available");
  });

  it("marca slots de intervalo", () => {
    const configWithBreak = {
      ...config,
      intervalo_seg_inicio: "09:00",
      intervalo_seg_fim: "09:30",
    };
    const slots = generateTimeSlots(configWithBreak, "seg", [], 30);
    expect(slots[2].type).toBe("break");
    expect(slots[2].time).toBe("09:00");
  });

  it("usa horários padrão quando config não tem a chave do dia", () => {
    const slots = generateTimeSlots({}, "seg", [], 60);
    // Padrão: 08:00 a 18:00 = 10 slots de 60 min
    expect(slots.length).toBe(10);
    expect(slots[0].time).toBe("08:00");
    expect(slots[9].time).toBe("17:00");
  });

  it("calcula spanSlots corretamente", () => {
    const ag: Agendamento = {
      ...agendamentoMock,
      hora_inicio: "08:00:00",
      hora_fim: "09:00:00",
    };
    const slots = generateTimeSlots(config, "seg", [ag], 30);
    const occupied = slots.find((s) => s.type === "occupied");
    expect(occupied?.spanSlots).toBe(2);
  });
});
