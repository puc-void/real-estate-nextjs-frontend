"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "@/lib/auth-context";
import {
  MapPin,
  Home,
  Building2,
  Calendar,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  Heart,
  DollarSign,
  ArrowLeft,
  Bed,
  Bath,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function PropertyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const propertyId = Number(params.id);

  // Form states for Offer
  const [offerAmount, setOfferAmount] = useState("");
  const [offerSuccessMsg, setOfferSuccessMsg] = useState("");
  const [offerErrorMsg, setOfferErrorMsg] = useState("");

  // Fetch single property details
  const { data: prop, isLoading, error } = useQuery({
    queryKey: ["property", propertyId],
    queryFn: async () => {
      const response = await axios.get(`/api/v1/property/${propertyId}`);
      return response.data.data;
    },
  });

  // Fetch user wishlist to see if this property is wishlisted
  const { data: wishlistData } = useQuery({
    queryKey: ["wishlist"],
    queryFn: async () => {
      const response = await axios.get("/api/v1/wishlist");
      return response.data.data;
    },
    enabled: !!user && user.role === "USER",
  });

  const isWishlisted = wishlistData?.some((w: any) => w.propertyId === propertyId) || false;

  // Toggle wishlist mutation
  const wishlistMutation = useMutation({
    mutationFn: async () => {
      await axios.post("/api/v1/wishlist", { propertyId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });

  // Place offer mutation
  const offerMutation = useMutation({
    mutationFn: async (amount: string) => {
      const response = await axios.post("/api/v1/offers", {
        propertyId,
        buyerName: user?.name,
        buyerEmail: user?.email,
        offerAmount: amount.startsWith("$") ? amount : `$${amount}`,
      });
      return response.data;
    },
    onSuccess: (data) => {
      setOfferSuccessMsg("Your offer was submitted successfully! You can track its status in your dashboard.");
      setOfferAmount("");
      queryClient.invalidateQueries({ queryKey: ["offers"] });
    },
    onError: (err: any) => {
      setOfferErrorMsg(err.response?.data?.message || "Failed to submit offer. Please try again.");
    },
  });

  const handleOfferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOfferSuccessMsg("");
    setOfferErrorMsg("");

    if (!offerAmount.trim()) {
      setOfferErrorMsg("Offer amount is required.");
      return;
    }

    offerMutation.mutate(offerAmount);
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-16">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !prop) {
    return (
      <div className="mx-auto max-w-md p-16 text-center">
        <ShieldAlert className="mx-auto h-12 w-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-zinc-200">Property not found</h2>
        <p className="mt-2 text-sm text-zinc-500">The property you are looking for does not exist or has been removed.</p>
        <Link href="/properties" className="mt-6 inline-flex items-center gap-1 text-emerald-400 hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to Properties
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back Button */}
      <Link href="/properties" className="mb-6 inline-flex items-center gap-1 text-sm font-semibold text-zinc-400 hover:text-zinc-200 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to listings
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main Property Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Photo */}
          <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 aspect-[16/9] w-full">
            <img
              src={prop.imageUrl}
              alt={prop.title}
              className="h-full w-full object-cover"
            />
            {prop.isBought && (
              <div className="absolute inset-0 bg-zinc-950/80 flex items-center justify-center backdrop-blur-sm">
                <span className="rounded-xl border border-rose-500 bg-rose-950/50 px-6 py-3 text-lg font-bold uppercase tracking-wider text-rose-400 shadow-lg">
                  Sold Out / Purchased
                </span>
              </div>
            )}
          </div>

          {/* Title and Badges */}
          <div className="border-b border-zinc-900 pb-5">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="rounded-md bg-zinc-900 px-2.5 py-1 text-xs font-bold text-zinc-400 uppercase">
                {prop.propertyType}
              </span>
              {prop.isVerified && (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="h-3 w-3" /> Verified Listing
                </span>
              )}
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight text-zinc-50 sm:text-3xl">
              {prop.title}
            </h1>

            <div className="mt-3 flex items-center gap-2 text-zinc-400">
              <MapPin className="h-4 w-4 text-emerald-400" />
              <span>{prop.location}</span>
            </div>
          </div>

          {/* Specs Grid */}
          <div className="grid grid-cols-3 gap-4 border-b border-zinc-900 pb-5">
            <div className="rounded-xl border border-zinc-900 bg-zinc-900/10 p-4 text-center">
              <span className="block text-xs font-semibold uppercase tracking-wider text-zinc-500">Price Range</span>
              <span className="mt-1 block text-lg font-extrabold text-emerald-400">{prop.priceRange}</span>
            </div>
            <div className="rounded-xl border border-zinc-900 bg-zinc-900/10 p-4 text-center">
              <span className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 flex justify-center items-center gap-1"><Bed className="h-3.5 w-3.5 text-zinc-500" /> Bedrooms</span>
              <span className="mt-1 block text-lg font-extrabold text-zinc-100">{prop.bedrooms}</span>
            </div>
            <div className="rounded-xl border border-zinc-900 bg-zinc-900/10 p-4 text-center">
              <span className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 flex justify-center items-center gap-1"><Bath className="h-3.5 w-3.5 text-zinc-500" /> Bathrooms</span>
              <span className="mt-1 block text-lg font-extrabold text-zinc-100">{prop.bathrooms}</span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-zinc-100">About This Space</h3>
            <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-line">
              {prop.description}
            </p>
          </div>
        </div>

        {/* Sidebar Info (Agent and Make Offer Forms) */}
        <div className="space-y-6">
          {/* Agent Card */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-6 space-y-4">
            <h3 className="text-base font-bold text-zinc-100">Listing Agent</h3>
            <div className="flex items-center gap-4">
              <img
                src={prop.agent ? `https://api.dicebear.com/7.x/adventurer/svg?seed=${prop.agentId}` : "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150"}
                alt="Agent"
                className="h-12 w-12 rounded-full border border-zinc-700 object-cover"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-bold text-zinc-100">Certified Partner</h4>
                  {prop.agent?.isVerified && (
                    <span title="Verified Agent">
                      <UserCheck className="h-4.5 w-4.5 text-emerald-400" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-500">ID: {prop.agentId.substring(0, 8)}...</p>
              </div>
            </div>

            {prop.agent?.isFraud && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-950/20 border border-rose-900/50 p-3 text-rose-400 text-xs">
                <ShieldAlert className="h-4 w-4" />
                This agent has been flagged as suspicious by administrators. Proceed with caution.
              </div>
            )}
          </div>

          {/* Wishlist Toggle & Offer Form */}
          {(!user || user.role === "USER") && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-zinc-100">Interested in this property?</h3>
                {user && (
                  <button
                    onClick={() => wishlistMutation.mutate()}
                    disabled={wishlistMutation.isPending}
                    className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                      isWishlisted
                        ? "bg-rose-950/20 border-rose-900 text-rose-400 hover:bg-rose-900/20"
                        : "border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                    }`}
                  >
                    <Heart className={`h-3.5 w-3.5 ${isWishlisted ? "fill-rose-400" : ""}`} />
                    {isWishlisted ? "Wishlisted" : "Add Wishlist"}
                  </button>
                )}
              </div>

              {/* Offer Form */}
              {user ? (
                prop.isBought ? (
                  <p className="text-sm text-zinc-500 italic">This property is no longer accepting offers.</p>
                ) : (
                  <form onSubmit={handleOfferSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                        Your Offer Amount
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute top-3 left-3 h-4.5 w-4.5 text-zinc-500" />
                        <input
                          type="number"
                          placeholder="e.g. 1750"
                          value={offerAmount}
                          onChange={(e) => setOfferAmount(e.target.value)}
                          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-3 pr-4 pl-9 text-sm text-zinc-100 placeholder-zinc-700 focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                      <p className="mt-1 text-2xs text-zinc-500">
                        Suggested Range: {prop.priceRange}
                      </p>
                    </div>

                    {offerErrorMsg && (
                      <div className="text-xs text-rose-400 font-semibold">{offerErrorMsg}</div>
                    )}
                    {offerSuccessMsg && (
                      <div className="text-xs text-emerald-400 font-semibold">{offerSuccessMsg}</div>
                    )}

                    <button
                      type="submit"
                      disabled={offerMutation.isPending}
                      className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-md hover:bg-emerald-500 transition-colors disabled:opacity-50"
                    >
                      {offerMutation.isPending ? "Submitting Offer..." : "Submit Official Offer"}
                    </button>
                  </form>
                )
              ) : (
                <div className="rounded-xl bg-zinc-950 p-4 text-center border border-zinc-900">
                  <p className="text-sm text-zinc-400 mb-3">You must be logged in as a buyer to submit an offer.</p>
                  <Link
                    href="/auth/login"
                    className="inline-block rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-colors"
                  >
                    Log In / Sign Up
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Edit / Delete actions for the listing Agent */}
          {user && user.role === "AGENT" && user.agentId === prop.agentId && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-6 space-y-3">
              <h3 className="text-base font-bold text-zinc-100">Property Management</h3>
              <p className="text-xs text-zinc-500">As the listing agent, you can edit or delete this property.</p>
              
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Link
                  href={`/dashboard/agent/edit-property/${prop.id}`}
                  className="rounded-lg bg-zinc-800 py-2.5 text-center text-xs font-semibold text-zinc-200 hover:bg-zinc-700 transition-colors"
                >
                  Edit Listing
                </Link>
                <button
                  onClick={async () => {
                    if (confirm("Are you sure you want to delete this property listing? This cannot be undone.")) {
                      try {
                        const response = await axios.delete(`/api/v1/property/${prop.id}`);
                        if (response.data.success) {
                          alert("Property deleted successfully.");
                          router.push("/dashboard/agent");
                        }
                      } catch (err: any) {
                        alert(err.response?.data?.message || "Failed to delete property.");
                      }
                    }
                  }}
                  className="rounded-lg bg-rose-950/20 border border-rose-900/50 py-2.5 text-xs font-semibold text-rose-400 hover:bg-rose-900/20 transition-colors"
                >
                  Delete Listing
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
