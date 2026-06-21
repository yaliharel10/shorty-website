const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "http://localhost:3000";

type SendEmailOptions = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
  const apiKey = process.env.RESEND_API_KEY;

  if (apiKey) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "Shorty <onboarding@resend.dev>",
        to: [to],
        subject,
        html,
        text,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("[email] Resend error:", body);
      throw new Error("Failed to send email");
    }
    return;
  }

  console.log(`[Shorty email] To: ${to}`);
  console.log(`[Shorty email] Subject: ${subject}`);
  console.log(`[Shorty email] Body:\n${text}`);
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const resetUrl = `${SITE_URL}/reset-password?token=${encodeURIComponent(token)}`;

  await sendEmail({
    to,
    subject: "Reset your Shorty password",
    text: `Reset your Shorty password by visiting:\n\n${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#111">
        <h2 style="color:#ff7a18">Shorty</h2>
        <p>You requested a password reset. Click the button below — link expires in 1 hour.</p>
        <p><a href="${resetUrl}" style="display:inline-block;background:#ff7a18;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">Reset password</a></p>
        <p style="color:#666;font-size:13px">Or copy: ${resetUrl}</p>
        <p style="color:#666;font-size:13px">If you didn't request this, you can ignore this email.</p>
      </div>
    `,
  });

  return resetUrl;
}

export function getSiteUrl() {
  return SITE_URL;
}
