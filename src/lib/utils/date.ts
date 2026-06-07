const COLOMBO_TZ = "Asia/Colombo";

export function todayInColombo(): string {
  return new Date()
    .toLocaleDateString("sv-SE", { timeZone: COLOMBO_TZ });
}
