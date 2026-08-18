"use client";
import { motion } from "motion/react";
import { Brain, Search, MessageSquare, Database, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import axios from "axios";


const features = [
  {
    icon: Database,
    title: "Omni-Channel Storage",
    desc: "Save PDFs, YouTube links, X threads, and markdown notes — all in one place.",
  },
  {
    icon: Search,
    title: "Semantic Search",
    desc: 'Find anything by concept, not keywords. Ask "healthy recipes" and find that cooking video.',
  },
  {
    icon: MessageSquare,
    title: "Chat with Your Content",
    desc: '"What were the 3 main points in that video?" — get verified answers from your own data.',
  },
];

const stats = [
  { value: "99.8%", label: "Accuracy Rate" },
  { value: "12M+", label: "Insights Generated" },
];

export default function SignupPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCreateAccount = async () => {
    setError("");
    setLoading(true);
    try {
      const Response = await axios.post(`${process.env.NEXT_PUBLIC_API}/signup`, {
        username,
        email,
        password
      });

      if (Response.data.success) {
        localStorage.setItem("token", Response.data.token);
        localStorage.setItem("username", Response.data.username);
        router.push(`/chat`);
      }
    } catch (err: any) {
      const status = err?.response?.status;
      const serverMsg = err?.response?.data?.message;

      if (status === 400) {
        setError("An account with this email already exists. Try signing in.");
      } else if (status === 411) {
        setError("Please check your inputs: username (3–20 chars), valid email, password (min 6 chars).");
      } else if (!navigator.onLine) {
        setError("You appear to be offline. Check your connection.");
      } else {
        setError(serverMsg ?? "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  const handleOAuth = async (provider: string) => {
    if (provider == "Google") {
      provider = "google"
    }
    else {
      provider = "github"
    }
    window.location.href = `${process.env.NEXT_PUBLIC_API}/auth/${provider}`;
  }


  return (
    <div className="min-h-screen bg-background text-on-surface font-body flex overflow-hidden">

      {/* ── LEFT SIDE ── */}
      <section className="hidden lg:flex w-1/2 relative flex-col justify-between p-10 bg-surface overflow-hidden">

        {/* Atmospheric background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_30%,rgba(51,102,255,0.18)_0%,transparent_65%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_80%,rgba(201,190,255,0.07)_0%,transparent_60%)]" />
          {/* subtle dot grid */}
          <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:28px_28px]" />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary-container" />
          <span className="text-lg font-black tracking-tighter text-on-surface">Brainly AI</span>
        </div>

        {/* Main copy */}
        <div className="relative z-10 max-w-md space-y-6">
          <div>
            <div className="mb-4 h-0.5 w-8 bg-primary-container rounded-full" />
            <h1 className="text-2xl font-black tracking-tight leading-[1.1] text-on-surface mb-3">
              Stop losing your saved content to{" "}
              <span className="text-primary-container">digital black holes.</span>
            </h1>
            <p className="text-on-surface-variant leading-relaxed text-xs">
              Links saved to WhatsApp, bookmarks buried in folders, PDFs you'll "read later" —
              Brainly turns scattered information into an intelligent second brain you can
              actually talk to.
            </p>
          </div>

          {/* Feature list */}
          <ul className="space-y-5">
            {features.map((f, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.15, duration: 0.5 }}
                className="flex items-start gap-4"
              >
                <div className="mt-0.5 w-9 h-9 rounded-lg bg-primary-container/10 flex items-center justify-center text-primary-container shrink-0">
                  <f.icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-sm text-on-surface">{f.title}</p>
                  <p className="text-xs text-on-surface-variant leading-relaxed">{f.desc}</p>
                </div>
              </motion.li>
            ))}
          </ul>

          {/* Problem → Fix callout */}
          <div className="bg-surface-container-low border border-outline-variant/15 rounded-xl p-5 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary-container">
              The Brainly Fix
            </p>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Brainly doesn't just <span className="text-on-surface font-medium">store</span> data —
              it <span className="text-on-surface font-medium">understands</span> it. No more
              scrolling through months of chat history. Just ask.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="relative z-10 flex gap-10">
          {stats.map((s, i) => (
            <div key={i} className="flex flex-col">
              <span className="text-2xl font-black text-on-surface">{s.value}</span>
              <span className="text-[10px] uppercase tracking-widest text-on-surface-variant">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── RIGHT SIDE: Signup Form (unchanged) ── */}
      <section className="w-full lg:w-1/2 bg-surface-container-low flex items-center justify-center p-8 md:p-16 lg:p-24 relative">

        {/* Mobile Logo */}
        <div className="absolute top-8 left-8 lg:hidden flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary-container" fill="currentColor" />
          <span className="text-xl font-black tracking-tighter text-on-surface">Brainly AI</span>
        </div>

        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2">
            <h2 className="text-4xl font-bold tracking-tight text-on-surface">Create Account</h2>
            <p className="text-on-surface-variant text-sm">Join the next generation of precision AI users.</p>
          </div>



          {/* Social Auth */}
          <div className="grid grid-cols-1 gap-4 rounded-[5px]">
            {[
              { label: "Google", img: "/assets/googleicon.png", invert: false },
              // { label: "GitHub", img: "/assets/githubicon.png", invert: true },
            ].map((btn) => (
              <button onClick={() => handleOAuth(btn.label)}
                key={btn.label}
                className="flex items-center justify-center gap-3 py-3 px-4 rounded-lg border border-outline-variant/20 bg-surface-container hover:bg-surface-container-high transition-all active:scale-[0.98] cursor-pointer"
              >
                <img src={btn.img} alt={btn.label} className={`w-5 h-5 ${btn.invert ? "invert" : ""}`} />
                <span className="text-sm font-medium">{btn.label}</span>
              </button>
            ))}
          </div>

          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-outline-variant/30" />
            <span className="absolute bg-surface-container-low px-4 text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">
              Or continue with email
            </span>
          </div>

          {/* Form */}
          <div className="space-y-5">
            {[
              { label: "Full Name", type: "text", placeholder: "Johnathan Doe" },
              { label: "Work Email", type: "email", placeholder: "name@company.com" },
              { label: "Password", type: "password", placeholder: "••••••••" },
            ].map((field) => (
              <div key={field.label} className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant ml-1">
                  {field.label}
                </label>
                <input onChange={(e) => {
                  if (field.label === "Full Name") {
                    setUsername(e.target.value);
                  }
                  else if (field.label === "Work Email") {
                    setEmail(e.target.value);
                  }
                  else if (field.label === "Password") {
                    setPassword(e.target.value);
                  }
                }}
                  type={field.type}
                  placeholder={field.placeholder}
                  className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-4 py-3.5 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary-container focus:border-transparent outline-none transition-all"
                />
              </div>
            ))}

            <div className="flex items-start gap-3 py-1">
              <input
                id="terms"
                type="checkbox"
                className="mt-1 rounded bg-surface-container-lowest border-outline-variant/20 text-primary-container focus:ring-primary-container"
              />
              <label htmlFor="terms" className="text-sm text-on-surface-variant leading-relaxed">
                I agree to the{" "}
                <a href="#" className="text-primary hover:underline">Terms of Service</a> and{" "}
                <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
              </label>
            </div>

            {/* Inline error */}
            {error && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            <button
              onClick={handleCreateAccount}
              disabled={loading}
              className="w-full bg-primary-container text-on-primary-container font-bold py-4 rounded-lg shadow-lg shadow-primary-container/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account…
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-on-surface-variant">
              Already have an account?{" "}
              <button onClick={() => router.push("/auth/signin")} className="text-primary font-semibold hover:underline transition-colors">
                Log in
              </button>
            </p>
          </div>
        </div>

        {/* Footer links */}
        <div className="absolute bottom-8 flex gap-6 text-[10px] uppercase tracking-widest text-on-surface-variant/50">
          {["Privacy Policy", "Terms of Service", "Security", "Status"].map((l) => (
            <a key={l} href="#" className="hover:text-primary transition-colors">{l}</a>
          ))}
        </div>
      </section>
    </div>
  );
}