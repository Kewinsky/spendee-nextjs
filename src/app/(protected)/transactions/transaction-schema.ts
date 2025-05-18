import { z } from "zod";

// Transaction schemas
export const transactionSchema = z.object({
  id: z.number(),
  date: z.string(),
  description: z.string(),
  amount: z.number(),
  category: z.string(),
  icon: z.string(),
  type: z.string(),
  notes: z.string().optional(),
});

export type Transaction = z.infer<typeof transactionSchema>;

export const transactionFormSchema = z.object({
  id: z.number().optional(),
  date: z.string().min(1, "Date is required"),
  description: z.string().min(1, "Description is required"),
  amount: z.coerce.number().min(0.01, "Amount must be at least 0.01"),
  category: z.string().min(1, "Category is required"),
  type: z.enum(["Income", "Expense"]),
  notes: z.string().optional(),
});

export type TransactionFormValues = z.infer<typeof transactionFormSchema>;

export const emptyTransactionForm: TransactionFormValues = {
  date: new Date().toISOString().split("T")[0],
  description: "",
  amount: 0,
  category: "",
  type: "Expense",
  notes: "",
};
