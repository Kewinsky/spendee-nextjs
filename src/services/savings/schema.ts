import { z } from "zod";
import { CategoryTypeEnum } from "../categories/schema";

// Enum for account types
export const AccountTypeEnum = z.enum(["SAVINGS", "INVESTMENT"]);

// Base savings schema matching Prisma model
export const savingsSchema = z.object({
  accountName: z.string().min(1, "Account name is required"),
  categoryId: z.string().cuid("Invalid category ID"),
  userId: z.string().cuid("Invalid user ID"),
  balance: z.number().min(0, "Balance must be positive"),
  interestRate: z.number().min(0, "Interest rate must be positive"),
  growth: z.number().default(0),
  accountType: AccountTypeEnum.default("SAVINGS"),
  institution: z.string().optional().nullable(),
});

// Schema for creating savings
export const createSavingsSchema = savingsSchema;

// Schema for updating savings (includes id)
export const updateSavingsSchema = savingsSchema.extend({
  id: z.string().cuid("Invalid savings ID"),
});

// Form schema for frontend forms (handles FormData conversion)
export const savingsFormSchema = z.object({
  accountName: z.string().min(1, "Account name is required"),
  categoryId: z.string().min(1, "Category is required"),
  balance: z.string().min(1, "Balance is required"),
  interestRate: z.string().min(1, "Interest rate is required"),
  growth: z.string().optional(),
  accountType: AccountTypeEnum.default("SAVINGS"),
  institution: z.string().optional().nullable(),
});

// Extended savings type with computed fields for frontend
export const savingsWithStatsSchema = z.object({
  id: z.string().cuid(),
  accountName: z.string(),
  categoryId: z.string(),
  userId: z.string(),
  balance: z.number(),
  interestRate: z.number(),
  growth: z.number(),
  accountType: AccountTypeEnum,
  institution: z.string().nullable(),
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
export type CreateSavingsInput = z.infer<typeof createSavingsSchema>;
export type UpdateSavingsInput = z.infer<typeof updateSavingsSchema>;
export type SavingsFormValues = z.infer<typeof savingsFormSchema>;
export type SavingsWithStats = z.infer<typeof savingsWithStatsSchema>;
export type AccountType = z.infer<typeof AccountTypeEnum>;

export const emptySavingsForm: SavingsFormValues = {
  accountName: "",
  categoryId: "",
  balance: "",
  interestRate: "",
  growth: "",
  accountType: "SAVINGS",
  institution: "",
};
