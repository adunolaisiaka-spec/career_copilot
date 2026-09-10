import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/helpers";
import { buttonVariants } from "@/components/ui/button";

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">Career Copilot</h1>
      <p className="text-muted-foreground max-w-md">
        Your AI-powered career assistant — resumes, job matching, interview prep, and career
        planning in one place.
      </p>
      <div className="flex gap-3">
        {user ? (
          <Link href="/dashboard" className={buttonVariants({ size: "lg" })}>
            Go to dashboard
          </Link>
        ) : (
          <>
            <Link href="/register" className={buttonVariants({ size: "lg" })}>
              Get started
            </Link>
            <Link href="/login" className={buttonVariants({ variant: "outline", size: "lg" })}>
              Log in
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
