import { z } from "zod";
import { CategoryTypeEnum } from "../categories/schema";

// Base budget schema matching Prisma model
export const budgetSchema = z.object({
  name: z.string().min(1, "Budget name is required").default("Monthly Budget"),
  categoryId: z.string().cuid("Invalid category ID"),
  userId: z.string().cuid("Invalid user ID"),
  amount: z.number().min(0.01, "Amount must be at least 0.01"),
  description: z.string().optional(),
  month: z.string().regex(/^\d{4}-\d{2}$/, "Invalid month format (YYYY-MM)"),
});

// Schema for creating budgets
export const createBudgetSchema = budgetSchema;

// Schema for updating budgets (includes id)
export const updateBudgetSchema = budgetSchema.extend({
  id: z.string().cuid("Invalid budget ID"),
  month: budgetSchema.shape.month.optional(),
});

// Form schema for frontend forms (handles FormData conversion)
export const budgetFormSchema = z.object({
  name: z.string().min(1, "Budget name is required").default("Monthly Budget"),
  categoryId: z.string().min(1, "Category is required"),
  amount: z.string().min(1, "Amount is required"),
  description: z.string().optional(),
});

// Extended budget type with computed fields for frontend
export const budgetWithStatsSchema = z.object({
  id: z.string().cuid(),
  name: z.string(),
  categoryId: z.string(),
  userId: z.string(),
  amount: z.number(),
  description: z.string().nullable(),
  month: z.string(),
  createdAt: z.date(),
  // Computed fields
  spent: z.number().optional(),
  remaining: z.number().optional(),
  progress: z.number().optional(),
  category: z
    .object({
      id: z.string(),
      name: z.string(),
      type: CategoryTypeEnum,
      icon: z.string(),
    })
    .optional(),
});

// Type exports
export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
export type BudgetFormValues = z.infer<typeof budgetFormSchema>;
export type BudgetWithStats = z.infer<typeof budgetWithStatsSchema>;

export const emptyBudgetForm: BudgetFormValues = {
  name: "",
  categoryId: "",
  amount: "",
  description: "",
};
