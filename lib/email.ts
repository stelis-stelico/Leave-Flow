import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = process.env.EMAIL_FROM ?? "LeaveFlow <noreply@leaveflow.app>";

interface SendEmailOptions {
  to:      string | string[];
  subject: string;
  html:    string;
}

/**
 * Send an email via Resend.
 * Fails silently in development if RESEND_API_KEY is not set —
 * logs the email to the console instead.
 */
export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    // Dev mode — print to console instead of sending
    console.log("📧 [EMAIL - DEV MODE]");
    console.log("  To:", to);
    console.log("  Subject:", subject);
    console.log("  (Set RESEND_API_KEY to send real emails)");
    return;
  }

  try {
    const { error } = await resend.emails.send({
      from:    FROM,
      to:      Array.isArray(to) ? to : [to],
      subject,
      html,
    });

    if (error) {
      console.error("Resend error:", error);
    }
  } catch (err) {
    // Never let email failures crash the main flow
    console.error("Email send failed:", err);
  }
}

/**
 * Send to multiple recipients concurrently.
 */
export async function sendEmailToMany(
  recipients: string[],
  subject: string,
  html: string
): Promise<void> {
  if (!recipients.length) return;
  await Promise.allSettled(
    recipients.map((to) => sendEmail({ to, subject, html }))
  );
}
