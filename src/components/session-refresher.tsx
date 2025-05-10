"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function SessionRefresher() {
  const { data: session, update } = useSession();
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    if (!session || typeof session.expiresAt !== "number") return;

    const now = Math.floor(Date.now() / 1000);
    const warningTime = 5 * 60;
    const timeUntilPopup = (session.expiresAt - warningTime - now) * 1000;
    const timeUntilLogout = (session.expiresAt - now) * 1000;

    const popup = setTimeout(() => {
      setShowDialog(true);
    }, Math.max(timeUntilPopup, 0));

    const logout = setTimeout(() => {
      signOut({ callbackUrl: "/login" });
    }, Math.max(timeUntilLogout, 0));

    return () => {
      clearTimeout(popup);
      clearTimeout(logout);
    };
  }, [session, session?.expiresAt]);

  const handleExtend = async () => {
    try {
      await update();
      setShowDialog(false);
    } catch {
      // optional: toast or silent fail
    }
  };

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Session expiring soon</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Your session will expire in a few minutes. Would you like to extend
          it?
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowDialog(false)}>
            Dismiss
          </Button>
          <Button onClick={handleExtend}>Extend session</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
