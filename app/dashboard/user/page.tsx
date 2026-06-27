"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "@/lib/auth-context";
import { Heart, Compass, Mail, ShieldAlert, Award, ShoppingBag, Trash2 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function UserDashboard() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();

  // Redirect if not logged in or wrong role
  React.useEffect(() => {
    if (!loading && (!user || user.role !== "USER")) {
      window.location.href = "/auth/login";
    }
  }, [user, loading]);

  // Fetch wishlist
  const { data: wishlist, isLoading: isWishlistLoading } = useQuery({
    queryKey: ["wishlist"],
    queryFn: async () => {
      const response = await axios.get("/api/v1/wishlist");
      return response.data.data;
    },
    enabled: !!user,
  });

  // Fetch offers
  const { data: offers, isLoading: isOffersLoading } = useQuery({
    queryKey: ["offers"],
    queryFn: async () => {
      const response = await axios.get("/api/v1/offers");
      return response.data.data;
    },
    enabled: !!user,
  });

  // Toggle wishlist mutation
  const removeWishlistMutation = useMutation({
    mutationFn: async (propertyId: number) => {
      await axios.post("/api/v1/wishlist", { propertyId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });

  // Buy property mutation
  const buyMutation = useMutation({
    mutationFn: async (offerId: number) => {
      const response = await axios.put(`/api/v1/offers/${offerId}`, {
        status: "BOUGHT",
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offers"] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || "Failed to complete purchase.");
    },
  });

  if (loading || !user) {
    return (
      <div className="flex flex-1 items-center justify-center p-16">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
      {/* Profile Banner */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
        <img
          src={user.imageUrl}
          alt={user.name}
          className="h-20 w-20 rounded-full border-2 border-emerald-500 object-cover shadow-lg"
        />
        <div className="text-center sm:text-left space-y-1">
          <h1 className="text-2xl font-extrabold text-zinc-100 flex items-center justify-center sm:justify-start gap-2">
            {user.name}
            <span className="rounded-full bg-emerald-950/40 border border-emerald-900 px-2.5 py-0.5 text-3xs font-extrabold uppercase text-emerald-400">
              Buyer
            </span>
          </h1>
          <p className="text-sm text-zinc-400">{user.email}</p>
          <p className="text-xs text-zinc-500">Account ID: {user.id}</p>
        </div>
      </div>

      {/* Main Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Wishlist Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            <Heart className="h-5 w-5 text-rose-500 fill-rose-500" />
            My Wishlist ({wishlist?.length || 0})
          </h2>

          {isWishlistLoading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2].map((n) => (
                <div key={n} className="h-24 w-full rounded-xl bg-zinc-900/30" />
              ))}
            </div>
          ) : !wishlist || wishlist.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-800 p-8 text-center space-y-3">
              <p className="text-sm text-zinc-500">Your wishlist is currently empty.</p>
              <Link
                href="/properties"
                className="inline-block rounded-lg bg-zinc-900 border border-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800"
              >
                Browse Listings
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {wishlist.map((item: any) => (
                <div
                  key={item.id}
                  className="flex gap-4 rounded-xl border border-zinc-850 bg-zinc-900/40 p-4 transition-all hover:border-zinc-800"
                >
                  <img
                    src={item.property.imageUrl}
                    alt={item.property.title}
                    className="h-16 w-16 rounded-lg object-cover bg-zinc-850 shrink-0"
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-zinc-200 truncate hover:text-emerald-400 transition-colors">
                        <Link href={`/properties/${item.propertyId}`}>{item.property.title}</Link>
                      </h4>
                      <p className="text-2xs text-zinc-500 truncate mt-0.5">{item.property.location}</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-400 mt-2">
                      {item.property.priceRange}
                    </span>
                  </div>
                  <button
                    onClick={() => removeWishlistMutation.mutate(item.propertyId)}
                    disabled={removeWishlistMutation.isPending}
                    className="text-zinc-600 hover:text-rose-400 p-1 shrink-0 self-center transition-colors"
                    title="Remove from Wishlist"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Offers History */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-emerald-400" />
            Offer & Purchase History
          </h2>

          {isOffersLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-32 w-full rounded-xl bg-zinc-900/30" />
            </div>
          ) : !offers || offers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-800 p-12 text-center">
              <p className="text-sm text-zinc-500">You have not placed any offers yet.</p>
              <Link
                href="/properties"
                className="mt-4 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500"
              >
                Find Properties
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/10">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/50 text-xs font-bold uppercase tracking-wider text-zinc-400">
                    <th className="p-4">Property</th>
                    <th className="p-4">Agent Email</th>
                    <th className="p-4">Offered Price</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {offers.map((offer: any) => {
                    const statusColors: Record<string, string> = {
                      PENDING: "bg-amber-950/40 text-amber-400 border-amber-900/50",
                      ACCEPTED: "bg-emerald-950/40 text-emerald-400 border-emerald-900/50",
                      REJECTED: "bg-rose-950/40 text-rose-400 border-rose-900/50",
                      BOUGHT: "bg-cyan-950/40 text-cyan-400 border-cyan-900/50",
                    };

                    return (
                      <tr key={offer.id} className="hover:bg-zinc-900/20 transition-colors">
                        <td className="p-4">
                          {offer.property ? (
                            <div>
                              <Link
                                href={`/properties/${offer.propertyId}`}
                                className="font-bold text-zinc-200 hover:text-emerald-400 transition-colors"
                              >
                                {offer.property.title}
                              </Link>
                              <span className="block text-2xs text-zinc-500 mt-0.5">
                                {offer.property.location}
                              </span>
                            </div>
                          ) : (
                            <span className="text-zinc-600 italic">Deleted Property</span>
                          )}
                        </td>
                        <td className="p-4 text-zinc-400">
                          {offer.property?.agent?.email || "N/A"}
                        </td>
                        <td className="p-4 font-bold text-emerald-400">{offer.offerAmount}</td>
                        <td className="p-4">
                          <span className={`inline-block rounded-md border px-2 py-0.5 text-xs font-semibold ${statusColors[offer.status]}`}>
                            {offer.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {offer.status === "ACCEPTED" && (
                            <button
                              onClick={() => buyMutation.mutate(offer.id)}
                              disabled={buyMutation.isPending}
                              className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition-all shadow-md"
                            >
                              Buy Now / Pay
                            </button>
                          )}
                          {offer.status === "BOUGHT" && (
                            <span className="text-xs font-bold text-cyan-400 flex items-center justify-end gap-1">
                              ✓ Owned
                            </span>
                          )}
                          {offer.status === "PENDING" && (
                            <span className="text-xs text-zinc-500 italic">Awaiting Agent</span>
                          )}
                          {offer.status === "REJECTED" && (
                            <span className="text-xs text-zinc-600 italic">Closed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
