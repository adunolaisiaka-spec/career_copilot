import Link from "next/link";
import { Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-3 px-6 py-6 text-sm sm:flex-row">
        <Link href="/" className="text-muted-foreground flex items-center gap-1.5 font-medium">
          <span className="bg-primary text-primary-foreground flex size-5 items-center justify-center rounded-md">
            <Sparkles className="size-3" />
          </span>
          Career Copilot
        </Link>
        <p className="text-muted-foreground text-xs">
          &copy; {new Date().getFullYear()} Career Copilot.
        </p>
      </div>
    </footer>
  );
}
