"use server";

import { prisma } from "@/lib/db/prisma";
import {
  createTransactionSchema,
  updateTransactionSchema,
  transactionFormSchema,
  type TransactionWithStats,
} from "@/services/transactions/schema";

import { revalidatePaths } from "@/lib/actions/helpers/revalidate";
import { getValidCategoryOrThrow } from "../categories/actions";
import { getCurrentUserId } from "@/lib/actions/helpers/auth";
import {
  parseAndCleanFormData,
  validateWithSchema,
} from "@/lib/actions/helpers/validation";

// CREATE TRANSACTION
export async function createTransaction(formData: FormData) {
  try {
    const userId = await getCurrentUserId();

    const cleaned = parseAndCleanFormData(formData, ["notes"]);
    const formValidated = validateWithSchema(
      cleaned,
      transactionFormSchema,
      "form"
    );

    const transactionData = {
      description: formValidated.description,
      amount: parseFloat(formValidated.amount),
      date: new Date(formValidated.date),
      categoryId: formValidated.categoryId,
      type: formValidated.type === "Income" ? "INCOME" : "EXPENSE",
      notes: formValidated.notes,
      userId,
    };

    const validated = validateWithSchema(
      transactionData,
      createTransactionSchema,
      "create"
    );

    const category = await prisma.category.findFirst({
      where: {
        id: validated.categoryId,
        userId,
      },
    });

    if (!category) {
      throw new Error("Category not found or access denied");
    }

    const expectedType = category.type === "EXPENSE" ? "EXPENSE" : "INCOME";
    if (validated.type !== expectedType) {
      throw new Error(
        `Transaction type must match category type (${expectedType})`
      );
    }

    await getValidCategoryOrThrow({
      id: validated.categoryId,
      userId,
    });

    const transaction = await prisma.transaction.create({
      data: validated,
      include: {
        category: {
          select: { id: true, name: true, type: true, icon: true },
        },
      },
    });

    revalidatePaths(["/transactions", "/categories"]);

    return {
      success: true,
      data: {
        ...transaction,
        date: transaction.date.toISOString().split("T")[0],
      },
    };
  } catch (error) {
    console.error("Error creating transaction:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create transaction",
    };
  }
}

// CREATE MULTIPLE TRANSACTIONS
export async function createTransactions(transactions: FormData[]) {
  try {
    await getCurrentUserId();
    const results = [];

    for (const formData of transactions) {
      try {
        const result = await createTransaction(formData);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to create transaction",
        });
      }
    }

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    revalidatePaths(["/transactions", "/categories"]);

    return {
      success: true,
      data: {
        total: transactions.length,
        successful,
        failed,
        results,
      },
    };
  } catch (error) {
    console.error("Error creating transactions:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create transactions",
    };
  }
}

// UPDATE TRANSACTION
export async function updateTransaction(formData: FormData) {
  try {
    const userId = await getCurrentUserId();

    const cleaned = parseAndCleanFormData(formData, ["notes"]);
    const formValidated = validateWithSchema(
      cleaned,
      transactionFormSchema,
      "form"
    );

    const transactionId = cleaned.id as string;
    if (!transactionId)
      throw new Error("Transaction ID is required for update");

    const transactionData = {
      ...formValidated,
      id: transactionId,
      amount: parseFloat(formValidated.amount),
      date: new Date(formValidated.date),
      type: formValidated.type === "Income" ? "INCOME" : "EXPENSE",
      userId,
    };

    const validated = validateWithSchema(
      transactionData,
      updateTransactionSchema,
      "update"
    );

    const { id, ...updateData } = validated;

    const existing = await prisma.transaction.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new Error("Transaction not found or access denied");
    }

    const category = await prisma.category.findFirst({
      where: {
        id: updateData.categoryId,
        userId,
      },
    });

    if (!category) {
      throw new Error("Category not found or access denied");
    }

    const expectedType = category.type === "EXPENSE" ? "EXPENSE" : "INCOME";
    if (updateData.type !== expectedType) {
      throw new Error(
        `Transaction type must match category type (${expectedType})`
      );
    }

    await getValidCategoryOrThrow({
      id: updateData.categoryId,
      userId,
    });

    const transaction = await prisma.transaction.update({
      where: { id },
      data: updateData,
      include: {
        category: {
          select: { id: true, name: true, type: true, icon: true },
        },
      },
    });

    revalidatePaths(["/transactions", "/categories"]);

    return {
      success: true,
      data: {
        ...transaction,
        date: transaction.date.toISOString().split("T")[0],
      },
    };
  } catch (error) {
    console.error("Error updating transaction:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update transaction",
    };
  }
}

// DELETE SINGLE TRANSACTION
export async function deleteTransaction(id: string) {
  try {
    const userId = await getCurrentUserId();

    if (!id) throw new Error("Transaction ID is required");

    const existing = await prisma.transaction.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new Error("Transaction not found or access denied");
    }

    await prisma.transaction.delete({
      where: { id },
    });

    revalidatePaths(["/transactions", "/categories"]);

    return { success: true };
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete transaction",
    };
  }
}

// DELETE MULTIPLE TRANSACTIONS (actual bulk)
export async function deleteTransactions(ids: string[]) {
  try {
    const userId = await getCurrentUserId();

    if (!ids.length) throw new Error("Transaction IDs are required");

    const existing = await prisma.transaction.findMany({
      where: { id: { in: ids }, userId },
    });

    if (existing.length !== ids.length) {
      throw new Error("Some transactions not found or access denied");
    }

    await prisma.transaction.deleteMany({
      where: { id: { in: ids }, userId },
    });

    revalidatePaths(["/transactions", "/categories"]);

    return { success: true };
  } catch (error) {
    console.error("Error deleting transactions:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete transactions",
    };
  }
}

// GET TRANSACTIONS WITH STATS
export async function getTransactions(
  userId: string
): Promise<TransactionWithStats[]> {
  try {
    const transactions = await prisma.transaction.findMany({
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
      orderBy: { date: "desc" },
    });

    return transactions.map((t) => ({
      ...t,
      date: t.date.toISOString().split("T")[0],
    })) as TransactionWithStats[];
  } catch (error) {
    console.error("Error fetching transactions:", error);
    throw new Error("Failed to fetch transactions");
  }
}

// GET TRANSACTIONS FOR CURRENT USER
export async function getCurrentUserTransactions(): Promise<
  TransactionWithStats[]
> {
  const userId = await getCurrentUserId();
  return getTransactions(userId);
}
