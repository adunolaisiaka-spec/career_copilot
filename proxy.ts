import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/copilot",
  "/resume",
  "/jobs",
  "/applications",
  "/interviews",
  "/career",
  "/settings",
  "/profile",
  "/notifications",
  "/onboarding",
  "/admin",
];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (!isProtected) return NextResponse.next();

  if (!req.auth) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/admin") && req.auth.user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  // Skip static assets, images, and API routes (route handlers do their own auth checks).
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
