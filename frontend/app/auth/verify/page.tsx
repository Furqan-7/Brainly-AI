"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, Loader2, MailX } from "lucide-react";
import { errorMessage, verifyEmail } from "@/app/services/api";
import { AuthHeading, AuthLayout } from "@/app/components/auth/AuthLayout";

type State = { step: "checking" } | { step: "done"; email: string } | { step: "error"; message: string };

function Verify() {
  const token = useSearchParams().get("token") ?? "";
  const [state, setState] = useState<State>({ step: "checking" });

  useEffect(() => {
    let cancelled = false;
    const check = token ? verifyEmail(token) : Promise.reject(new Error("missing"));
    check
      .then(({ email }) => !cancelled && setState({ step: "done", email }))
      .catch((err) => !cancelled && setState({ step: "error", message: errorMessage(err, "This link is incomplete. Open it straight from the email.") }));
    return () => {
      cancelled = true;
    };
  }, [token]);

  const icon = state.step === "checking" ? <Loader2 className="size-6 animate-spin" /> : state.step === "done" ? <Check className="size-6" /> : <MailX className="size-6" />;

  return (
    <div className="grid gap-6">
      <span className="grid size-12 place-items-center rounded-2xl bg-tertiary-container text-primary">{icon}</span>
      {state.step === "checking" && <AuthHeading eyebrow="Confirm email" title="Checking your link…">One moment.</AuthHeading>}
      {state.step === "done" && (
        <AuthHeading eyebrow="Email confirmed" title="You're all set.">
          <b className="font-medium text-on-surface">{state.email}</b>{" "}is confirmed. If you ever forget your password, the reset link goes there.
        </AuthHeading>
      )}
      {state.step === "error" && <AuthHeading eyebrow="Confirm email" title="That link didn't work.">{state.message}</AuthHeading>}
      {state.step !== "checking" && (
        <Link href="/chat" className="rounded-xl flex h-[52px] w-full items-center justify-center bg-primary-container text-[15.5px] font-medium text-white transition-colors hover:bg-black">
          Go to Brainly
        </Link>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <AuthLayout
      art="/art/statue-tree.webp"
      artAlt="Collage of a marble head with an olive tree growing from it, in front of a coral sun"
      artSide="left"
      quote={{ title: "Let your ideas take root.", text: "Save what inspires you today. Brainly reads it, so it's there the moment you need it." }}
    >
      <Suspense>
        <Verify />
      </Suspense>
    </AuthLayout>
  );
}
