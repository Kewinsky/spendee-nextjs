"use server";

import { prisma } from "@/lib/db/prisma";
import {
  createBudgetSchema,
  updateBudgetSchema,
  budgetFormSchema,
  type BudgetWithStats,
} from "@/services/budgets/schema";

import { revalidatePaths } from "@/lib/actions/helpers/revalidate";
import { getValidCategoryOrThrow } from "../categories/actions";
import { getCurrentUserId } from "@/lib/actions/helpers/auth";
import {
  parseAndCleanFormData,
  validateWithSchema,
} from "@/lib/actions/helpers/validation";

// CREATE BUDGET
export async function createBudget(formData: FormData) {
  try {
    const userId = await getCurrentUserId();

    const cleanedData = parseAndCleanFormData(formData, ["description"]);
    const formValidated = validateWithSchema(
      cleanedData,
      budgetFormSchema,
      "form"
    );

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;

    const budgetData = {
      ...formValidated,
      userId,
      amount: Number.parseFloat(formValidated.amount),
      month: currentMonth,
    };

    const validated = validateWithSchema(
      budgetData,
      createBudgetSchema,
      "create"
    );

    await getValidCategoryOrThrow({
      id: validated.categoryId,
      userId,
    });

    const budget = await prisma.budget.create({
      data: validated,
      include: {
        category: {
          select: { id: true, name: true, type: true, icon: true },
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

    revalidatePaths(["/budgets", "/categories"]);

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
    const userId = await getCurrentUserId();

    const cleanedData = parseAndCleanFormData(formData, ["description"]);
    const formValidated = validateWithSchema(
      cleanedData,
      budgetFormSchema,
      "form"
    );

    const budgetId = cleanedData.id as string;
    if (!budgetId) throw new Error("Budget ID is required for update");

    const existingBudget = await prisma.budget.findFirst({
      where: { id: budgetId, userId },
    });

    if (!existingBudget) {
      throw new Error("Budget not found or access denied");
    }

    const budgetData = {
      ...formValidated,
      userId,
      id: budgetId,
      amount: Number.parseFloat(formValidated.amount),
      month: existingBudget.month,
    };

    const validated = validateWithSchema(
      budgetData,
      updateBudgetSchema,
      "update"
    );

    await getValidCategoryOrThrow({
      id: validated.categoryId,
      userId,
    });

    const { id, ...updateData } = validated;

    const budget = await prisma.budget.update({
      where: { id },
      data: updateData,
      include: {
        category: {
          select: { id: true, name: true, type: true, icon: true },
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

    revalidatePaths(["/budgets", "/categories"]);

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

// DELETE SINGLE BUDGET
export async function deleteBudget(id: string) {
  try {
    const userId = await getCurrentUserId();

    if (!id) throw new Error("Budget ID is required");

    const existing = await prisma.budget.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new Error("Budget not found or access denied");
    }

    await prisma.budget.delete({
      where: { id },
    });

    revalidatePaths(["/budgets", "/categories"]);

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
export async function deleteBudgets(ids: string[]) {
  try {
    const userId = await getCurrentUserId();

    if (!ids.length) throw new Error("Budget IDs are required");

    const existing = await prisma.budget.findMany({
      where: {
        id: { in: ids },
        userId,
      },
    });

    if (existing.length !== ids.length) {
      throw new Error("Some budgets not found or access denied");
    }

    await prisma.budget.deleteMany({
      where: {
        id: { in: ids },
        userId,
      },
    });

    revalidatePaths(["/budgets", "/categories"]);

    return { success: true };
  } catch (error) {
    console.error("Error deleting budgets:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete budgets",
    };
  }
}

// GET BUDGETS WITH STATS
export async function getBudgets(userId: string): Promise<BudgetWithStats[]> {
  try {
    const budgets = await prisma.budget.findMany({
      where: {
        userId,
        category: {
          deletedAt: null,
        },
      },
      include: {
        category: {
          select: { id: true, name: true, type: true, icon: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return await Promise.all(
      budgets.map(async (budget) => {
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
        };
      })
    );
  } catch (error) {
    console.error("Error fetching budgets:", error);
    throw new Error("Failed to fetch budgets");
  }
}

// GET CURRENT USER BUDGETS
export async function getCurrentUserBudgets(): Promise<BudgetWithStats[]> {
  const userId = await getCurrentUserId();
  return getBudgets(userId);
}
