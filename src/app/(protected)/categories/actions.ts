"use server";

import { getCurrentUserId } from "@/lib/actions/helpers/auth";
import { revalidatePaths } from "@/lib/actions/helpers/revalidate";
import { softDeleteRelations } from "@/lib/actions/helpers/softDelete";
import {
  parseAndCleanFormData,
  validateWithSchema,
} from "@/lib/actions/helpers/validation";
import { prisma } from "@/lib/db/prisma";
import {
  createCategorySchema,
  updateCategorySchema,
  categoryFormSchema,
  type CategoryWithStats,
} from "@/services/categories/schema";
import { revalidatePath } from "next/cache";

// CREATE CATEGORY
export async function createCategory(formData: FormData) {
  try {
    const userId = await getCurrentUserId();

    const cleanedData = parseAndCleanFormData(formData, ["description"]);
    const formValidated = validateWithSchema(
      cleanedData,
      categoryFormSchema,
      "form"
    );
    const dataWithUserId = { ...formValidated, userId };
    const validated = validateWithSchema(
      dataWithUserId,
      createCategorySchema,
      "create"
    );

    const category = await prisma.category.create({ data: validated });

    revalidatePath("/categories");
    return { success: true, data: category };
  } catch (error) {
    console.error("Error creating category:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create category",
    };
  }
}

// UPDATE CATEGORY
export async function updateCategory(formData: FormData) {
  try {
    const userId = await getCurrentUserId();

    const cleanedData = parseAndCleanFormData(formData, ["description"]);
    const formValidated = validateWithSchema(
      cleanedData,
      categoryFormSchema,
      "form"
    );

    const categoryId = cleanedData.id as string;
    if (!categoryId) {
      throw new Error("Category ID is required for update");
    }

    const dataWithIdAndUser = {
      ...formValidated,
      id: categoryId,
      userId,
    };
    const validated = validateWithSchema(
      dataWithIdAndUser,
      updateCategorySchema,
      "update"
    );

    const { id, ...updateData } = validated;

    const existingCategory = await prisma.category.findFirst({
      where: { id, userId },
    });
    if (!existingCategory) {
      throw new Error("Category not found or access denied");
    }

    const category = await prisma.category.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/categories");
    return { success: true, data: category };
  } catch (error) {
    console.error("Error updating category:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update category",
    };
  }
}

// DELETE CATEGORY
export async function deleteCategory(id: string) {
  try {
    const userId = await getCurrentUserId();
    if (!id) throw new Error("Category ID is required");

    const existingCategory = await prisma.category.findFirst({
      where: { id, userId },
    });
    if (!existingCategory) {
      throw new Error("Category not found or access denied");
    }

    const now = new Date();
    await prisma.category.update({
      where: { id },
      data: { deletedAt: now },
    });

    await softDeleteRelations(userId, [id]);
    revalidatePaths(["/categories", "/budgets", "/transactions", "/savings"]);

    return { success: true };
  } catch (error) {
    console.error("Error deleting category:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete category",
    };
  }
}

// DELETE MULTIPLE CATEGORIES
export async function deleteCategories(ids: string[]) {
  try {
    const userId = await getCurrentUserId();
    if (!ids.length) throw new Error("Category IDs are required");

    const existing = await prisma.category.findMany({
      where: { id: { in: ids }, userId, deletedAt: null },
    });

    if (existing.length !== ids.length) {
      throw new Error("Some categories not found or access denied");
    }

    const now = new Date();
    await prisma.category.updateMany({
      where: { id: { in: ids }, userId },
      data: { deletedAt: now },
    });

    await softDeleteRelations(userId, ids);
    revalidatePaths(["/categories", "/budgets", "/transactions", "/savings"]);

    return { success: true };
  } catch (error) {
    console.error("Error deleting categories:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete categories",
    };
  }
}

// GET CATEGORIES WITH STATS
export async function getCategories(
  userId: string
): Promise<CategoryWithStats[]> {
  try {
    const categories = await prisma.category.findMany({
      where: { userId, deletedAt: null },
      include: {
        transactions: { select: { amount: true, date: true } },
        budgets: {
          select: { id: true, name: true, amount: true, month: true },
        },
        savings: {
          select: {
            id: true,
            accountName: true,
            balance: true,
            interestRate: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    const categoriesWithStats: CategoryWithStats[] = categories.map(
      (category) => {
        const transactions = category.transactions || [];
        const budgets = category.budgets || [];
        const savings = category.savings || [];

        // Get current month budget
        const currentBudget = budgets.find((b) => b.month === currentMonth);

        // Filter transactions for the current month only
        const monthTransactions = transactions.filter((t) =>
          t.date.toISOString().startsWith(currentMonth)
        );

        // Calculate spent amount (only for this month)
        const spent = monthTransactions.reduce(
          (sum, t) => sum + Math.abs(t.amount),
          0
        );

        const remaining =
          category.type === "EXPENSE" && currentBudget
            ? currentBudget.amount - spent
            : undefined;

        // Calculate balance (monthly scoped)
        const balance =
          category.type === "INCOME"
            ? monthTransactions.reduce((sum, t) => sum + t.amount, 0)
            : (currentBudget?.amount || 0) - spent;

        return {
          id: category.id,
          name: category.name,
          description: category.description,
          type: category.type as "EXPENSE" | "INCOME",
          icon: category.icon,
          userId: category.userId,
          transactions:
            category.type === "EXPENSE" ? monthTransactions.length : undefined,
          accounts: category.type === "INCOME" ? savings.length : undefined,
          budgetAmount: currentBudget?.amount,
          budgetName: currentBudget?.name,
          spent: category.type === "EXPENSE" ? spent : undefined,
          remaining: category.type === "EXPENSE" ? remaining : undefined,
          balance: category.type === "INCOME" ? balance : undefined,
          averageGrowth: 0,
        };
      }
    );

    return categoriesWithStats;
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw new Error("Failed to fetch categories");
  }
}

// GET CATEGORIES FOR CURRENT USER
export async function getCurrentUserCategories(): Promise<CategoryWithStats[]> {
  const userId = await getCurrentUserId();
  return getCategories(userId);
}

// VALIDATE CATEGORY
export async function getValidCategoryOrThrow({
  id,
  userId,
}: {
  id: string;
  userId: string;
}) {
  const category = await prisma.category.findFirst({
    where: {
      id,
      userId,
      deletedAt: null,
    },
  });

  if (!category) {
    throw new Error("Category not found or access denied");
  }

  return category;
}
