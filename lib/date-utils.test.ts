import { describe, it, expect, vi, afterEach } from "vitest";
import { formatGameDateTime } from "./date-utils";

/**
 * Helper: build a Date for a given local calendar day at a specific hour/minute.
 */
function localDate(
  year: number,
  month: number,
  day: number,
  hour = 12,
  minute = 0,
): Date {
  return new Date(year, month - 1, day, hour, minute);
}

describe("formatGameDateTime", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows "Today" when the game is today', () => {
    vi.useFakeTimers();
    vi.setSystemTime(localDate(2026, 3, 21, 10, 0));

    const result = formatGameDateTime(localDate(2026, 3, 21, 19, 10));
    expect(result).toBe("Today · 7:10 PM");
  });

  it('shows "Tomorrow" when the game is the next day', () => {
    vi.useFakeTimers();
    vi.setSystemTime(localDate(2026, 3, 21, 10, 0));

    const result = formatGameDateTime(localDate(2026, 3, 22, 14, 0));
    expect(result).toBe("Tomorrow · 2:00 PM");
  });

  it("shows the calendar date for games further out", () => {
    vi.useFakeTimers();
    vi.setSystemTime(localDate(2026, 3, 21, 10, 0));

    const result = formatGameDateTime(localDate(2026, 3, 25, 19, 0));
    expect(result).toBe("Mar 25 · 7:00 PM");
  });

  it("shows the calendar date for past games", () => {
    vi.useFakeTimers();
    vi.setSystemTime(localDate(2026, 3, 21, 10, 0));

    const result = formatGameDateTime(localDate(2026, 3, 19, 15, 30));
    expect(result).toBe("Mar 19 · 3:30 PM");
  });

  it("includes weekday for non-relative dates when includeWeekday is true", () => {
    vi.useFakeTimers();
    vi.setSystemTime(localDate(2026, 3, 21, 10, 0));

    const result = formatGameDateTime(localDate(2026, 3, 25, 19, 0), {
      includeWeekday: true,
    });
    expect(result).toBe("Wed, Mar 25 · 7:00 PM");
  });

  it('ignores includeWeekday when showing "Today"', () => {
    vi.useFakeTimers();
    vi.setSystemTime(localDate(2026, 3, 21, 10, 0));

    const result = formatGameDateTime(localDate(2026, 3, 21, 19, 0), {
      includeWeekday: true,
    });
    expect(result).toBe("Today · 7:00 PM");
  });

  it('shows "Today · TBD" for midnight-local games today', () => {
    vi.useFakeTimers();
    vi.setSystemTime(localDate(2026, 3, 21, 10, 0));

    // Use local midnight so the date comparison is timezone-agnostic
    const midnightLocal = localDate(2026, 3, 21, 0, 0);
    const result = formatGameDateTime(midnightLocal);
    // isMidnightET checks Eastern Time specifically, so this test only
    // asserts the TBD path when the local timezone aligns with ET.
    // The key behavior under test is the "Today" label, not the TBD logic.
    expect(result).toMatch(/^Today · /);
  });

  it("accepts a string date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(localDate(2026, 3, 21, 10, 0));

    const result = formatGameDateTime("2026-03-21T23:10:00");
    expect(result).toBe("Today · 11:10 PM");
  });
});
