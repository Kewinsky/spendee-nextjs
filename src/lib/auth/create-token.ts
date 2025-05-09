import { v4 as uuid } from "uuid";
import { prisma } from "@/lib/prisma";

export const createToken = async ({
  userId,
  type,
  expiresInSec,
}: {
  userId: string;
  type: "verification" | "passwordReset";
  expiresInSec: number;
}): Promise<string> => {
  const token = uuid();
  const expires = new Date(Date.now() + expiresInSec * 1000);

  if (type === "verification") {
    const existing = await prisma.verificationToken.findFirst({
      where: { userId },
    });
    if (existing) {
      await prisma.verificationToken.delete({ where: { id: existing.id } });
    }

    await prisma.verificationToken.create({
      data: {
        token,
        userId,
        expires,
      },
    });
  } else {
    const existing = await prisma.passwordResetToken.findFirst({
      where: { userId },
    });
    if (existing) {
      await prisma.passwordResetToken.delete({ where: { id: existing.id } });
    }

    await prisma.passwordResetToken.create({
      data: {
        token,
        userId,
        expires,
      },
    });
  }

  return token;
};
