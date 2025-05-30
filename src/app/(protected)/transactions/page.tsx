import { getCurrentUserCategories } from "../categories/actions";
import { getCurrentUserTransactions } from "./actions";
import { TransactionsTable } from "./components/transactionsTable";

export default async function TransactionsPage() {
  const transactions = await getCurrentUserTransactions();
  const categories = await getCurrentUserCategories();

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <TransactionsTable data={transactions} categories={categories} />
    </div>
  );
}
