import { describe, it, expect, vi, afterEach } from "vitest";
import { todayLocal, parseLocalDate, toDateString } from "./date";

describe("todayLocal", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("retorna a data local no formato YYYY-MM-DD", () => {
    const result = todayLocal();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("usa a data local, não UTC", () => {
    // Simulate Jan 1 at 00:30 local (which could be Dec 31 in UTC for UTC+ timezones)
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 15, 10, 30, 0));
    expect(todayLocal()).toBe("2025-01-15");
  });

  it("preenche mês e dia com zero à esquerda", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 5, 12, 0, 0));
    expect(todayLocal()).toBe("2025-01-05");
  });
});

describe("parseLocalDate", () => {
  it("parseia data YYYY-MM-DD para Date local", () => {
    const date = parseLocalDate("2025-03-15");
    expect(date.getFullYear()).toBe(2025);
    expect(date.getMonth()).toBe(2); // 0-indexed
    expect(date.getDate()).toBe(15);
  });

  it("usa meio-dia para evitar problemas de DST", () => {
    const date = parseLocalDate("2025-01-01");
    expect(date.getHours()).toBe(12);
  });

  it("parseia corretamente meses e dias com zero à esquerda", () => {
    const date = parseLocalDate("2025-01-05");
    expect(date.getMonth()).toBe(0);
    expect(date.getDate()).toBe(5);
  });
});

describe("toDateString", () => {
  it("converte Date para string YYYY-MM-DD", () => {
    const date = new Date(2025, 2, 15, 12);
    expect(toDateString(date)).toBe("2025-03-15");
  });

  it("preenche mês e dia com zero à esquerda", () => {
    const date = new Date(2025, 0, 5, 12);
    expect(toDateString(date)).toBe("2025-01-05");
  });

  it("é inversa de parseLocalDate", () => {
    const original = "2025-06-20";
    expect(toDateString(parseLocalDate(original))).toBe(original);
  });
});
