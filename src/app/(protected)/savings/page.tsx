import { getCurrentUserSavings } from "./actions";
import { getCurrentUserCategories } from "../categories/actions";
import { SavingsTable } from "./components/savingsTable";

export default async function SavingsPage() {
  const savings = await getCurrentUserSavings();
  const categories = await getCurrentUserCategories();

  const usedCategoryIds = savings.map((s) => s.categoryId);

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
