"use client";

import { useState } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { forgotPassword } from "@/app/services/api";
import { AuthHeading, AuthLayout, Field, FormError, SubmitButton } from "@/app/components/auth/AuthLayout";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Enter the email you signed up with.");
      return;
    }
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch (caught) {
      const err = caught as { response?: { status?: number; data?: { message?: string } } };
      if (err?.response?.status === 429) setError("Too many requests. Wait a few minutes and try again.");
      else if (!navigator.onLine) setError("You appear to be offline. Check your connection.");
      else setError(err?.response?.data?.message ?? "Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  return (
    <AuthLayout
      art="/art/hands.webp"
      artAlt="A human hand and a robotic hand reaching toward each other, painted on cracked plaster"
      quote={{ title: "Locked out? It happens.", text: "We'll email you a link to choose a new password. Everything you saved stays right where it is." }}
    >
      {sent ? (
        <div className="grid gap-5">
          <span className="grid size-12 place-items-center rounded-2xl bg-tertiary-container text-primary">
            <MailCheck className="size-6" />
          </span>
          <AuthHeading eyebrow="Check your inbox" title="A reset link is on its way.">
            If <b className="font-medium text-on-surface">{email.trim()}</b>{" "}has a Brainly account, you&apos;ll get an email with a link to choose a new password. It works for an hour. Nothing there after a few minutes? Check your spam folder.
          </AuthHeading>
          <button type="button" onClick={() => setSent(false)} className="w-fit text-[14px] text-on-surface-variant underline underline-offset-4 hover:text-on-surface">
            Use a different email
          </button>
        </div>
      ) : (
        <>
          <AuthHeading eyebrow="Forgot password" title="Get back into your brain.">
            Enter the email you signed up with and we&apos;ll send you a link to choose a new password. Signed up with Google? This also lets you add a password.
          </AuthHeading>
          <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
            <Field id="email" label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" autoComplete="email" />
            <FormError message={error} />
            <SubmitButton loading={loading}>Email me a reset link</SubmitButton>
          </form>
        </>
      )}

      <p className="text-center text-[14px] text-on-surface-variant">
        Remembered it?{" "}
        <Link href="/auth/signin" className="font-medium text-on-surface underline decoration-outline-variant underline-offset-4 hover:decoration-on-surface">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
