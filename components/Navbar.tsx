"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../lib/auth-context";
import { Home, Compass, User, LogOut, Menu, X, Shield, Briefcase, CheckCircle } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getDashboardLink = () => {
    if (!user) return "/auth/login";
    if (user.role === "ADMIN") return "/dashboard/admin";
    if (user.role === "AGENT") return "/dashboard/agent";
    return "/dashboard/user";
  };

  const navLinks = [
    { label: "Home", href: "/", icon: Home },
    { label: "Properties", href: "/properties", icon: Compass },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/75 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <span className="bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
                NESTORA
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-6">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? "text-emerald-400 font-semibold"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}

            {user && (
              <Link
                href={getDashboardLink()}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
                  pathname.startsWith("/dashboard")
                    ? "text-emerald-400 font-semibold"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {user.role === "ADMIN" && <Shield className="h-4 w-4 text-rose-400" />}
                {user.role === "AGENT" && <Briefcase className="h-4 w-4 text-cyan-400" />}
                {user.role === "USER" && <User className="h-4 w-4 text-emerald-400" />}
                Dashboard
              </Link>
            )}
          </div>

          {/* User Auth Buttons / Profile */}
          <div className="hidden md:flex md:items-center md:gap-4">
            {user ? (
              <div className="flex items-center gap-3 border-l border-zinc-800 pl-4">
                <img
                  src={user.imageUrl}
                  alt={user.name}
                  className="h-9 w-9 rounded-full border border-emerald-500/50 object-cover"
                />
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium text-zinc-100">{user.name}</span>
                    {user.role === "AGENT" && user.isVerified && (
                      <CheckCircle className="h-3.5 w-3.5 fill-emerald-500 text-zinc-950" />
                    )}
                  </div>
                  <span className="text-xs font-semibold text-zinc-500 tracking-wider">
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="ml-2 flex items-center justify-center rounded-full p-2 text-zinc-400 hover:bg-zinc-900 hover:text-rose-400 transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-zinc-100 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  href="/auth/register"
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 transition-colors"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center rounded-md p-2 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-zinc-900 bg-zinc-950 px-4 py-3 space-y-2 md:hidden">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-base font-medium transition-colors ${
                  isActive(link.href)
                    ? "bg-zinc-900 text-emerald-400"
                    : "text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200"
                }`}
              >
                <Icon className="h-5 w-5" />
                {link.label}
              </Link>
            );
          })}
          {user && (
            <Link
              href={getDashboardLink()}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-base font-medium transition-colors ${
                pathname.startsWith("/dashboard")
                  ? "bg-zinc-900 text-emerald-400"
                  : "text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200"
              }`}
            >
              {user.role === "ADMIN" ? (
                <Shield className="h-5 w-5 text-rose-400" />
              ) : user.role === "AGENT" ? (
                <Briefcase className="h-5 w-5 text-cyan-400" />
              ) : (
                <User className="h-5 w-5 text-emerald-400" />
              )}
              Dashboard
            </Link>
          )}

          <div className="border-t border-zinc-900 pt-3">
            {user ? (
              <div className="flex items-center justify-between px-3 py-2">
                <div className="flex items-center gap-3">
                  <img
                    src={user.imageUrl}
                    alt={user.name}
                    className="h-10 w-10 rounded-full object-cover border border-emerald-500/50"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-zinc-200">{user.name}</span>
                    <span className="text-xs font-semibold text-zinc-500 tracking-wider">
                      {user.role}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-rose-400 hover:bg-rose-950/20"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 px-3 pt-1">
                <Link
                  href="/auth/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center rounded-md border border-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-900"
                >
                  Log In
                </Link>
                <Link
                  href="/auth/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
