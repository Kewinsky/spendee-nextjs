"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import {
  createCategorySchema,
  updateCategorySchema,
  categoryFormSchema,
  type CategoryWithStats,
} from "@/services/categories/schema";
import { revalidatePath } from "next/cache";

// Helper function to get current user
async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

// CREATE CATEGORY
export async function createCategory(formData: FormData) {
  try {
    const userId = await getCurrentUser();

    // Parse FormData
    const raw = Object.fromEntries(formData.entries());

    // Convert empty strings to undefined for optional fields
    const cleanedData = {
      ...raw,
      description: raw.description === "" ? undefined : raw.description,
    };

    // Validate with form schema first
    const formValidation = categoryFormSchema.safeParse(cleanedData);
    if (!formValidation.success) {
      throw new Error(`Validation failed: ${formValidation.error.message}`);
    }

    // Add userId and validate with create schema
    const dataWithUserId = {
      ...formValidation.data,
      userId,
    };

    const validation = createCategorySchema.safeParse(dataWithUserId);
    if (!validation.success) {
      throw new Error(`Validation failed: ${validation.error.message}`);
    }

    const category = await prisma.category.create({
      data: validation.data,
    });

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
    const userId = await getCurrentUser();

    // Parse FormData
    const raw = Object.fromEntries(formData.entries());

    // Convert empty strings to undefined for optional fields
    const cleanedData = {
      ...raw,
      description: raw.description === "" ? undefined : raw.description,
    };

    // Validate with form schema first
    const formValidation = categoryFormSchema.safeParse(cleanedData);
    if (!formValidation.success) {
      throw new Error(`Validation failed: ${formValidation.error.message}`);
    }

    // Get ID from FormData
    const categoryId = raw.id as string;
    if (!categoryId) {
      throw new Error("Category ID is required for update");
    }

    // Add userId and id, then validate with update schema
    const dataWithUserIdAndId = {
      ...formValidation.data,
      userId,
      id: categoryId,
    };

    const validation = updateCategorySchema.safeParse(dataWithUserIdAndId);
    if (!validation.success) {
      throw new Error(`Validation failed: ${validation.error.message}`);
    }

    const { id, ...updateData } = validation.data;

    // Verify ownership
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
    const userId = await getCurrentUser();

    if (!id) {
      throw new Error("Category ID is required");
    }

    // Verify ownership before deletion
    const existingCategory = await prisma.category.findFirst({
      where: { id, userId },
    });

    if (!existingCategory) {
      throw new Error("Category not found or access denied");
    }

    await prisma.category.delete({
      where: { id },
    });

    revalidatePath("/categories");
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
    const userId = await getCurrentUser();

    if (!ids.length) {
      throw new Error("Category IDs are required");
    }

    // Verify ownership of all categories
    const existingCategories = await prisma.category.findMany({
      where: {
        id: { in: ids },
        userId,
      },
    });

    if (existingCategories.length !== ids.length) {
      throw new Error("Some categories not found or access denied");
    }

    await prisma.category.deleteMany({
      where: {
        id: { in: ids },
        userId,
      },
    });

    revalidatePath("/categories");
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
      where: { userId },
      include: {
        transactions: {
          select: {
            amount: true,
            date: true,
          },
        },
        budgets: {
          select: {
            id: true,
            name: true,
            amount: true,
            month: true,
          },
        },
        savings: {
          select: {
            id: true,
            accountName: true,
            balance: true,
            interestRate: true,
            growth: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // Calculate stats for each category
    const categoriesWithStats: CategoryWithStats[] = categories.map(
      (category) => {
        const transactions = category.transactions || [];
        const budgets = category.budgets || [];
        const savings = category.savings || [];

        // Get current month budget
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
        const currentBudget = budgets.find((b) => b.month === currentMonth);

        // Calculate spent amount (sum of expense transactions or income transactions)
        const spent = transactions.reduce(
          (sum, t) => sum + Math.abs(t.amount),
          0
        );

        // Calculate balance (for income categories, this would be total earned)
        const balance =
          category.type === "INCOME"
            ? transactions.reduce((sum, t) => sum + t.amount, 0)
            : (currentBudget?.amount || 0) - spent;

        const averageGrowth =
          savings.length > 0
            ? savings.reduce((sum, s) => sum + s.growth, 0) / savings.length
            : 0;

        return {
          id: category.id,
          name: category.name,
          description: category.description,
          type: category.type as "EXPENSE" | "INCOME",
          icon: category.icon,
          userId: category.userId,
          transactions:
            category.type === "EXPENSE" ? transactions.length : undefined,
          accounts: category.type === "INCOME" ? savings.length : undefined,
          budgetAmount: currentBudget?.amount,
          budgetName: currentBudget?.name,
          spent: category.type === "EXPENSE" ? spent : undefined,
          balance: category.type === "INCOME" ? balance : undefined,
          averageGrowth,
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
  const userId = await getCurrentUser();
  return getCategories(userId);
}

// GET CATEGORIES FOR TRANSACTION FORM
// TODO: check using this fn instead
export async function getCategoriesForForm() {
  try {
    const userId = await getCurrentUser();

    const categories = await prisma.category.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        type: true,
        icon: true,
      },
      orderBy: { name: "asc" },
    });

    return { success: true, data: categories };
  } catch (error) {
    console.error("Error fetching categories:", error);
    return {
      success: false,
      error: "Failed to fetch categories",
      data: [],
    };
  }
}
