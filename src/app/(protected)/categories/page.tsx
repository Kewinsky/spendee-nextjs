"use client";

import { CategoriesAndBudgetsTable } from "./_components/categories-table";
import data from "./_components/data.json";

export default function CategoriesAndBudgetsPage() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <CategoriesAndBudgetsTable data={data} />
    </div>
  );
}
