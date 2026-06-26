import { randomBytes } from "crypto";
import { sendEmail, getSiteUrl } from "@/lib/email";
import { prisma } from "@/lib/db";
import { isProductionDeploy } from "@/lib/production";

export function createVerificationToken() {
  return randomBytes(32).toString("hex");
}

export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${getSiteUrl()}/api/auth/verify-email?token=${encodeURIComponent(token)}`;

  await sendEmail({
    to: email,
    subject: "Verify your Shorty email",
    text: `Welcome to Shorty!\n\nVerify your email to unlock full streaming access:\n${verifyUrl}\n\nThis link expires in 24 hours.`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#111">
        <h2 style="color:#ff7a18">Welcome to Shorty</h2>
        <p>Verify your email to unlock full streaming access.</p>
        <p><a href="${verifyUrl}" style="display:inline-block;background:#ff7a18;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">Verify email</a></p>
        <p style="color:#666;font-size:13px">Link expires in 24 hours.</p>
      </div>
    `,
  });
}

export async function issueEmailVerification(userId: string, email: string) {
  const token = createVerificationToken();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: userId },
    data: {
      emailVerificationToken: token,
      emailVerificationExpiresAt: expires,
    },
  });

  await sendVerificationEmail(email, token);
}

export async function verifyEmailToken(token: string) {
  const user = await prisma.user.findFirst({
    where: {
      emailVerificationToken: token,
      emailVerificationExpiresAt: { gt: new Date() },
    },
    select: { id: true },
  });

  if (!user) return false;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpiresAt: null,
    },
  });

  return true;
}

export function requiresEmailVerification(emailVerified: boolean) {
  if (!isProductionDeploy()) return false;
  return !emailVerified;
}

export async function sendWelcomeEmail(email: string, username: string) {
  await sendEmail({
    to: email,
    subject: "Welcome to Shorty — your trial is active",
    text: `Hi ${username},\n\nYour 7-day free trial is active. Start watching at ${getSiteUrl()}/browse\n\nEnjoy curated short films under 25 minutes.`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#111">
        <h2 style="color:#ff7a18">Welcome, ${username}!</h2>
        <p>Your 7-day free trial is active. Start watching curated short films today.</p>
        <p><a href="${getSiteUrl()}/browse" style="display:inline-block;background:#ff7a18;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">Start watching</a></p>
      </div>
    `,
  });
}

export async function sendTrialEndingEmail(email: string, username: string, daysLeft: number) {
  await sendEmail({
    to: email,
    subject: `Your Shorty trial ends in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`,
    text: `Hi ${username},\n\nYour free trial ends soon. Choose a plan to keep watching: ${getSiteUrl()}/subscription`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#111">
        <h2 style="color:#ff7a18">Trial ending soon</h2>
        <p>Hi ${username}, your free trial ends in ${daysLeft} day${daysLeft === 1 ? "" : "s"}.</p>
        <p><a href="${getSiteUrl()}/subscription" style="display:inline-block;background:#ff7a18;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">Choose a plan</a></p>
      </div>
    `,
  });
}
