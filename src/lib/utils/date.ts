const COLOMBO_TZ = "Asia/Colombo";

export function todayInColombo(): string {
  return new Date()
    .toLocaleDateString("sv-SE", { timeZone: COLOMBO_TZ });
}

export function isFutureOrToday(dateStr: string): boolean {
  const today = todayInColombo();
  return dateStr >= today;
}

export function formatDisplayDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-LK", {
    timeZone: COLOMBO_TZ,
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
