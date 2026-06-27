"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { motion } from "framer-motion";
import {
  Search,
  ArrowRight,
  ShieldCheck,
  Building,
  Users,
  Compass,
  Star,
  DollarSign,
  Briefcase,
  Home,
  Building2,
} from "lucide-react";

export default function HomePage() {
  // Fetch properties to show featured and latest listings
  const { data: properties = [] } = useQuery({
    queryKey: ["properties-home"],
    queryFn: async () => {
      const response = await axios.get("/api/v1/property");
      return response.data.data;
    },
  });

  // Filter verified & advertised properties for Featured
  const featuredProperties = React.useMemo(() => {
    return properties.filter((p: any) => p.isVerified && p.isAdvertised).slice(0, 3);
  }, [properties]);

  // Filter latest properties
  const latestProperties = React.useMemo(() => {
    return properties
      .filter((p: any) => p.isVerified && !p.isBought)
      .sort((a: any, b: any) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())
      .slice(0, 3);
  }, [properties]);

  return (
    <div className="w-full space-y-24 pb-20">
      {/* 1. Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950/20 via-zinc-950 to-zinc-950 py-16 px-4">
        {/* Decorative Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f29370a_1px,transparent_1px),linear-gradient(to_bottom,#1f29370a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

        <div className="relative mx-auto w-full max-w-7xl flex flex-col items-center text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 text-xs font-semibold text-emerald-400"
          >
            <SparklesIcon className="h-4 w-4" />
            Next-Generation Property Marketplace
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl font-black tracking-tight text-zinc-50 sm:text-6xl max-w-4xl leading-tight"
          >
            Discover True{" "}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 bg-clip-text text-transparent">
              Transparency
            </span>{" "}
            in Real Estate
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base text-zinc-400 max-w-2xl leading-relaxed"
          >
            Nestora connects verified buyers, agents, and administrators directly. Zero middleman markup, instant offers validation, and safe verified listings.
          </motion.p>

          {/* Quick Search CTA Box */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900/40 p-2.5 backdrop-blur-md shadow-xl flex flex-col sm:flex-row items-center gap-2"
          >
            <div className="relative flex-1 w-full">
              <Search className="absolute top-3.5 left-3.5 h-4.5 w-4.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Where is your ideal location? e.g. Gulshan, Dhaka"
                disabled
                className="w-full rounded-xl border-0 bg-transparent py-3 pr-4 pl-11 text-sm text-zinc-300 placeholder-zinc-650 focus:ring-0 focus:outline-none"
              />
            </div>
            <Link
              href="/properties"
              className="w-full sm:w-auto rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors flex items-center justify-center gap-1 shrink-0"
            >
              Start Searching <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* 2. Statistics Counter Section */}
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 rounded-2xl border border-zinc-800 bg-zinc-900/10 p-6 sm:p-8 backdrop-blur-sm divide-y lg:divide-y-0 lg:divide-x divide-zinc-800/80">
          <div className="flex flex-col items-center justify-center text-center p-4">
            <span className="text-3xl font-black text-emerald-400">12,000+</span>
            <span className="mt-1 text-xs font-bold text-zinc-500 uppercase tracking-wider">Happy Buyers</span>
          </div>
          <div className="flex flex-col items-center justify-center text-center p-4">
            <span className="text-3xl font-black text-emerald-400">3,200+</span>
            <span className="mt-1 text-xs font-bold text-zinc-500 uppercase tracking-wider">Properties Listed</span>
          </div>
          <div className="flex flex-col items-center justify-center text-center p-4">
            <span className="text-3xl font-black text-emerald-400">450+</span>
            <span className="mt-1 text-xs font-bold text-zinc-500 uppercase tracking-wider">Verified Agents</span>
          </div>
          <div className="flex flex-col items-center justify-center text-center p-4">
            <span className="text-3xl font-black text-emerald-400">99.8%</span>
            <span className="mt-1 text-xs font-bold text-zinc-500 uppercase tracking-wider">Safe Transactions</span>
          </div>
        </div>
      </section>

      {/* 3. Property Categories Section */}
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center md:text-left">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-100 sm:text-3xl">
            Explore Property Categories
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Browse our directory by matching categories tailored to your style.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Link
            href="/properties?type=APARTMENT"
            className="group rounded-2xl border border-zinc-850 bg-zinc-900/30 p-6 flex flex-col items-center text-center hover:border-emerald-500/50 hover:shadow-lg transition-all"
          >
            <Building2 className="h-10 w-10 text-emerald-400 group-hover:scale-110 transition-transform" />
            <h3 className="mt-4 text-base font-bold text-zinc-100">Modern Apartments</h3>
            <p className="mt-1 text-xs text-zinc-500">Luxurious spaces, flats, and studios inside urban sectors.</p>
          </Link>
          <Link
            href="/properties?type=HOUSE"
            className="group rounded-2xl border border-zinc-850 bg-zinc-900/30 p-6 flex flex-col items-center text-center hover:border-emerald-500/50 hover:shadow-lg transition-all"
          >
            <Home className="h-10 w-10 text-emerald-400 group-hover:scale-110 transition-transform" />
            <h3 className="mt-4 text-base font-bold text-zinc-100">Family Houses</h3>
            <p className="mt-1 text-xs text-zinc-500">Suburban homes, villas, and compounds with gardens.</p>
          </Link>
          <Link
            href="/properties?type=COMMERCIAL"
            className="group rounded-2xl border border-zinc-850 bg-zinc-900/30 p-6 flex flex-col items-center text-center hover:border-emerald-500/50 hover:shadow-lg transition-all"
          >
            <Building className="h-10 w-10 text-emerald-400 group-hover:scale-110 transition-transform" />
            <h3 className="mt-4 text-base font-bold text-zinc-100">Commercial Spaces</h3>
            <p className="mt-1 text-xs text-zinc-500">Premium retail locations, offices, and warehouses.</p>
          </Link>
        </div>
      </section>

      {/* 4. Featured Listings (Advertised Properties) */}
      {featuredProperties.length > 0 && (
        <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-zinc-100 sm:text-3xl flex items-center gap-2">
                <Flame className="h-6 w-6 text-emerald-400 fill-emerald-950/20" />
                Featured Listings
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Specially promoted verified locations that we highly recommend.
              </p>
            </div>
            <Link
              href="/properties"
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              See All <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProperties.map((prop: any) => (
              <div
                key={prop.id}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-905"
              >
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={prop.imageUrl}
                    alt={prop.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3 bg-zinc-950/80 rounded px-2 py-0.5 text-3xs font-semibold text-emerald-400 border border-emerald-500/20">
                    Featured
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <span className="text-lg font-bold text-emerald-400">{prop.priceRange}</span>
                    <h3 className="text-base font-bold text-zinc-200 mt-1 line-clamp-1">{prop.title}</h3>
                    <p className="text-2xs text-zinc-550 truncate mt-0.5">{prop.location}</p>
                  </div>
                  <Link
                    href={`/properties/${prop.id}`}
                    className="w-full text-center rounded-lg border border-zinc-800 bg-zinc-900/60 py-2 text-xs font-semibold text-zinc-250 hover:bg-zinc-800"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. Why Choose Us Section */}
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-50 sm:text-3xl">
            Why Property Lovers Choose Nestora
          </h2>
          <p className="mx-auto text-sm text-zinc-500 max-w-xl">
            Our system is built from the ground up to solve common real estate communication roadblocks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/10 p-6 space-y-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-zinc-150">Vetted Administrators</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Every listing is scrutinized before publishing, preventing phantom listings, fake images, or duplicate entries.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/10 p-6 space-y-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <DollarSign className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-zinc-155">Direct Bid Offers</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              State your price directly. Real estate agents review the bid history online and confirm the transaction.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/10 p-6 space-y-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Compass className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-zinc-160">Certified Agents</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Agents are verified. Fraudulent behaviors result in suspension, protecting buyers from scams.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Customer Reviews Testimonial */}
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-50 sm:text-3xl">
            What Clients Say
          </h2>
          <p className="text-sm text-zinc-500">Hear from our community of homeowners and commercial partners.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Review 1 */}
          <div className="rounded-2xl border border-zinc-850 bg-zinc-900/30 p-6 space-y-4">
            <div className="flex items-center gap-1 text-emerald-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-emerald-400" />
              ))}
            </div>
            <p className="text-xs text-zinc-400 italic leading-relaxed">
              "Buying our penthouse at Gulshan was a breeze. We submitted our bid offer, the agent accepted it within a day, and we signed the contracts. Pure transparency."
            </p>
            <div className="flex items-center gap-3 pt-2">
              <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60"
                alt="Client"
                className="h-8 w-8 rounded-full object-cover"
              />
              <div>
                <span className="block text-xs font-bold text-zinc-200">Sarah Customer</span>
                <span className="block text-3xs text-zinc-500">Home Owner</span>
              </div>
            </div>
          </div>

          {/* Review 2 */}
          <div className="rounded-2xl border border-zinc-850 bg-zinc-900/30 p-6 space-y-4">
            <div className="flex items-center gap-1 text-emerald-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-emerald-400" />
              ))}
            </div>
            <p className="text-xs text-zinc-400 italic leading-relaxed">
              "Listing properties here is super convenient. I upload photos, configure bedroom configurations, and track incoming buyer bids in real-time. Unbelievable platform."
            </p>
            <div className="flex items-center gap-3 pt-2">
              <img
                src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=60"
                alt="Client"
                className="h-8 w-8 rounded-full object-cover"
              />
              <div>
                <span className="block text-xs font-bold text-zinc-200">John Agent</span>
                <span className="block text-3xs text-zinc-500">Real Estate Partner</span>
              </div>
            </div>
          </div>

          {/* Review 3 */}
          <div className="rounded-2xl border border-zinc-850 bg-zinc-900/30 p-6 space-y-4">
            <div className="flex items-center gap-1 text-emerald-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-emerald-400" />
              ))}
            </div>
            <p className="text-xs text-zinc-400 italic leading-relaxed">
              "As an administrator, managing flagged fraud accounts and approving verified locations is fast. The local database and API structure runs smoothly!"
            </p>
            <div className="flex items-center gap-3 pt-2">
              <img
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60"
                alt="Client"
                className="h-8 w-8 rounded-full object-cover"
              />
              <div>
                <span className="block text-xs font-bold text-zinc-200">Admin Nestora</span>
                <span className="block text-3xs text-zinc-500">System Operator</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Call To Action (CTA) */}
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-emerald-950/30 to-teal-950/20 border border-emerald-500/10 p-8 sm:p-12 text-center space-y-6">
          <h2 className="text-3xl font-extrabold text-zinc-50 tracking-tight sm:text-4xl">
            Ready to find your next space?
          </h2>
          <p className="mx-auto text-sm text-zinc-400 max-w-lg leading-relaxed">
            Create a free account as a buyer to start submitting offers, or register as an agent to publish your inventory.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/auth/register"
              className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-950/20"
            >
              Register Now
            </Link>
            <Link
              href="/properties"
              className="rounded-xl border border-zinc-800 bg-zinc-950 px-6 py-3 text-sm font-semibold text-zinc-350 hover:bg-zinc-900"
            >
              Browse Listings
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5.5z" />
      <path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1z" />
    </svg>
  );
}

function Flame(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}
