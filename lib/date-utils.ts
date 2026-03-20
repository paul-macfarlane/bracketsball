/**
 * Check if a date falls at midnight Eastern Time, which ESPN uses
 * to indicate the game time hasn't been determined yet.
 */
function isMidnightET(date: Date): boolean {
  const etParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(date);

  const hour = Number(etParts.find((p) => p.type === "hour")?.value ?? -1);
  const minute = Number(etParts.find((p) => p.type === "minute")?.value ?? -1);

  // Intl returns hour 24 for midnight in hour12:false — normalize
  return (hour === 0 || hour === 24) && minute === 0;
}

/**
 * Format a game start time for display. Returns e.g. "Mar 19 · 7:10 PM",
 * or "Mar 19 · TBD" when ESPN has the time set to midnight ET (meaning
 * the actual time hasn't been determined yet).
 *
 * Pass `includeWeekday: true` for a longer format: "Fri, Mar 19 · 7:10 PM".
 */
export function formatGameDateTime(
  startTime: Date | string,
  opts?: { includeWeekday?: boolean },
): string {
  const d = typeof startTime === "string" ? new Date(startTime) : startTime;
  const dateOptions: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
  };
  if (opts?.includeWeekday) {
    dateOptions.weekday = "short";
  }
  const datePart = d.toLocaleDateString("en-US", dateOptions);
  if (isMidnightET(d)) {
    return `${datePart} · TBD`;
  }
  const timePart = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${datePart} · ${timePart}`;
}
