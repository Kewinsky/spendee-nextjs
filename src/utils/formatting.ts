/**
 * Format currency values
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

/**
 * Format percentage values
 */
export function formatPercentage(
  value: number | undefined | null,
  decimals = 2
): string {
  if (value === undefined || value === null || isNaN(value)) {
    return "0.00%";
  }
  return `${value.toFixed(decimals)}%`;
}

/**
 * Calculate spent amount from transactions
 */
export function calculateSpent(transactions: { amount: number }[]): number {
  return transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
}

/**
 * Calculate average from array of numbers
 */
export function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/**
 * Get status color based on percentage
 */
export function getStatusColorByPercentage(percentage: number): string {
  if (percentage >= 90) return "bg-red-500";
  if (percentage >= 75) return "bg-yellow-500";
  if (percentage >= 50) return "bg-blue-500";
  return "bg-green-500";
}

/**
 * Get current month in YYYY-MM format
 */
export function getCurrentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}
