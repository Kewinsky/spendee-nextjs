import { sendPasswordResetEmail } from "@/lib/auth/send-reset-email";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { email } = await req.json();
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  await sendPasswordResetEmail(email);

  return NextResponse.json({ success: true });
}
