import { Suspense } from "react";
import { VerifyEmail } from "@/components/auth/verify-email";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmail />
    </Suspense>
  );
}
