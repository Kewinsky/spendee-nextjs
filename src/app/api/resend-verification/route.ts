import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/auth/send-verification-email";

export async function POST(req: Request) {
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "Missing email" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return NextResponse.json(
      { error: "No user found with this email" },
      { status: 404 }
    );
  }

  if (user.emailVerified) {
    return NextResponse.json(
      { error: "Email already verified" },
      { status: 400 }
    );
  }

  try {
    await sendVerificationEmail(user.id, user.email);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
