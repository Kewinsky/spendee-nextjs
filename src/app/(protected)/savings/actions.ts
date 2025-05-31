"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import {
  createSavingsSchema,
  updateSavingsSchema,
  savingsFormSchema,
  type SavingsWithStats,
} from "@/services/savings/schema";
import { revalidatePath } from "next/cache";

// Helper function to get current user
async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

// CREATE SAVINGS
export async function createSavings(formData: FormData) {
  try {
    const userId = await getCurrentUser();

    // Parse FormData
    const raw = Object.fromEntries(formData.entries());

    // Convert empty strings to undefined for optional fields
    const cleanedData = {
      ...raw,
      institution: raw.institution === "" ? null : raw.institution,
      growth: raw.growth === "" ? "0" : raw.growth,
    };

    // Validate with form schema first
    const formValidation = savingsFormSchema.safeParse(cleanedData);
    if (!formValidation.success) {
      throw new Error(`Validation failed: ${formValidation.error.message}`);
    }

    // Convert form data to create schema format
    const dataWithUserId = {
      ...formValidation.data,
      userId,
      balance: Number.parseFloat(formValidation.data.balance),
      interestRate: Number.parseFloat(formValidation.data.interestRate),
      growth: formValidation.data.growth
        ? Number.parseFloat(formValidation.data.growth)
        : 0,
    };

    const validation = createSavingsSchema.safeParse(dataWithUserId);
    if (!validation.success) {
      throw new Error(`Validation failed: ${validation.error.message}`);
    }

    const savings = await prisma.savings.create({
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

    revalidatePath("/savings");
    revalidatePath("/categories");
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
    const userId = await getCurrentUser();

    // Parse FormData
    const raw = Object.fromEntries(formData.entries());

    // Convert empty strings to undefined for optional fields
    const cleanedData = {
      ...raw,
      institution: raw.institution === "" ? null : raw.institution,
      growth: raw.growth === "" ? "0" : raw.growth,
    };

    // Validate with form schema first
    const formValidation = savingsFormSchema.safeParse(cleanedData);
    if (!formValidation.success) {
      throw new Error(`Validation failed: ${formValidation.error.message}`);
    }

    // Get ID from FormData
    const savingsId = raw.id as string;
    if (!savingsId) {
      throw new Error("Savings ID is required for update");
    }

    // Convert form data to update schema format
    const dataWithUserIdAndId = {
      ...formValidation.data,
      userId,
      id: savingsId,
      balance: Number.parseFloat(formValidation.data.balance),
      interestRate: Number.parseFloat(formValidation.data.interestRate),
      growth: formValidation.data.growth
        ? Number.parseFloat(formValidation.data.growth)
        : 0,
    };

    const validation = updateSavingsSchema.safeParse(dataWithUserIdAndId);
    if (!validation.success) {
      throw new Error(`Validation failed: ${validation.error.message}`);
    }

    const { id, ...updateData } = validation.data;

    // Verify ownership
    const existingSavings = await prisma.savings.findFirst({
      where: { id, userId },
    });

    if (!existingSavings) {
      throw new Error("Savings not found or access denied");
    }

    const savings = await prisma.savings.update({
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

    revalidatePath("/savings");
    revalidatePath("/categories");
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

// DELETE SAVINGS
export async function deleteSaving(id: string) {
  try {
    const userId = await getCurrentUser();

    if (!id) {
      throw new Error("Savings ID is required");
    }

    // Verify ownership before deletion
    const existingSavings = await prisma.savings.findFirst({
      where: { id, userId },
    });

    if (!existingSavings) {
      throw new Error("Savings not found or access denied");
    }

    await prisma.savings.delete({
      where: { id },
    });

    revalidatePath("/savings");
    revalidatePath("/categories");
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
export async function deleteSavings(id: string) {
  try {
    const userId = await getCurrentUser();

    if (!id) {
      throw new Error("Savings ID is required");
    }

    // Verify ownership before deletion
    const existingSavings = await prisma.savings.findFirst({
      where: { id, userId },
    });

    if (!existingSavings) {
      throw new Error("Savings not found or access denied");
    }

    await prisma.savings.delete({
      where: { id },
    });

    revalidatePath("/savings");
    revalidatePath("/categories");

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
  const userId = await getCurrentUser();
  return getSavings(userId);
}
