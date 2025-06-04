import { ZodSchema } from "zod";

export function validateWithSchema<T>(
  data: unknown,
  schema: ZodSchema<T>,
  label: string
): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(`Validation failed: ${result.error.message}`);
  }
  return result.data;
}

export function parseAndCleanFormData(
  formData: FormData,
  nullables: string[] = []
) {
  const raw = Object.fromEntries(formData.entries());
  const cleaned = { ...raw };

  for (const key of nullables) {
    if (cleaned[key] === "") {
      cleaned[key] = null;
    }
  }

  return cleaned;
}
