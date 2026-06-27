"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../lib/auth-context";
import { User, Briefcase, Mail, KeyRound, UserPlus, AlertCircle, CheckCircle, ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"USER" | "AGENT">("USER");
  const [imageUrl, setImageUrl] = useState("");
  
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (name.length < 3) {
      setErrorMsg("Name must be at least 3 characters long.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    setIsPending(true);
    const result = await register({
      name,
      email,
      password,
      role,
      imageUrl: imageUrl.trim() || undefined,
    });
    setIsPending(false);

    if (result.success) {
      setSuccessMsg("Account registered successfully! Redirecting to login...");
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    } else {
      setErrorMsg(result.message);
    }
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
            Create your account
          </h2>
          <p className="mt-2 text-xs text-zinc-500">
            Already have an account?{" "}
            <Link href="/auth/login" className="font-semibold text-emerald-400 hover:text-emerald-300">
              Sign In
            </Link>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {/* Role selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
              I want to join as:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("USER")}
                className={`flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold transition-all ${
                  role === "USER"
                    ? "border-emerald-500 bg-emerald-950/20 text-emerald-400"
                    : "border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                <User className="h-4 w-4" />
                Buyer / Client
              </button>
              <button
                type="button"
                onClick={() => setRole("AGENT")}
                className={`flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold transition-all ${
                  role === "AGENT"
                    ? "border-emerald-500 bg-emerald-950/20 text-emerald-400"
                    : "border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                <Briefcase className="h-4 w-4" />
                Real-Estate Agent
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-700 focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-700 focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                Password
              </label>
              <input
                type="password"
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-700 focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>

            {/* Profile Image URL */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                Profile Image URL (Optional)
              </label>
              <input
                type="url"
                placeholder="https://example.com/avatar.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-700 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-950/20 border border-rose-900/40 p-3 text-sm text-rose-400">
              <AlertCircle className="h-4.5 w-4.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-950/20 border border-emerald-900/40 p-3 text-sm text-emerald-400">
              <CheckCircle className="h-4.5 w-4.5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="group relative flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-md hover:bg-emerald-500 transition-colors disabled:opacity-50"
          >
            {isPending ? "Creating Account..." : "Create Account"}
            {!isPending && <UserPlus className="h-4 w-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}
