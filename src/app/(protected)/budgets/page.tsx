"use client";

import { BudgetTable } from "./_components/budget-table";
import data from "./_components/data.json";

export default function BudgetsPage() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <BudgetTable data={data} />
    </div>
  );
}
