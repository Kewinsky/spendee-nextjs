"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import {
  createBudgetSchema,
  updateBudgetSchema,
  budgetFormSchema,
  type BudgetWithStats,
} from "@/services/budgets/schema";
import { revalidatePath } from "next/cache";

// Helper function to get current user
async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

// CREATE BUDGET
export async function createBudget(formData: FormData) {
  try {
    const userId = await getCurrentUser();

    // Parse FormData
    const raw = Object.fromEntries(formData.entries());

    // Convert empty strings to undefined for optional fields
    const cleanedData = {
      ...raw,
      description: raw.description === "" ? null : raw.description,
    };

    // Validate with form schema first
    const formValidation = budgetFormSchema.safeParse(cleanedData);
    if (!formValidation.success) {
      throw new Error(`Validation failed: ${formValidation.error.message}`);
    }

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;

    // Convert form data to create schema format
    const dataWithUserId = {
      ...formValidation.data,
      userId,
      amount: Number.parseFloat(formValidation.data.amount),
      month: currentMonth,
    };

    const validation = createBudgetSchema.safeParse(dataWithUserId);
    if (!validation.success) {
      throw new Error(`Validation failed: ${validation.error.message}`);
    }

    const budget = await prisma.budget.create({
      data: validation.data,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            type: true,
            icon: true,
          },
        },
      },
    });

    revalidatePath("/budgets");
    revalidatePath("/categories");
    return { success: true, data: budget };
  } catch (error) {
    console.error("Error creating budget:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create budget",
    };
  }
}

// UPDATE BUDGET
export async function updateBudget(formData: FormData) {
  try {
    const userId = await getCurrentUser();

    // Parse FormData
    const raw = Object.fromEntries(formData.entries());

    // Convert empty strings to undefined for optional fields
    const cleanedData = {
      ...raw,
      description: raw.description === "" ? null : raw.description,
    };

    // Validate with form schema first
    const formValidation = budgetFormSchema.safeParse(cleanedData);
    if (!formValidation.success) {
      throw new Error(`Validation failed: ${formValidation.error.message}`);
    }

    // Get ID from FormData
    const budgetId = raw.id as string;
    if (!budgetId) {
      throw new Error("Budget ID is required for update");
    }

    // Verify ownership and get existing data
    const existingBudget = await prisma.budget.findFirst({
      where: { id: budgetId, userId },
    });

    if (!existingBudget) {
      throw new Error("Budget not found or access denied");
    }

    // Build update data including original month
    const dataWithUserIdAndId = {
      ...formValidation.data,
      userId,
      id: budgetId,
      amount: Number.parseFloat(formValidation.data.amount),
      month: existingBudget.month,
    };

    // Validate full update input
    const validation = updateBudgetSchema.safeParse(dataWithUserIdAndId);
    if (!validation.success) {
      throw new Error(`Validation failed: ${validation.error.message}`);
    }

    const { id, ...updateData } = validation.data;

    const budget = await prisma.budget.update({
      where: { id },
      data: updateData,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            type: true,
            icon: true,
          },
        },
      },
    });

    const startOfMonth = new Date(`${budget.month}-01`);
    const startOfNextMonth = new Date(startOfMonth);
    startOfNextMonth.setMonth(startOfMonth.getMonth() + 1);

    const transactions = await prisma.transaction.findMany({
      where: {
        categoryId: budget.categoryId,
        userId,
        date: {
          gte: startOfMonth,
          lt: startOfNextMonth,
        },
      },
    });

    const spent = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const remaining = budget.amount - spent;
    const progress = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

    revalidatePath("/budgets");
    revalidatePath("/categories");

    return {
      success: true,
      data: {
        ...budget,
        spent,
        remaining,
        progress,
      },
    };
  } catch (error) {
    console.error("Error updating budget:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update budget",
    };
  }
}

// DELETE BUDGET
export async function deleteBudget(id: string) {
  try {
    const userId = await getCurrentUser();

    if (!id) {
      throw new Error("Budget ID is required");
    }

    // Verify ownership before deletion
    const existingBudget = await prisma.budget.findFirst({
      where: { id, userId },
    });

    if (!existingBudget) {
      throw new Error("Budget not found or access denied");
    }

    await prisma.budget.delete({
      where: { id },
    });

    revalidatePath("/budgets");
    revalidatePath("/categories");
    return { success: true };
  } catch (error) {
    console.error("Error deleting budget:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete budget",
    };
  }
}

// DELETE MULTIPLE BUDGETS
export async function deleteBudgets(id: string) {
  try {
    const userId = await getCurrentUser();

    if (!id) {
      throw new Error("Budget ID is required");
    }

    // Verify ownership before deletion
    const existingBudget = await prisma.budget.findFirst({
      where: { id, userId },
    });

    if (!existingBudget) {
      throw new Error("Budget not found or access denied");
    }

    await prisma.budget.delete({
      where: { id },
    });

    revalidatePath("/budgets");
    revalidatePath("/categories");

    return { success: true };
  } catch (error) {
    console.error("Error deleting budget:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete budget",
    };
  }
}

// GET BUDGETS WITH STATS
export async function getBudgets(userId: string): Promise<BudgetWithStats[]> {
  try {
    const budgets = await prisma.budget.findMany({
      where: { userId },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            type: true,
            icon: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate stats for each budget
    const budgetsWithStats: BudgetWithStats[] = await Promise.all(
      budgets.map(async (budget) => {
        const startOfMonth = new Date(`${budget.month}-01`);
        const startOfNextMonth = new Date(startOfMonth);
        startOfNextMonth.setMonth(startOfMonth.getMonth() + 1);

        // Calculate spent amount from transactions for this category and month
        const transactions = await prisma.transaction.findMany({
          where: {
            categoryId: budget.categoryId,
            userId,
            date: {
              gte: startOfMonth,
              lt: startOfNextMonth,
            },
          },
        });

        const spent = transactions.reduce(
          (sum, t) => sum + Math.abs(t.amount),
          0
        );
        const remaining = budget.amount - spent;
        const progress = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

        return {
          ...budget,
          spent,
          remaining,
          progress,
        } as BudgetWithStats;
      })
    );

    return budgetsWithStats;
  } catch (error) {
    console.error("Error fetching budgets:", error);
    throw new Error("Failed to fetch budgets");
  }
}

// GET BUDGETS FOR CURRENT USER
export async function getCurrentUserBudgets(): Promise<BudgetWithStats[]> {
  const userId = await getCurrentUser();
  return getBudgets(userId);
}
