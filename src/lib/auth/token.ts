import { v4 as uuid } from "uuid";
import { prisma } from "@/lib/prisma";
import { getVerificationTokenByUserId } from "./verification-token";

export const generateVerificationToken = async (userId: string) => {
  const token = uuid();
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 1); // 1 hour

  // Check if a token already exists for the user
  const existingToken = await getVerificationTokenByUserId(userId);

  if (existingToken) {
    await prisma.verificationToken.delete({
      where: {
        id: existingToken.id,
      },
    });
  }

  // Create a new verification token
  await prisma.verificationToken.create({
    data: {
      token,
      userId,
      expires,
    },
  });

  return token;
};
