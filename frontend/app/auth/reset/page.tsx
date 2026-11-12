"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { resetPassword } from "@/app/services/api";
import { AuthHeading, AuthLayout, Field, FormError, SubmitButton } from "@/app/components/auth/AuthLayout";

function ResetForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [expired, setExpired] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!token || expired) {
    return (
      <>
        <AuthHeading eyebrow="Reset password" title="This link doesn't work any more.">
          Reset links work for an hour, and only once. Ask for a new one and use the latest email.
        </AuthHeading>
        <Link href="/auth/forgot" className="rounded-xl flex h-[52px] w-full items-center justify-center bg-primary-container text-[15.5px] font-medium text-white transition-colors hover:bg-black">
          Send a new link
        </Link>
      </>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) return setError("Use at least 6 characters.");
    if (password !== confirm) return setError("The two passwords don't match.");
    setLoading(true);
    try {
      await resetPassword(token, password);
      // Signed in by the server; every other session was signed out
      router.replace("/chat");
      return;
    } catch (caught) {
      const err = caught as { response?: { status?: number; data?: { message?: string } } };
      const status = err?.response?.status;
      if (status === 400) setExpired(true);
      else if (status === 429) setError("Too many attempts. Wait a few minutes and try again.");
      else if (!navigator.onLine) setError("You appear to be offline. Check your connection.");
      else setError(err?.response?.data?.message ?? "Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  return (
    <>
      <AuthHeading eyebrow="Reset password" title="Choose a new password.">
        You&apos;ll be signed in straight away. Any other browsers and the extension are signed out, so sign them in again with the new password.
      </AuthHeading>
      <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
        <Field id="password" label="New password" type="password" value={password} onChange={setPassword} placeholder="At least 6 characters" autoComplete="new-password" />
        <Field id="confirm" label="Type it again" type="password" value={confirm} onChange={setConfirm} placeholder="Same password" autoComplete="new-password" />
        <FormError message={error} />
        <SubmitButton loading={loading}>Save and sign in</SubmitButton>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthLayout
      art="/art/hands.webp"
      artAlt="A human hand and a robotic hand reaching toward each other, painted on cracked plaster"
      quote={{ title: "Almost back in.", text: "Pick something you'll remember. Everything you saved is still here." }}
    >
      <Suspense>
        <ResetForm />
      </Suspense>
    </AuthLayout>
  );
}
