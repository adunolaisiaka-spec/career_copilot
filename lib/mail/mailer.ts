interface SendMailInput {
  to: string;
  subject: string;
  html: string;
}

/**
 * Swappable mail adapter. In dev (no mail provider configured), this just logs
 * the message so verification/reset links are visible without a real inbox.
 * Replace the body with a real provider (Resend, SES, Postmark, ...) later —
 * callers never need to change.
 */
export async function sendMail({ to, subject, html }: SendMailInput): Promise<void> {
  console.log(`[mail:dev] To: ${to}\nSubject: ${subject}\n${html}\n`);
}
