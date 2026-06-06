const formatterCache = new Map<string, Intl.NumberFormat>();

function getFormatter(currency: string): Intl.NumberFormat {
  let f = formatterCache.get(currency);
  if (!f) {
    f = new Intl.NumberFormat(currency === "LKR" ? "si-LK" : "en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: currency === "LKR" ? 0 : 2,
      maximumFractionDigits: currency === "LKR" ? 0 : 2,
    });
    formatterCache.set(currency, f);
  }
  return f;
}

export function formatPrice(amount: number, currency?: string | null): string {
  return getFormatter(currency ?? "LKR").format(amount);
}

// Legacy alias — kept for any callers that haven't migrated yet
export function formatLKR(amount: number): string {
  return formatPrice(amount, "LKR");
}
