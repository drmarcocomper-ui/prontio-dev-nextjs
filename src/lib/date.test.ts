import { describe, it, expect, vi, afterEach } from "vitest";
import { todayLocal } from "./date";

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
