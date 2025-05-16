"use client";
import data from "./_components/data.json";
import { TransactionsTable } from "./_components/transactions-table";

export default function TransactionsPage() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <TransactionsTable data={data} />
    </div>
  );
}
