"use server";

import { prisma } from "@/lib/db/prisma";
import {
  createSavingsSchema,
  updateSavingsSchema,
  savingsFormSchema,
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

    const cleanedData = parseAndCleanFormData(formData, [
      "institution",
      "growth",
    ]);
    const normalizedData = {
      ...cleanedData,
      growth: cleanedData.growth === "" ? "0" : cleanedData.growth,
    };

    const formValidated = validateWithSchema(
      normalizedData,
      savingsFormSchema,
      "form"
    );

    const savingsData = {
      ...formValidated,
      userId,
      balance: parseFloat(formValidated.balance),
      interestRate: parseFloat(formValidated.interestRate),
      growth: formValidated.growth ? parseFloat(formValidated.growth) : 0,
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

    const cleanedData = parseAndCleanFormData(formData, [
      "institution",
      "growth",
    ]);
    const normalizedData = {
      ...cleanedData,
      growth: cleanedData.growth === "" ? "0" : cleanedData.growth,
    };

    const formValidated = validateWithSchema(
      normalizedData,
      savingsFormSchema,
      "form"
    );

    const savingsId = cleanedData.id as string;
    if (!savingsId) {
      throw new Error("Savings ID is required for update");
    }

    const savingsData = {
      ...formValidated,
      userId,
      id: savingsId,
      balance: parseFloat(formValidated.balance),
      interestRate: parseFloat(formValidated.interestRate),
      growth: formValidated.growth ? parseFloat(formValidated.growth) : 0,
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

    return savings as SavingsWithStats[];
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
