"use client";

import data from "./_components/data.json";
import { SavingsTable } from "./_components/savings-table";

export default function SavingsPage() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <SavingsTable data={data} />
    </div>
  );
}
