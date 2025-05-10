import { ResetPasswordForm } from "@/components/auth/reset-password";
import { Suspense } from "react";

const ResetPasswordPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
};

export default ResetPasswordPage;
