type BudgetStatus = "good" | "warning" | "completed" | "danger";

function getStatusByPercentage(percentage: number): BudgetStatus {
  if (percentage < 90) {
    return "good";
  } else if (percentage > 95 && percentage < 100) {
    return "warning";
  } else if (percentage === 100) {
    return "completed";
  } else if (percentage > 100) {
    return "danger";
  } else {
    // Covers percentages between 90 and 95 inclusively (if not specified)
    return "good";
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "good":
      return "[&>div]:bg-emerald-500";
    case "warning":
      return "[&>div]:bg-yellow-500";
    case "danger":
      return "[&>div]:bg-red-500";
    case "completed":
      return "[&>div]:bg-blue-500";
    default:
      return "[&>div]:bg-emerald-500";
  }
}

export function getStatusColorByPercentage(percentage: number): string {
  const status = getStatusByPercentage(percentage);
  return getStatusColor(status);
}
