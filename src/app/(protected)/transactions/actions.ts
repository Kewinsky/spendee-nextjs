"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import {
  createTransactionSchema,
  updateTransactionSchema,
  transactionFormSchema,
  type TransactionWithStats,
} from "@/services/transactions/schema";
import { revalidatePath } from "next/cache";

// Helper function to get current user
async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

// CREATE TRANSACTION
export async function createTransaction(formData: FormData) {
  try {
    const userId = await getCurrentUser();

    // Parse FormData
    const raw = Object.fromEntries(formData.entries());

    // Convert empty strings to undefined for optional fields
    const cleanedData = {
      ...raw,
      notes: raw.notes === "" ? undefined : raw.notes,
    };

    // Validate with form schema first
    const formValidation = transactionFormSchema.safeParse(cleanedData);
    if (!formValidation.success) {
      throw new Error(`Validation failed: ${formValidation.error.message}`);
    }

    // Convert form data to database format
    const dataWithUserId = {
      description: formValidation.data.description,
      amount: Number.parseFloat(formValidation.data.amount),
      date: new Date(formValidation.data.date),
      categoryId: formValidation.data.categoryId,
      type: formValidation.data.type === "Income" ? "INCOME" : "EXPENSE",
      notes: formValidation.data.notes,
      userId,
    };

    // Validate with create schema
    const validation = createTransactionSchema.safeParse(dataWithUserId);
    if (!validation.success) {
      throw new Error(`Validation failed: ${validation.error.message}`);
    }

    // Verify category exists and belongs to user
    const category = await prisma.category.findFirst({
      where: {
        id: validation.data.categoryId,
        userId,
      },
    });

    if (!category) {
      throw new Error("Category not found or access denied");
    }

    // Verify transaction type matches category type
    const expectedType = category.type === "EXPENSE" ? "EXPENSE" : "INCOME";
    if (validation.data.type !== expectedType) {
      throw new Error(
        `Transaction type must match category type (${expectedType})`
      );
    }

    const transaction = await prisma.transaction.create({
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

    const formattedTransaction = {
      ...transaction,
      date: transaction.date.toISOString().split("T")[0],
    };

    revalidatePath("/transactions");
    revalidatePath("/categories");

    return { success: true, data: formattedTransaction };
  } catch (error) {
    console.error("Error creating transaction:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create transaction",
    };
  }
}

// UPDATE TRANSACTION
export async function updateTransaction(formData: FormData) {
  try {
    const userId = await getCurrentUser();

    // Parse FormData
    const raw = Object.fromEntries(formData.entries());

    // Convert empty strings to undefined for optional fields
    const cleanedData = {
      ...raw,
      notes: raw.notes === "" ? undefined : raw.notes,
    };

    // Validate with form schema first
    const formValidation = transactionFormSchema.safeParse(cleanedData);
    if (!formValidation.success) {
      throw new Error(`Validation failed: ${formValidation.error.message}`);
    }

    // Get ID from FormData
    const transactionId = raw.id as string;
    if (!transactionId) {
      throw new Error("Transaction ID is required for update");
    }

    // Convert form data to database format
    const dbData = {
      description: formValidation.data.description,
      amount: Number.parseFloat(formValidation.data.amount),
      date: new Date(formValidation.data.date),
      categoryId: formValidation.data.categoryId,
      type: formValidation.data.type === "Income" ? "INCOME" : "EXPENSE",
      notes: formValidation.data.notes,
      userId,
      id: transactionId,
    };

    // Validate with update schema
    const validation = updateTransactionSchema.safeParse(dbData);
    if (!validation.success) {
      throw new Error(`Validation failed: ${validation.error.message}`);
    }

    const { id, ...updateData } = validation.data;

    // Verify ownership
    const existingTransaction = await prisma.transaction.findFirst({
      where: { id, userId },
    });

    if (!existingTransaction) {
      throw new Error("Transaction not found or access denied");
    }

    // Verify category exists and belongs to user
    const category = await prisma.category.findFirst({
      where: {
        id: updateData.categoryId,
        userId,
      },
    });

    if (!category) {
      throw new Error("Category not found or access denied");
    }

    // Verify transaction type matches category type
    const expectedType = category.type === "EXPENSE" ? "EXPENSE" : "INCOME";
    if (updateData.type !== expectedType) {
      throw new Error(
        `Transaction type must match category type (${expectedType})`
      );
    }

    const transaction = await prisma.transaction.update({
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

    const formattedTransaction = {
      ...transaction,
      date: transaction.date.toISOString().split("T")[0],
    };

    revalidatePath("/transactions");
    return { success: true, data: formattedTransaction };
  } catch (error) {
    console.error("Error updating transaction:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update transaction",
    };
  }
}

// DELETE TRANSACTION
export async function deleteTransaction(id: string) {
  try {
    const userId = await getCurrentUser();

    if (!id) {
      throw new Error("Transaction ID is required");
    }

    // Verify ownership before deletion
    const existingTransaction = await prisma.transaction.findFirst({
      where: { id, userId },
    });

    if (!existingTransaction) {
      throw new Error("Transaction not found or access denied");
    }

    await prisma.transaction.delete({
      where: { id },
    });

    revalidatePath("/transactions");
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

// DELETE MULTIPLE TRANSACTIONS
export async function deleteTransactions(id: string) {
  try {
    const userId = await getCurrentUser();

    if (!id) {
      throw new Error("Transaction ID is required");
    }

    // Verify ownership before deletion
    const existingTransaction = await prisma.transaction.findFirst({
      where: { id, userId },
    });

    if (!existingTransaction) {
      throw new Error("Transaction not found or access denied");
    }

    await prisma.transaction.delete({
      where: { id },
    });

    revalidatePath("/transactions");
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

// GET TRANSACTIONS WITH STATS
export async function getTransactions(
  userId: string
): Promise<TransactionWithStats[]> {
  try {
    const transactions = await prisma.transaction.findMany({
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
      orderBy: { date: "desc" },
    });

    const formatted = transactions.map((t) => ({
      ...t,
      date: t.date.toISOString().split("T")[0],
    }));

    return formatted as TransactionWithStats[];
  } catch (error) {
    console.error("Error fetching transactions:", error);
    throw new Error("Failed to fetch transactions");
  }
}

// GET TRANSACTIONS FOR CURRENT USER
export async function getCurrentUserTransactions(): Promise<
  TransactionWithStats[]
> {
  const userId = await getCurrentUser();
  return getTransactions(userId);
}
