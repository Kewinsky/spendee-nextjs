import { prisma } from "@/lib/db/prisma";

export async function softDeleteRelations(
  userId: string,
  categoryIds: string[]
) {
  const now = new Date();

  await prisma.budget.updateMany({
    where: { categoryId: { in: categoryIds }, userId },
    data: { deletedAt: now },
  });

  await prisma.transaction.updateMany({
    where: { categoryId: { in: categoryIds }, userId },
    data: { deletedAt: now },
  });

  await prisma.savings.updateMany({
    where: { categoryId: { in: categoryIds }, userId },
    data: { deletedAt: now },
  });
}
