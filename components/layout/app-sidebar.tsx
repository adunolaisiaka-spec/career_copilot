"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { cn } from "cn";
import { SignOutButton } from "@/components/auth/sign-out-button";
import {
  LayoutDashboard,
  Briefcase,
  Search,
  Bot,
  FileText,
  MessagesSquare,
  Target,
  Map,
  User,
  Settings,
  ShieldCheck,
  Bell,
  Menu,
  X,
  Sparkles,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Workspace",
    items: [
      { href: "/applications", label: "Applications", icon: Briefcase },
      { href: "/jobs", label: "Jobs", icon: Search },
    ],
  },
  {
    label: "AI Tools",
    items: [
      { href: "/copilot", label: "Career Copilot", icon: Bot },
      { href: "/resume", label: "Resume", icon: FileText },
      { href: "/interviews", label: "Interview Prep", icon: MessagesSquare },
    ],
  },
  {
    label: "Career Growth",
    items: [
      { href: "/career/goals", label: "Goals", icon: Target },
      { href: "/career/roadmap", label: "Roadmap", icon: Map },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/profile", label: "Profile", icon: User },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

function isActive(pathname: string, href: string): boolean {
  return href === "/dashboard" ? pathname === href : pathname.startsWith(href);
}

function NavLink({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-sidebar-primary text-sidebar-primary-foreground"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      )}
    >
      <item.icon className="size-4 shrink-0" />
      {item.label}
    </Link>
  );
}

function NavContent({
  pathname,
  isAdmin,
  unreadCount,
  onNavigate,
}: {
  pathname: string;
  isAdmin: boolean;
  unreadCount: number;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col gap-1 overflow-y-auto p-3">
      <NavLink
        item={{ href: "/dashboard", label: "Overview", icon: LayoutDashboard }}
        active={isActive(pathname, "/dashboard")}
        onNavigate={onNavigate}
      />

      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="mt-3 flex flex-col gap-1">
          <span className="text-sidebar-foreground/50 px-2.5 text-xs font-semibold tracking-wide uppercase">
            {group.label}
          </span>
          {group.items.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={isActive(pathname, item.href)}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ))}

      {isAdmin && (
        <div className="mt-3 flex flex-col gap-1">
          <span className="text-sidebar-foreground/50 px-2.5 text-xs font-semibold tracking-wide uppercase">
            Admin
          </span>
          <NavLink
            item={{ href: "/admin", label: "Admin Dashboard", icon: ShieldCheck }}
            active={isActive(pathname, "/admin")}
            onNavigate={onNavigate}
          />
        </div>
      )}

      <div className="mt-auto flex flex-col gap-2 pt-3">
        <NavLink
          item={{
            href: "/notifications",
            label: unreadCount > 0 ? `Notifications (${unreadCount})` : "Notifications",
            icon: Bell,
          }}
          active={isActive(pathname, "/notifications")}
          onNavigate={onNavigate}
        />
        <div className="border-sidebar-border flex items-center justify-between border-t pt-3">
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2 px-3 py-4 text-base font-semibold">
      <span className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-lg">
        <Sparkles className="size-4" />
      </span>
      Career Copilot
    </Link>
  );
}

export function AppSidebar({ isAdmin, unreadCount }: { isAdmin: boolean; unreadCount: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="bg-sidebar text-sidebar-foreground border-sidebar-border hidden w-64 shrink-0 flex-col border-r md:flex">
        <Brand />
        <NavContent pathname={pathname} isAdmin={isAdmin} unreadCount={unreadCount} />
      </aside>

      {/* Mobile top bar */}
      <header className="bg-sidebar text-sidebar-foreground border-sidebar-border flex items-center justify-between border-b px-3 py-2.5 md:hidden">
        <Link href="/dashboard" className="flex items-center gap-2 text-sm font-semibold">
          <span className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <Sparkles className="size-3.5" />
          </span>
          Career Copilot
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open navigation"
          className="hover:bg-sidebar-accent flex size-8 items-center justify-center rounded-md"
        >
          <Menu className="size-5" />
        </button>
      </header>

      {/* Mobile drawer */}
      <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Backdrop className="data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 fixed inset-0 z-50 bg-black/20 duration-150" />
          <DialogPrimitive.Popup className="bg-sidebar text-sidebar-foreground data-open:animate-in data-open:slide-in-from-left data-closed:animate-out data-closed:slide-out-to-left fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85%] flex-col shadow-xl duration-200 outline-none">
            <div className="flex items-center justify-between px-3 py-4">
              <span className="text-base font-semibold">Career Copilot</span>
              <DialogPrimitive.Close
                aria-label="Close navigation"
                className="hover:bg-sidebar-accent flex size-8 items-center justify-center rounded-md"
              >
                <X className="size-5" />
              </DialogPrimitive.Close>
            </div>
            <NavContent
              pathname={pathname}
              isAdmin={isAdmin}
              unreadCount={unreadCount}
              onNavigate={() => setOpen(false)}
            />
          </DialogPrimitive.Popup>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}
