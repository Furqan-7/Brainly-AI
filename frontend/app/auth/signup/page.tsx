"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getMe, signup } from "@/app/services/api";
import { AuthHeading, AuthLayout, Field, FormError, GoogleButton, OrDivider, SubmitButton } from "@/app/components/auth/AuthLayout";

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Already signed in? Go straight to the app.
  useEffect(() => {
    getMe().then(() => router.replace("/chat")).catch(() => undefined);
  }, [router]);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await signup(username, email, password);
      if (data.success) {
        // The session lives in an httpOnly cookie set by the server
        router.replace("/chat");
        return;
      }
    } catch (caught) {
      const err = caught as { response?: { status?: number; data?: { message?: string } } };
      const status = err?.response?.status;
      if (status === 400) setError("An account with this email already exists. Try signing in.");
      else if (status === 411) setError("Check your details: a name of 3–20 characters, a valid email, and a password of at least 6 characters.");
      else if (status === 429) setError("Too many attempts. Wait a few minutes and try again.");
      else if (!navigator.onLine) setError("You appear to be offline. Check your connection.");
      else setError(err?.response?.data?.message ?? "Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  return (
    <AuthLayout
      art="/art/statue-tree.webp"
      artAlt="Collage of a marble head with an olive tree growing from it, in front of a coral sun"
      artSide="left"
      quote={{ title: "Let your ideas take root.", text: "Save what inspires you today. Brainly reads it, so it's there the moment you need it." }}
    >
      <AuthHeading eyebrow="Create your brain" title="Remember everything you save.">
        Free to start, no card needed. Takes about ten seconds.
      </AuthHeading>

      <GoogleButton label="Sign up with Google" />
      <OrDivider />

      <form onSubmit={handleCreateAccount} className="grid gap-4" noValidate>
        <Field id="username" label="Name" value={username} onChange={setUsername} placeholder="What should we call you?" autoComplete="nickname" hint="3–20 characters" />
        <Field id="email" label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" autoComplete="email" />
        <Field id="password" label="Password" type="password" value={password} onChange={setPassword} placeholder="At least 6 characters" autoComplete="new-password" />
        <FormError message={error} />
        <SubmitButton loading={loading}>Create your brain</SubmitButton>
      </form>

      <p className="text-center text-[14px] text-on-surface-variant">
        Already have one?{" "}
        <Link href="/auth/signin" className="font-medium text-on-surface underline decoration-outline-variant underline-offset-4 hover:decoration-on-surface">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
