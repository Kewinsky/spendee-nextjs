import Link from "next/link";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constanst";

type LogoProps = {
  className?: string;
  asLink?: boolean;
};

export function Logo({ className, asLink = false }: LogoProps) {
  const content = (
    <span
      className={cn(
        "font-display font-bold tracking-tight hover:opacity-90 transition-opacity",
        className
      )}
    >
      {APP_NAME}
    </span>
  );

  if (asLink) {
    return <Link href="/">{content}</Link>;
  }

  return content;
}
