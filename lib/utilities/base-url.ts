/**
 * The app's own base URL, for building absolute links in emails and
 * redirect-URL params (Stripe Checkout, etc.) that must always be a real,
 * absolute URL. Uses `||` rather than `??` deliberately — NEXTAUTH_URL set to
 * an empty string (as opposed to genuinely unset) previously produced a bare
 * path like "/settings?checkout=success" with no scheme/host, which Stripe's
 * API correctly rejected as "Not a valid URL"; `??` only catches null/
 * undefined, not empty-but-defined values.
 */
export function getBaseUrl(): string {
  return process.env.NEXTAUTH_URL || "http://localhost:3000";
}
