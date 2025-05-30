import { getCurrentUserCategories } from "./actions";
import { CategoryTable } from "./components/categoryTable";

export default async function CategoriesPage() {
  const categories = await getCurrentUserCategories();

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <CategoryTable data={categories} />
    </div>
  );
}
