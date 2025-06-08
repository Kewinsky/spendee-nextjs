"use server";

import { prisma } from "@/lib/db/prisma";
import {
  createSavingsSchema,
  updateSavingsSchema,
  addSavingsFormSchema,
  editSavingsFormSchema,
  type SavingsWithStats,
} from "@/services/savings/schema";

import { revalidatePaths } from "@/lib/actions/helpers/revalidate";
import { getValidCategoryOrThrow } from "../categories/actions";
import { getCurrentUserId } from "@/lib/actions/helpers/auth";
import {
  parseAndCleanFormData,
  validateWithSchema,
} from "@/lib/actions/helpers/validation";

// CREATE SAVINGS
export async function createSavings(formData: FormData) {
  try {
    const userId = await getCurrentUserId();

    const cleanedData = parseAndCleanFormData(formData, ["institution"]);

    const formValidated = validateWithSchema(
      cleanedData,
      addSavingsFormSchema,
      "form"
    );

    // Ensure we have valid numbers
    const initialBalance = Number.parseFloat(formValidated.initialBalance);
    const interestRate = Number.parseFloat(formValidated.interestRate);

    if (isNaN(initialBalance) || isNaN(interestRate)) {
      throw new Error("Invalid number values provided");
    }

    const savingsData = {
      accountName: formValidated.accountName,
      categoryId: formValidated.categoryId,
      userId,
      balance: initialBalance, // Set balance equal to initialBalance on creation
      initialBalance,
      interestRate,
      accountType: formValidated.accountType,
      institution: formValidated.institution,
    };

    const validated = validateWithSchema(
      savingsData,
      createSavingsSchema,
      "create"
    );

    await getValidCategoryOrThrow({
      id: validated.categoryId,
      userId,
    });

    const savings = await prisma.savings.create({
      data: validated,
      include: {
        category: {
          select: { id: true, name: true, type: true, icon: true },
        },
      },
    });

    revalidatePaths(["/savings", "/categories"]);

    return { success: true, data: savings };
  } catch (error) {
    console.error("Error creating savings:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create savings",
    };
  }
}

// UPDATE SAVINGS
export async function updateSavings(formData: FormData) {
  try {
    const userId = await getCurrentUserId();

    const cleanedData = parseAndCleanFormData(formData, ["institution"]);

    const formValidated = validateWithSchema(
      cleanedData,
      editSavingsFormSchema,
      "form"
    );

    const savingsId = cleanedData.id as string;
    if (!savingsId) {
      throw new Error("Savings ID is required for update");
    }

    // Ensure we have valid numbers
    const balance = Number.parseFloat(formValidated.balance);
    const interestRate = Number.parseFloat(formValidated.interestRate);

    if (isNaN(balance) || isNaN(interestRate)) {
      throw new Error("Invalid number values provided");
    }

    const savingsData = {
      accountName: formValidated.accountName,
      categoryId: formValidated.categoryId,
      userId,
      id: savingsId,
      balance,
      interestRate,
      accountType: formValidated.accountType,
      institution: formValidated.institution,
    };

    const validated = validateWithSchema(
      savingsData,
      updateSavingsSchema,
      "update"
    );

    const { id, ...updateData } = validated;

    const existing = await prisma.savings.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new Error("Savings not found or access denied");
    }

    await getValidCategoryOrThrow({
      id: validated.categoryId,
      userId,
    });

    // Note: initialBalance is not included in updateData, so it remains unchanged
    const savings = await prisma.savings.update({
      where: { id },
      data: updateData,
      include: {
        category: {
          select: { id: true, name: true, type: true, icon: true },
        },
      },
    });

    revalidatePaths(["/savings", "/categories"]);

    return { success: true, data: savings };
  } catch (error) {
    console.error("Error updating savings:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update savings",
    };
  }
}

// DELETE SINGLE SAVINGS
export async function deleteSaving(id: string) {
  try {
    const userId = await getCurrentUserId();

    if (!id) throw new Error("Savings ID is required");

    const existing = await prisma.savings.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new Error("Savings not found or access denied");
    }

    await prisma.savings.delete({
      where: { id },
    });

    revalidatePaths(["/savings", "/categories"]);

    return { success: true };
  } catch (error) {
    console.error("Error deleting savings:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete savings",
    };
  }
}

// DELETE MULTIPLE SAVINGS
export async function deleteSavings(ids: string[]) {
  try {
    const userId = await getCurrentUserId();

    if (!ids.length) {
      throw new Error("Savings IDs are required");
    }

    const existing = await prisma.savings.findMany({
      where: {
        id: { in: ids },
        userId,
      },
    });

    if (existing.length !== ids.length) {
      throw new Error("Some savings not found or access denied");
    }

    await prisma.savings.deleteMany({
      where: {
        id: { in: ids },
        userId,
      },
    });

    revalidatePaths(["/savings", "/categories"]);

    return { success: true };
  } catch (error) {
    console.error("Error deleting savings:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete savings",
    };
  }
}

// GET SAVINGS WITH STATS
export async function getSavings(userId: string): Promise<SavingsWithStats[]> {
  try {
    const savings = await prisma.savings.findMany({
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
      orderBy: { accountName: "asc" },
    });

    return savings.map((s) => {
      const growth =
        s.initialBalance > 0
          ? ((s.balance - s.initialBalance) / s.initialBalance) * 100
          : 0;

      return {
        ...s,
        growth,
      };
    });
  } catch (error) {
    console.error("Error fetching savings:", error);
    throw new Error("Failed to fetch savings");
  }
}

// GET SAVINGS FOR CURRENT USER
export async function getCurrentUserSavings(): Promise<SavingsWithStats[]> {
  const userId = await getCurrentUserId();
  return getSavings(userId);
}

// CALCULATE BALANCE WITH TRANSACTIONS
export async function calculateBalanceWithTransactions(
  savingsId: string,
  userId: string
): Promise<number> {
  try {
    const savings = await prisma.savings.findFirst({
      where: { id: savingsId, userId },
    });

    if (!savings) {
      throw new Error("Savings account not found");
    }

    // Get sum of all income transactions for this savings account's category
    const incomeTransactions = await prisma.transaction.aggregate({
      where: {
        userId,
        categoryId: savings.categoryId,
        type: "INCOME",
        deletedAt: null,
      },
      _sum: {
        amount: true,
      },
    });

    const totalIncome = incomeTransactions._sum.amount || 0;
    return savings.initialBalance + totalIncome;
  } catch (error) {
    console.error("Error calculating balance with transactions:", error);
    throw new Error("Failed to calculate balance");
  }
}

// UPDATE BALANCE WITH TRANSACTIONS
export async function updateBalanceWithTransactions(savingsId: string) {
  try {
    const userId = await getCurrentUserId();

    const calculatedBalance = await calculateBalanceWithTransactions(
      savingsId,
      userId
    );

    await prisma.savings.update({
      where: { id: savingsId },
      data: { balance: calculatedBalance },
    });

    revalidatePaths(["/savings"]);

    return { success: true, balance: calculatedBalance };
  } catch (error) {
    console.error("Error updating balance with transactions:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update balance with transactions",
    };
  }
}
