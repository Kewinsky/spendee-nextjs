import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { sendResetPasswordEmail } from "@/lib/mail";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { email } = await req.json();

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return NextResponse.json(
      { message: "If user exists, email was sent." },
      { status: 200 }
    );
  }

  const token = jwt.sign(
    { userId: user.id },
    process.env.RESET_PASSWORD_SECRET!,
    { expiresIn: "1h" }
  );

  const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

  await sendResetPasswordEmail(user.email, resetLink);

  return NextResponse.json({ message: "Email sent" });
}
