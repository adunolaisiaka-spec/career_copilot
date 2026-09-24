import type { NextConfig } from "next";

// No external scripts, styles, fonts, or images anywhere in the app (checked
// directly — next/font self-hosts Google Fonts at build time, so no runtime
// fonts.googleapis.com request either), so this stays tight: 'self' plus
// 'unsafe-inline' for script/style, which is a deliberate, pragmatic
// trade-off — a nonce-based strict CSP is the gold standard but needs
// per-request nonce plumbing through Base UI's portaled/dynamically
// positioned elements without dedicated testing infrastructure for that
// (though verifying live via Playwright across every page + Base UI
// Select/Dialog interaction found zero actual style-src violations —
// 'unsafe-inline' for style- turned out to be unneeded in practice, kept
// only as a safety margin). 'unsafe-eval' on script-src is a genuine,
// unavoidable requirement, not an oversight: Zod v4 — used for every form
// and every API route's input validation across this entire app —
// JIT-compiles validators with `new Function()` internally
// (node_modules/zod/v4/core/compile.js), confirmed as the exact source via
// live CSP-violation testing on every page using react-hook-form +
// zodResolver. This still blocks the two most common XSS payloads (loading
// an attacker script from another origin, exfiltrating data via fetch/XHR
// to another origin) via script-src/connect-src 'self'.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

// Verified report-only first (zero violations across every page plus Base UI
// Select/Dialog interactions, before and after the unsafe-eval fix above —
// see the commit history) with no way to break anything on its own; now
// enforcing for real.
const CSP_HEADER_NAME = "Content-Security-Policy";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: CSP_HEADER_NAME, value: CSP },
        ],
      },
    ];
  },
};

export default nextConfig;
