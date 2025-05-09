import { createToken } from "./create-token";
import { sendEmail } from "@/lib/mail/send-email";
import { TOKEN_EXPIRATION } from "../constanst";

export const sendVerificationEmail = async (userId: string, email: string) => {
  const token = await createToken({
    userId,
    type: "verification",
    expiresInMs: TOKEN_EXPIRATION.VERIFY_EMAIL,
  });

  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;

  await sendEmail({
    to: email,
    subject: "Please verify your email",
    html: `
      <p>Thanks for signing up!</p>
      <p>Click the link below to verify your email:</p>
      <a href="${verificationUrl}">Verify Email</a>
      <p>This link expires in 24 hours.</p>
    `,
  });
};
