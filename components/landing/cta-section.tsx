import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export function CtaSection({ isAuthenticated }: { isAuthenticated: boolean }) {
  if (isAuthenticated) return null;

  return (
    <section className="mx-auto w-full max-w-3xl px-6 py-16 text-center">
      <h2 className="text-2xl font-semibold tracking-tight">Ready to build your career command center?</h2>
      <p className="text-muted-foreground mt-2">
        Free to start — no credit card required.
      </p>
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Link href="/register" className={buttonVariants({ size: "lg" })}>
          Start your career journey
        </Link>
        <Link href="/login" className={buttonVariants({ variant: "outline", size: "lg" })}>
          Log in
        </Link>
      </div>
    </section>
  );
}
