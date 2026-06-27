"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../lib/auth-context";
import { KeyRound, Mail, AlertCircle, ArrowRight, ShieldCheck, Briefcase, User } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email || !password) {
      setErrorMsg("Email and password are required.");
      return;
    }

    setIsPending(true);
    const result = await login({ email, password });
    setIsPending(false);

    if (result.success) {
      // Re-route based on profile roles
      router.push("/properties");
    } else {
      setErrorMsg(result.message);
    }
  };

  // Autofill helpers for evaluation
  const handleAutofill = (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
    setErrorMsg("");
  };

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-8 backdrop-blur-sm shadow-xl">
        {/* Header */}
        <div className="text-center">
          <span className="bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
            NESTORA
          </span>
          <h2 className="mt-4 text-xl font-bold tracking-tight text-zinc-100">
            Sign in to your account
          </h2>
          <p className="mt-2 text-xs text-zinc-500">
            Or{" "}
            <Link href="/auth/register" className="font-semibold text-emerald-400 hover:text-emerald-300">
              create a new account
            </Link>
          </p>
        </div>

        {/* Autofill Demo Section */}
        <div className="rounded-xl bg-zinc-950/60 p-4 border border-zinc-900 space-y-2">
          <span className="block text-2xs font-bold uppercase tracking-wider text-zinc-500">
            Quick-Login Demo Accounts
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleAutofill("admin@nestora.com", "admin123")}
              className="flex flex-col items-center justify-center rounded-lg border border-rose-950/20 bg-rose-950/10 p-2 text-3xs font-bold text-rose-400 hover:bg-rose-950/25 transition-all"
            >
              <ShieldCheck className="h-4 w-4 mb-1" />
              Admin
            </button>
            <button
              onClick={() => handleAutofill("agent@nestora.com", "agent123")}
              className="flex flex-col items-center justify-center rounded-lg border border-cyan-950/20 bg-cyan-950/10 p-2 text-3xs font-bold text-cyan-400 hover:bg-cyan-950/25 transition-all"
            >
              <Briefcase className="h-4 w-4 mb-1" />
              Agent
            </button>
            <button
              onClick={() => handleAutofill("user@nestora.com", "user123")}
              className="flex flex-col items-center justify-center rounded-lg border border-emerald-950/20 bg-emerald-950/10 p-2 text-3xs font-bold text-emerald-400 hover:bg-emerald-950/25 transition-all"
            >
              <User className="h-4 w-4 mb-1" />
              Buyer
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute top-3.5 left-3.5 h-4.5 w-4.5 text-zinc-500" />
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-3 pr-4 pl-11 text-sm text-zinc-100 placeholder-zinc-700 focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                Password
              </label>
              <div className="relative">
                <KeyRound className="absolute top-3.5 left-3.5 h-4.5 w-4.5 text-zinc-500" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-3 pr-4 pl-11 text-sm text-zinc-100 placeholder-zinc-700 focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-950/20 border border-rose-900/40 p-3 text-sm text-rose-400">
              <AlertCircle className="h-4.5 w-4.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="group relative flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-md hover:bg-emerald-500 transition-colors disabled:opacity-50"
          >
            {isPending ? "Signing In..." : "Sign In"}
            {!isPending && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}
