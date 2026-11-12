import nodemailer, { Transporter } from "nodemailer";
import { log } from "./logger";

/**
 * Sends account emails (verify your email, reset your password).
 *
 *   RESEND_API_KEY  → sent through Resend (https://resend.com, free tier: 3,000 emails a month)
 *   SMTP_URL        → any SMTP server, e.g. smtps://you%40gmail.com:app-password@smtp.gmail.com:465
 *   neither         → nothing is sent; outside production the email is printed to the log so
 *                     the links can be opened during local development
 *
 * EMAIL_FROM sets the sender, e.g. "Brainly <hello@brainlyai.me>" (the domain must be verified
 * with Resend; with Gmail SMTP it must be your Gmail address).
 */

export interface Email {
    to: string;
    subject: string;
    text: string;
    html: string;
}

export function emailProvider(): "resend" | "smtp" | null {
    if (process.env.RESEND_API_KEY) return "resend";
    if (process.env.SMTP_URL) return "smtp";
    return null;
}

function fromAddress(): string {
    if (process.env.EMAIL_FROM) return process.env.EMAIL_FROM;
    if (emailProvider() === "smtp") {
        try {
            const user = decodeURIComponent(new URL(process.env.SMTP_URL!).username);
            if (user.includes("@")) return `Brainly <${user}>`;
        } catch { /* fall through */ }
    }
    // Resend's shared test sender: only delivers to your own Resend account's email
    return "Brainly <onboarding@resend.dev>";
}

let smtp: Transporter | null = null;

async function sendWithResend(email: Email) {
    const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: fromAddress(), to: [email.to], subject: email.subject, text: email.text, html: email.html }),
        signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`Resend responded ${res.status}: ${(await res.text()).slice(0, 300)}`);
}

async function sendWithSmtp(email: Email) {
    smtp ??= nodemailer.createTransport(process.env.SMTP_URL!);
    await smtp.sendMail({ from: fromAddress(), to: email.to, subject: email.subject, text: email.text, html: email.html });
}

/** Sends an email. Throws when the provider refuses it. */
export async function sendEmail(email: Email): Promise<void> {
    const provider = emailProvider();
    if (provider === "resend") return sendWithResend(email);
    if (provider === "smtp") return sendWithSmtp(email);

    if (process.env.NODE_ENV === "production") {
        log("error", "email not sent: set RESEND_API_KEY or SMTP_URL", { subject: email.subject });
    } else {
        log("info", "email (not sent: no RESEND_API_KEY or SMTP_URL)", { to: email.to, subject: email.subject, text: email.text });
    }
}

/** Sends in the background, so the response doesn't wait for the email (or reveal anything by timing). */
export function sendEmailLater(email: Email): void {
    sendEmail(email).catch((error) => log("error", "email failed", { subject: email.subject, error: error instanceof Error ? error.message : String(error) }));
}
