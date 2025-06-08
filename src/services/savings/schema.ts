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
  initialBalance: z.number().min(0, "Initial balance must be positive"),
  interestRate: z.number().min(0, "Interest rate must be positive"),
  accountType: AccountTypeEnum.default("SAVINGS"),
  institution: z.string().optional().nullable(),
});

// Schema for creating savings
export const createSavingsSchema = savingsSchema;

// Schema for updating savings (includes id, excludes initialBalance from updates)
export const updateSavingsSchema = savingsSchema
  .omit({ initialBalance: true })
  .extend({
    id: z.string().cuid("Invalid savings ID"),
  });

// Form schema for adding new savings (only initialBalance, no balance)
export const addSavingsFormSchema = z.object({
  accountName: z.string().min(1, "Account name is required"),
  categoryId: z.string().min(1, "Category is required"),
  initialBalance: z
    .string()
    .min(1, "Initial balance is required")
    .refine(
      (val) => !isNaN(Number.parseFloat(val)) && Number.parseFloat(val) >= 0,
      {
        message: "Initial balance must be a valid positive number",
      }
    ),
  interestRate: z
    .string()
    .min(1, "Interest rate is required")
    .refine(
      (val) => !isNaN(Number.parseFloat(val)) && Number.parseFloat(val) >= 0,
      {
        message: "Interest rate must be a valid positive number",
      }
    ),
  accountType: AccountTypeEnum.default("SAVINGS"),
  institution: z.string().optional().nullable(),
});

// Form schema for editing existing savings (only balance, no initialBalance)
export const editSavingsFormSchema = z.object({
  accountName: z.string().min(1, "Account name is required"),
  categoryId: z.string().min(1, "Category is required"),
  balance: z
    .string()
    .min(1, "Balance is required")
    .refine(
      (val) => !isNaN(Number.parseFloat(val)) && Number.parseFloat(val) >= 0,
      {
        message: "Balance must be a valid positive number",
      }
    ),
  interestRate: z
    .string()
    .min(1, "Interest rate is required")
    .refine(
      (val) => !isNaN(Number.parseFloat(val)) && Number.parseFloat(val) >= 0,
      {
        message: "Interest rate must be a valid positive number",
      }
    ),
  accountType: AccountTypeEnum.default("SAVINGS"),
  institution: z.string().optional().nullable(),
});

// Legacy form schema for backward compatibility
export const savingsFormSchema = z.object({
  accountName: z.string().min(1, "Account name is required"),
  categoryId: z.string().min(1, "Category is required"),
  balance: z.string().optional(),
  initialBalance: z.string().optional(),
  interestRate: z.string().min(1, "Interest rate is required"),
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
  initialBalance: z.number(),
  interestRate: z.number(),
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
  growth: z.number(),
});

// Type exports
export type CreateSavingsInput = z.infer<typeof createSavingsSchema>;
export type UpdateSavingsInput = z.infer<typeof updateSavingsSchema>;
export type SavingsFormValues = z.infer<typeof savingsFormSchema>;
export type AddSavingsFormValues = z.infer<typeof addSavingsFormSchema>;
export type EditSavingsFormValues = z.infer<typeof editSavingsFormSchema>;
export type SavingsWithStats = z.infer<typeof savingsWithStatsSchema>;
export type AccountType = z.infer<typeof AccountTypeEnum>;

export const emptySavingsForm: SavingsFormValues = {
  accountName: "",
  categoryId: "",
  balance: "",
  initialBalance: "",
  interestRate: "",
  accountType: "SAVINGS",
  institution: "",
};

export const emptyAddSavingsForm: AddSavingsFormValues = {
  accountName: "",
  categoryId: "",
  initialBalance: "",
  interestRate: "",
  accountType: "SAVINGS",
  institution: "",
};
