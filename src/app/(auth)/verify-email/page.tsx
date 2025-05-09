"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  useEffect(() => {
    const verify = async () => {
      const res = await fetch(`/api/verify-email?token=${token}`);
      if (res.ok) {
        toast.success("Email verified!");
        setStatus("success");
        setTimeout(() => router.push("/login"), 2000);
      } else {
        toast.error("Invalid or expired token");
        setStatus("error");
      }
    };
    if (token) verify();
  }, [token, router]);

  return (
    <div className="flex flex-col gap-6 items-center justify-center">
      <div className="max-w-md w-full text-center space-y-4">
        {status === "loading" && (
          <>
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-muted-foreground" />
            <h2 className="text-xl font-semibold">Verifying your email...</h2>
            <p className="text-muted-foreground text-sm">
              Please wait while we confirm your verification link.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="mx-auto h-10 w-10 text-green-500" />
            <h2 className="text-xl font-semibold">
              Email verified successfully!
            </h2>
            <p className="text-muted-foreground text-sm">
              You will be redirected to login shortly.
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="mx-auto h-10 w-10 text-destructive" />
            <h2 className="text-xl font-semibold">Verification failed</h2>
            <p className="text-muted-foreground text-sm">
              The link is invalid or has expired. Please request a new one.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
