"use client";

import { SessionRefresher } from "@/components/session-refresher";

export function ClientLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SessionRefresher />
      {children}
    </>
  );
}
