import { v4 as uuid } from "uuid";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";

export async function sendPasswordResetEmail(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;

  const existingToken = await prisma.passwordResetToken.findFirst({
    where: { userId: user.id },
  });

  if (existingToken) {
    await prisma.passwordResetToken.delete({ where: { id: existingToken.id } });
  }

  const token = uuid();
  const expires = new Date(Date.now() + 1000 * 60 * 60); // 1h

  await prisma.passwordResetToken.create({
    data: {
      token,
      userId: user.id,
      expires,
    },
  });

  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT!),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    to: user.email,
    subject: "Reset your password",
    html: `
      <p>You requested a password reset.</p>
      <p><a href="${resetUrl}">Click here to reset your password</a></p>
      <p>This link expires in 1 hour.</p>
    `,
  });
}
