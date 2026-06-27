import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-zinc-900 bg-zinc-950 text-zinc-400">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2 space-y-4">
            <span className="bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
              NESTORA
            </span>
            <p className="text-sm max-w-md text-zinc-500">
              Nestora is a state-of-the-art property management platform connecting buyers, certified agents, and developers. Discover premium spaces and secure transactions easily.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">Navigation</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-emerald-400 transition-colors">Home</Link>
              </li>
              <li>
                <Link href="/properties" className="hover:text-emerald-400 transition-colors">Properties</Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">Demo Access</h3>
            <ul className="mt-4 space-y-2 text-xs text-zinc-500">
              <li>
                <span className="font-semibold text-zinc-300">Admin:</span> admin@nestora.com / admin123
              </li>
              <li>
                <span className="font-semibold text-zinc-300">Agent:</span> agent@nestora.com / agent123
              </li>
              <li>
                <span className="font-semibold text-zinc-300">User:</span> user@nestora.com / user123
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-zinc-900 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-zinc-600 gap-4">
          <p>© {new Date().getFullYear()} Nestora Real Estate Inc. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-zinc-400">Privacy Policy</a>
            <a href="#" className="hover:text-zinc-400">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
