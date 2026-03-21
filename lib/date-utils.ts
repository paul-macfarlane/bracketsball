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
 * Return "Today", "Tomorrow", or a formatted date string (e.g. "Mar 19" or
 * "Fri, Mar 19") depending on whether the game date matches the local
 * calendar day.
 */
function getRelativeDatePart(
  d: Date,
  opts?: { includeWeekday?: boolean },
): string {
  const now = new Date();

  const toDateKey = (dt: Date) =>
    `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}`;

  const gameKey = toDateKey(d);
  const todayKey = toDateKey(now);

  if (gameKey === todayKey) return "Today";

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (gameKey === toDateKey(tomorrow)) return "Tomorrow";

  const dateOptions: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
  };
  if (opts?.includeWeekday) {
    dateOptions.weekday = "short";
  }
  return d.toLocaleDateString("en-US", dateOptions);
}

/**
 * Format a game start time for display. Returns e.g. "Today · 7:10 PM",
 * "Tomorrow · TBD", or "Mar 19 · 7:10 PM".
 *
 * Games today or tomorrow use relative labels instead of the calendar date.
 * Pass `includeWeekday: true` to include the weekday for non-relative dates.
 */
export function formatGameDateTime(
  startTime: Date | string,
  opts?: { includeWeekday?: boolean },
): string {
  const d = typeof startTime === "string" ? new Date(startTime) : startTime;
  const datePart = getRelativeDatePart(d, opts);
  if (isMidnightET(d)) {
    return `${datePart} · TBD`;
  }
  const timePart = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${datePart} · ${timePart}`;
}
