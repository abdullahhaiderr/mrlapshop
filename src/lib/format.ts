export function formatPKR(amount: number): string {
  if (!Number.isFinite(amount) || !Number.isInteger(amount) || amount < 0) {
    throw new RangeError("PKR amounts must be non-negative integers.");
  }

  return `Rs. ${new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 }).format(amount)}`;
}
