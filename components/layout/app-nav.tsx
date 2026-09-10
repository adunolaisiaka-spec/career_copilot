import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";

interface AppNavProps {
  isAdmin: boolean;
  unreadCount: number;
}

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/copilot", label: "Copilot" },
  { href: "/resume", label: "Resume" },
  { href: "/jobs", label: "Jobs" },
  { href: "/applications", label: "Applications" },
  { href: "/interviews", label: "Interview Prep" },
  { href: "/career/goals", label: "Career Goals" },
  { href: "/career/roadmap", label: "Roadmap" },
  { href: "/profile", label: "Profile" },
  { href: "/settings", label: "Settings" },
];

const linkClass =
  "text-muted-foreground hover:text-foreground hover:bg-muted rounded-md px-2 py-1.5 text-sm transition-colors";

export function AppNav({ isAdmin, unreadCount }: AppNavProps) {
  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 p-4">
        <Link href="/dashboard" className="shrink-0 text-lg font-semibold">
          Career Copilot
        </Link>

        <nav className="flex flex-wrap items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={linkClass}>
              {link.label}
            </Link>
          ))}
          {isAdmin && (
            <Link href="/admin" className={linkClass}>
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/notifications" className={linkClass}>
            Notifications{unreadCount > 0 ? ` (${unreadCount})` : ""}
          </Link>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
