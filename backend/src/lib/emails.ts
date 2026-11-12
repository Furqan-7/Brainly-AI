import type { Email } from "./mailer";
import { RESET_LINK_MINUTES } from "./auth";

const escape = (s: string) =>
    s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** A plain, single-button email that reads well in every mail app (and as plain text). */
function layout({ to, subject, greeting, lines, button, link, footer }: {
    to: string; subject: string; greeting: string; lines: string[]; button: string; link: string; footer: string;
}): Email {
    const text = [greeting, "", ...lines, "", `${button}: ${link}`, "", footer, "", "— Brainly"].join("\n");
    const html = `<!doctype html>
<html><body style="margin:0;padding:32px 16px;background:#f6f3ee;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1d1b18">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border:1px solid #e4ddd2;border-radius:16px;padding:32px">
      <tr><td>
        <p style="margin:0 0 24px;font-size:20px;font-weight:600">Brainly</p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.6">${escape(greeting)}</p>
        ${lines.map((l) => `<p style="margin:0 0 16px;font-size:15px;line-height:1.6">${escape(l)}</p>`).join("")}
        <p style="margin:24px 0"><a href="${escape(link)}" style="display:inline-block;background:#1d1b18;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:12px;font-size:15px">${escape(button)}</a></p>
        <p style="margin:0 0 16px;font-size:13px;line-height:1.6;color:#6b645a">Or paste this link into your browser:<br><a href="${escape(link)}" style="color:#6b645a;word-break:break-all">${escape(link)}</a></p>
        <p style="margin:0;font-size:13px;line-height:1.6;color:#6b645a">${escape(footer)}</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
    return { to, subject, text, html };
}

export function verifyEmailMessage(to: string, username: string, link: string): Email {
    return layout({
        to,
        subject: "Confirm your email for Brainly",
        greeting: `Hi ${username},`,
        lines: ["Confirm this is your email address, so you can always get back into your Brainly account."],
        button: "Confirm email",
        link,
        footer: "The link works for 3 days. Didn't sign up for Brainly? You can ignore this email.",
    });
}

export function passwordResetMessage(to: string, username: string, link: string): Email {
    return layout({
        to,
        subject: "Reset your Brainly password",
        greeting: `Hi ${username},`,
        lines: ["Someone (hopefully you) asked to reset the password for your Brainly account. Choose a new one here:"],
        button: "Choose a new password",
        link,
        footer: `The link works for ${RESET_LINK_MINUTES} minutes and only once. Didn't ask for this? Ignore this email and your password stays the same.`,
    });
}
