import { v4 as uuid } from "uuid";
import { prisma } from "@/lib/prisma";

export const generateVerificationToken = async (userId: string) => {
  const token = uuid();
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours

  await prisma.verificationToken.create({
    data: {
      token,
      userId,
      expires,
    },
  });

  return token;
};
