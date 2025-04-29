import nodemailer from "nodemailer";
import { generateVerificationToken } from "./token";

export async function sendVerificationEmail(userId: string, userEmail: string) {
  const token = await generateVerificationToken(userId);

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

  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;

  const mailOptions = {
    from: '"spendee" <no-reply@spendee.com>',
    to: userEmail,
    subject: "Please verify your email",
    html: `
      <p>Thanks for signing up!</p>
      <p>Click the link below to verify your email:</p>
      <a href="${verificationUrl}">Verify Email</a>
      <p>This link expires in 24 hours.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Verification email sent to:", userEmail);
  } catch (error) {
    console.error("Error sending verification email:", error);
  }
}
