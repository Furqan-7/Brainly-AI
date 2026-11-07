"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { afterSignIn } from "@/app/hooks/useAuth";
import { getMe, signin } from "@/app/services/api";
import { AuthHeading, AuthLayout, Field, FormError, GoogleButton, OrDivider, SubmitButton } from "@/app/components/auth/AuthLayout";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Already signed in? Go straight to the app.
  useEffect(() => {
    getMe().then(() => router.replace(afterSignIn())).catch(() => undefined);
  }, [router]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await signin(email, password);
      if (data.success) {
        // The session lives in an httpOnly cookie set by the server
        router.replace(afterSignIn());
        return;
      }
    } catch (caught) {
      const err = caught as { response?: { status?: number; data?: { message?: string } } };
      const status = err?.response?.status;
      if (status === 400) setError("No account found with that email address.");
      else if (status === 402) setError("Incorrect password. Please try again.");
      else if (status === 411) setError("Enter a valid email and a password of at least 6 characters.");
      else if (status === 429) setError("Too many attempts. Wait a few minutes and try again.");
      else if (!navigator.onLine) setError("You appear to be offline. Check your connection.");
      else setError(err?.response?.data?.message ?? "Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  return (
    <AuthLayout
      art="/art/hands.webp"
      artAlt="A human hand and a robotic hand reaching toward each other, painted on cracked plaster"
      quote={{ title: "Welcome back to your brain.", text: "Everything you saved is still here, waiting for the question that brings it back." }}
    >
      <AuthHeading eyebrow="Sign in" title="Pick up where you left off.">
        Sign in to ask your saved reels, videos, links and notes anything.
      </AuthHeading>

      <GoogleButton label="Continue with Google" />
      <OrDivider />

      <form onSubmit={handleSignIn} className="grid gap-4" noValidate>
        <Field id="email" label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" autoComplete="email" />
        <Field id="password" label="Password" type="password" value={password} onChange={setPassword} placeholder="Your password" autoComplete="current-password" />
        <FormError message={error} />
        <SubmitButton loading={loading}>Sign in</SubmitButton>
      </form>

      <p className="text-center text-[14px] text-on-surface-variant">
        New to Brainly?{" "}
        <Link href="/auth/signup" className="font-medium text-on-surface underline decoration-outline-variant underline-offset-4 hover:decoration-on-surface">
          Create your brain
        </Link>
      </p>
    </AuthLayout>
  );
}
