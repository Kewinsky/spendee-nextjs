import { z } from "zod";
import { CategoryTypeEnum } from "../categories/schema";

// Enum for transaction types
export const TransactionTypeEnum = z.enum(["INCOME", "EXPENSE"]);

// Base transaction schema matching Prisma model
export const transactionSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.number().positive("Amount must be positive"),
  date: z.date(),
  categoryId: z.string().cuid("Invalid category ID"),
  type: TransactionTypeEnum,
  notes: z.string().optional().nullable(),
  userId: z.string().cuid(),
});

// Schema for creating transactions
export const createTransactionSchema = transactionSchema;

// Schema for updating transactions (includes id)
export const updateTransactionSchema = transactionSchema.extend({
  id: z.string().cuid(),
});

// Form schema for frontend forms (handles FormData conversion)
export const transactionFormSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  amount: z.string().min(1, "Amount is required"),
  date: z.string().min(1, "Date is required"),
  categoryId: z.string().min(1, "Category is required"),
  type: z.enum(["Income", "Expense"]),
  notes: z.string().optional().nullable(),
});

// Extended transaction type with category info for frontend
export const transactionWithStatsSchema = z.object({
  id: z.string().cuid(),
  description: z.string(),
  amount: z.number(),
  date: z.string(),
  notes: z.string().nullable(),
  type: TransactionTypeEnum,
  userId: z.string(),
  categoryId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
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
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type TransactionFormValues = z.infer<typeof transactionFormSchema>;
export type TransactionWithStats = z.infer<typeof transactionWithStatsSchema>;

// Empty form for frontend
export const emptyTransactionForm: TransactionFormValues = {
  description: "",
  amount: "",
  date: new Date().toISOString().split("T")[0],
  categoryId: "",
  type: "Expense",
  notes: "",
};
