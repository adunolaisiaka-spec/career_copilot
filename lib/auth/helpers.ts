import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { auth } from "@/lib/auth";

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

/** For server components/pages: redirects to /login if not authenticated. */
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** For server components/pages: redirects if authenticated but wrong role. */
export async function requireRole(role: Role) {
  const user = await requireAuth();
  if (user.role !== role) redirect("/dashboard");
  return user;
}

/** For route handlers: returns the user or null, never redirects. */
export async function requireApiAuth() {
  const user = await getCurrentUser();
  return user;
}

/** For route handlers: returns the user only if authenticated AND an admin, else null. */
export async function requireApiAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return null;
  return user;
}
