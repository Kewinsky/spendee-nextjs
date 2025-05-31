import { getCurrentUserSavings } from "./actions";
import { getCurrentUserCategories } from "../categories/actions";
import { SavingsTable } from "./components/savingsTable";

export default async function SavingsPage() {
  const savings = await getCurrentUserSavings();
  const categories = await getCurrentUserCategories();

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;

  const usedCategoryIds = savings
    .filter((b) => b.month === currentMonth)
    .map((b) => b.categoryId);

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <SavingsTable
        data={savings}
        categories={categories}
        usedCategoryIds={usedCategoryIds}
      />
    </div>
  );
}
