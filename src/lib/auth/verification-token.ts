import { prisma } from "../prisma";

export const getVerificationTokenByUserId = async (userId: string) => {
  try {
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        userId: userId,
      },
    });

    return verificationToken;
  } catch (error) {
    console.log(error);
  }
};

export const getVerificationTokenByToken = async (token: string) => {
  try {
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        token: token,
      },
    });

    return verificationToken;
  } catch (error) {
    console.log(error);
  }
};
