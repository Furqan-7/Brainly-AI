"use client";

import { motion } from "motion/react";
import { Brain, Search, MessageSquare, Database, Mail, Lock, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import axios from "axios";
import { jwtDecode, JwtPayload } from "jwt-decode";
import ChatPage from "@/app/chat/page";

const features = [
  {
    icon: Database,
    title: "Omni-Channel Storage",
    desc: "PDFs, YouTube links, X threads, markdown notes — all in one place.",
  },
  {
    icon: Search,
    title: "Semantic Search",
    desc: 'Find anything by concept. Ask "healthy recipes" and find that saved cooking video.',
  },
  {
    icon: MessageSquare,
    title: "Chat with Your Content",
    desc: "Ask questions, get verified answers — grounded strictly in your own data.",
  },
];

type MyTokenPayload = {
  userId: string;
  username: string;
  exp: number;
};

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleSignIn = async () => {
    const Response = await axios.post("http://localhost:3001/signin", {
      email,
      password
    });

    if (Response.data.success) {
      localStorage.setItem("token", Response.data.token);
      const user = jwtDecode<MyTokenPayload>(Response.data.token);
      const username = user.username;
      router.push("/chat");
    } else {
      alert("Invalid credentials");
    }
  };






  return (
    <div className="min-h-screen bg-background text-on-surface font-body flex overflow-hidden">

      {/* ── LEFT SIDE ── */}
      <section className="hidden lg:flex w-1/2 relative flex-col justify-between p-10 bg-surface overflow-hidden border-r border-outline-variant/10">

        {/* Atmospheric background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_40%,rgba(51,102,255,0.15)_0%,transparent_65%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_75%,rgba(201,190,255,0.06)_0%,transparent_60%)]" />
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
            <h1 className="text-2xl font-black tracking-tight leading-[1.15] text-on-surface mb-3">
              Your second brain,{" "}
              <span className="text-primary-container">ready when you are.</span>
            </h1>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Everything you've ever saved — links, videos, documents, notes — organized,
              understood, and ready to answer your questions.
            </p>
          </div>

          {/* Feature list */}
          <ul className="space-y-3">
            {features.map((f, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.15, duration: 0.5 }}
                className="flex items-start gap-3"
              >
                <div className="mt-0.5 w-7 h-7 rounded-lg bg-primary-container/10 flex items-center justify-center text-primary-container shrink-0">
                  <f.icon className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="font-bold text-xs text-on-surface">{f.title}</p>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed">{f.desc}</p>
                </div>
              </motion.li>
            ))}
          </ul>

          {/* Social proof bar */}
          <div className="bg-surface-container-low border border-outline-variant/15 rounded-xl p-4 flex items-center gap-4">
            <div className="flex -space-x-2 shrink-0">
              {["bg-primary-container", "bg-secondary", "bg-surface-container-highest"].map((bg, i) => (
                <div key={i} className={`w-7 h-7 rounded-full border-2 border-surface ${bg}`} />
              ))}
            </div>
            <div>
              <p className="text-xs font-bold text-on-surface">12,000+ creators</p>
              <p className="text-[10px] text-on-surface-variant">already using their second brain</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="relative z-10 flex gap-8">
          {[
            { value: "99.8%", label: "Accuracy Rate" },
            { value: "12M+", label: "Insights Generated" },
          ].map((s, i) => (
            <div key={i} className="flex flex-col">
              <span className="text-xl font-black text-on-surface">{s.value}</span>
              <span className="text-[9px] uppercase tracking-widest text-on-surface-variant">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── RIGHT SIDE: Sign In Form ── */}
      <section className="w-full lg:w-1/2 bg-surface-container-lowest flex items-center justify-center p-6 md:p-10 lg:p-14 relative">

        {/* Mobile Logo */}
        <div className="absolute top-6 left-6 lg:hidden flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary-container" fill="currentColor" />
          <span className="text-lg font-black tracking-tighter text-on-surface">Brainly AI</span>
        </div>

        <div className="w-full max-w-sm space-y-5">
          {/* Header */}
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-on-surface">Welcome Back</h2>
            <p className="text-xs text-on-surface-variant">Enter your credentials to access your knowledge base.</p>
          </div>

          {/* Social Auth */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Google", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAS2bE30DRVc_U8MCOZJtaGLcKcseBynd3Bhp1HzJcdSEIHy2S9EWh0M5McTJPkjAxRno0B71Rx_yrt4AHCZJ5E8odLfrWfmxW3wKdubwunIZ2XVV8qnWTvcXk7GyjxmuKUQO6bKcqFbE5LKxd6hY8AD3iSKB4fQzviz7_66oPa69-3n6MXSpP_jnpRahatInDTj-ItvSvGH2U96CW7HFkc3dcg3kCNbZuCJSZ6oNsVnwXcNShlALNvUVGfpll72mtX4KKpa2szgXF0", invert: false },
              { label: "GitHub", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAk0nSh-e2wzQ7B9LrPuKCpj5SRDbMRWiDXIknF8QyQHGWknrgZZZWGESPbZdnMfIAXx246zjm7tAXHgqN9wy2FuTxnoseLJdK0kiY0HEbHMXgy4TCQldTQJGTMd8AqCPJ4Qc_LmE8EegpDGtywIJmYrrij2_rayZKGhIX1FW89PJ7SzHhL2FPAeFj49YKP7Bflxi-8Cql5Ba6I0I5YPX0T2bVksJK0tHetDm9N1_I-lzNHp5I8xXdQ-sc9Rw20B6_GwmIxU0nfMRY2", invert: true },
            ].map((btn) => (
              <button
                key={btn.label}
                className="flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-lg border border-outline-variant/20 bg-surface-container hover:bg-surface-container-high transition-all active:scale-[0.98] cursor-pointer"
              >
                <img src={btn.img} alt={btn.label} className={`w-4 h-4 ${btn.invert ? "invert" : ""}`} />
                <span className="text-sm font-medium">{btn.label}</span>
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="relative flex items-center gap-3">
            <div className="flex-grow h-px bg-outline-variant/20" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold shrink-0">Or continue with</span>
            <div className="flex-grow h-px bg-outline-variant/20" />
          </div>

          {/* Form fields */}
          <div className="space-y-4">
            {/* Email */}
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant ml-1">
                Email Address
              </label>
              <div className="relative group">
                <input onChange={(e) => {
                  setEmail(e.target.value);
                }}
                  type="email"
                  placeholder="name@company.com"
                  className="w-full bg-surface-container-low border border-outline-variant/20 rounded-lg px-4 py-3 pr-10 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary-container focus:border-transparent outline-none transition-all"
                />
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/40 group-focus-within:text-primary-container transition-colors" />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">
                  Password
                </label>
                <a href="#" className="text-[10px] font-semibold text-primary hover:text-primary-container transition-colors">
                  Forgot?
                </a>
              </div>
              <div className="relative group">
                <input onChange={(e) => {
                  setPassword(e.target.value);
                }}
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-surface-container-low border border-outline-variant/20 rounded-lg px-4 py-3 pr-10 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary-container focus:border-transparent outline-none transition-all"
                />
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/40 group-focus-within:text-primary-container transition-colors" />
              </div>
            </div>

            {/* Submit */}
            <button onClick={handleSignIn} className="w-full bg-primary-container text-on-primary-container font-bold py-3 rounded-lg text-sm shadow-lg shadow-primary-container/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer">
              Sign In
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Sign up link */}
          <div className="text-center">
            <p className="text-xs text-on-surface-variant">
              Don't have an account?{" "}
              <button onClick={() => {
                router.push("/auth/signup");
              }} className="text-primary font-bold hover:underline underline-offset-4 transition-colors">
                Sign up
              </button>
            </p>
          </div>

          {/* Footer links */}
          <div className="pt-4 flex justify-center gap-6">
            {["Privacy Policy", "Terms", "Support"].map((l) => (
              <a key={l} className="text-[10px] uppercase tracking-widest text-on-surface-variant/50 hover:text-on-surface transition-colors">
                {l}
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}