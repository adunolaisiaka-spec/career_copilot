import { Resend } from "resend";

interface SendMailInput {
  to: string;
  subject: string;
  html: string;
}

let cachedResend: Resend | null = null;

/**
 * Swappable mail adapter. Auto-detects Resend via RESEND_API_KEY and sends
 * for real when present; otherwise falls back to a console.log stub (dev
 * only — no key needed to see verification/reset links locally). Set
 * EMAIL_FROM to a verified sender; defaults to Resend's unverified-domain
 * test sender, which only delivers to the account's own registered address.
 */
export async function sendMail({ to, subject, html }: SendMailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[mail:dev] To: ${to}\nSubject: ${subject}\n${html}\n`);
    return;
  }

  cachedResend ??= new Resend(apiKey);
  const from = process.env.EMAIL_FROM ?? "Career Copilot <onboarding@resend.dev>";

  const { error } = await cachedResend.emails.send({ from, to, subject, html });
  if (error) {
    throw new Error(`Failed to send email via Resend: ${error.message}`);
  }
}
