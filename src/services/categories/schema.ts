import { z } from "zod";

// Enum for category types
export const CategoryTypeEnum = z.enum(["EXPENSE", "INCOME"]);

// Base category schema matching Prisma model
export const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
  type: CategoryTypeEnum.default("EXPENSE"),
  icon: z.string().default("Package"),
  userId: z.string().cuid(),
});

// Schema for creating categories
export const createCategorySchema = categorySchema;

// Schema for updating categories (includes id)
export const updateCategorySchema = categorySchema.extend({
  id: z.string().cuid(),
});

// Form schema for frontend forms (handles FormData conversion)
export const categoryFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
  type: CategoryTypeEnum.default("EXPENSE"),
  icon: z.string().default("Package"),
});

// Extended category type with computed fields for frontend
export const categoryWithStatsSchema = z.object({
  id: z.string().cuid(),
  name: z.string(),
  description: z.string().nullable(),
  type: CategoryTypeEnum,
  icon: z.string(),
  userId: z.string(),
  // Computed fields from related data
  transactions: z.number().optional(),
  accounts: z.number().optional(),
  budgetName: z.string().optional(),
  budgetAmount: z.number().optional(),
  spent: z.number().optional(),
  remaining: z.number().optional(),
  balance: z.number().optional(),
  averageGrowth: z.number().optional(),
});

// Type exports
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
export type CategoryWithStats = z.infer<typeof categoryWithStatsSchema>;

export const emptyCategoryForm: CategoryFormValues = {
  name: "",
  description: "",
  type: "EXPENSE",
  icon: "Package",
};
