"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";

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
        router.push("/login?verified=true");
      } else {
        toast.error("Invalid or expired token");
        setStatus("error");
      }
    };
    if (token) verify();
  }, [token, router]);

  return (
    <div className="p-8 text-center">
      {status === "loading" && <p>Verifying your email...</p>}
      {status === "error" && (
        <p className="text-red-500">Verification failed.</p>
      )}
    </div>
  );
}
