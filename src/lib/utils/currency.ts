const formatter = new Intl.NumberFormat("si-LK", {
  style: "currency",
  currency: "LKR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatLKR(amount: number): string {
  return formatter.format(amount);
}
