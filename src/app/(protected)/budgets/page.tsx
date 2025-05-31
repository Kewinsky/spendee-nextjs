import { getCurrentUserBudgets } from "./actions";
import { getCurrentUserCategories } from "../categories/actions";
import { BudgetTable } from "./components/budgetTable";

export default async function BudgetsPage() {
  const budgets = await getCurrentUserBudgets();
  const categories = await getCurrentUserCategories();

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;

  const usedCategoryIds = budgets
    .filter((b) => b.month === currentMonth)
    .map((b) => b.categoryId);

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <BudgetTable
        data={budgets}
        categories={categories}
        usedCategoryIds={usedCategoryIds}
      />
    </div>
  );
}
