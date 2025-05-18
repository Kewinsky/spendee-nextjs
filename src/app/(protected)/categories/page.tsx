"use client";

import { CategoryTable } from "./_components/category-table";
import data from "./_components/category-data.json";

export default function CategoriesAndBudgetsPage() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <CategoryTable data={data} />
    </div>
  );
}
