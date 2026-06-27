"use client";

import React, { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "@/lib/auth-context";
import {
  Shield,
  Building,
  Users,
  CheckCircle,
  AlertTriangle,
  Flame,
  UserX,
  Trash2,
  TrendingUp,
  XCircle,
} from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();

  // Redirect if not logged in or not admin
  React.useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      window.location.href = "/auth/login";
    }
  }, [user, loading]);

  // Fetch properties (includes agent info)
  const { data: properties = [], isLoading: isPropsLoading } = useQuery({
    queryKey: ["admin-properties"],
    queryFn: async () => {
      const response = await axios.get("/api/v1/property");
      return response.data.data;
    },
    enabled: !!user,
  });

  // Fetch all users
  const { data: users = [], isLoading: isUsersLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const response = await axios.get("/api/v1/users");
      return response.data.data;
    },
    enabled: !!user,
  });

  // Fetch all offers
  const { data: offers = [], isLoading: isOffersLoading } = useQuery({
    queryKey: ["admin-offers"],
    queryFn: async () => {
      const response = await axios.get("/api/v1/offers");
      return response.data.data;
    },
    enabled: !!user,
  });

  // Property status toggle mutation (verified / advertised)
  const updatePropStatusMutation = useMutation({
    mutationFn: async ({
      id,
      isVerified,
      isAdvertised,
    }: {
      id: number;
      isVerified?: boolean;
      isAdvertised?: boolean;
    }) => {
      const payload: any = {};
      if (isVerified !== undefined) payload.isVerified = isVerified;
      if (isAdvertised !== undefined) payload.isAdvertised = isAdvertised;
      await axios.put(`/api/v1/property/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-properties"] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });

  // Delete property mutation
  const deletePropMutation = useMutation({
    mutationFn: async (id: number) => {
      await axios.delete(`/api/v1/property/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-properties"] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });

  // User management mutation (verify agent, fraud check)
  const updateUserMutation = useMutation({
    mutationFn: async ({
      userId,
      isVerified,
      isFraud,
    }: {
      userId: string;
      isVerified?: boolean;
      isFraud?: boolean;
    }) => {
      const payload: any = {};
      if (isVerified !== undefined) payload.isVerified = isVerified;
      if (isFraud !== undefined) payload.isFraud = isFraud;
      await axios.put(`/api/v1/users/${userId}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-properties"] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await axios.delete(`/api/v1/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-properties"] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });

  // Statistics calculation
  const stats = useMemo(() => {
    const totalProps = properties.length;
    const verifiedProps = properties.filter((p: any) => p.isVerified).length;
    const totalUsers = users.length;
    const totalAgents = users.filter((u: any) => u.role === "AGENT").length;
    const totalOffersCount = offers.length;
    const totalSales = offers.filter((o: any) => o.status === "BOUGHT").length;

    return {
      totalProps,
      verifiedProps,
      totalUsers,
      totalAgents,
      totalOffersCount,
      totalSales,
    };
  }, [properties, users, offers]);

  if (loading || !user) {
    return (
      <div className="flex flex-1 items-center justify-center p-16">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-50 flex items-center gap-2">
          <Shield className="h-8 w-8 text-rose-500" />
          Admin Command Center
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Monitor marketplace health, approve listings, review agents, and manage accounts.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Total Properties */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/10 p-5 space-y-2">
          <Building className="h-6 w-6 text-emerald-400" />
          <span className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider">Properties</span>
          <span className="block text-2xl font-black text-zinc-100">{stats.totalProps}</span>
          <span className="block text-2xs text-zinc-600">
            {stats.verifiedProps} approved listings
          </span>
        </div>

        {/* Total Users */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/10 p-5 space-y-2">
          <Users className="h-6 w-6 text-cyan-400" />
          <span className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider">Registered Users</span>
          <span className="block text-2xl font-black text-zinc-100">{stats.totalUsers}</span>
          <span className="block text-2xs text-zinc-600">{stats.totalAgents} agents</span>
        </div>

        {/* Active Offers */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/10 p-5 space-y-2">
          <TrendingUp className="h-6 w-6 text-indigo-400" />
          <span className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider">Total Offers</span>
          <span className="block text-2xl font-black text-zinc-100">{stats.totalOffersCount}</span>
          <span className="block text-2xs text-zinc-600">Placed on listed properties</span>
        </div>

        {/* Complete Deals */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/10 p-5 space-y-2">
          <CheckCircle className="h-6 w-6 text-amber-400" />
          <span className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider">Completed Deals</span>
          <span className="block text-2xl font-black text-zinc-100">{stats.totalSales}</span>
          <span className="block text-2xs text-zinc-600">Properties sold</span>
        </div>
      </div>

      {/* Properties Management List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-zinc-100">Review Properties</h2>
        
        {isPropsLoading ? (
          <div className="h-32 w-full animate-pulse rounded-xl bg-zinc-900/30" />
        ) : properties.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-905 p-8 text-center text-sm text-zinc-500">
            No properties found in database.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/10">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50 text-xs font-bold uppercase tracking-wider text-zinc-400">
                  <th className="p-4">Listing</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Verification</th>
                  <th className="p-4">Promoted</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {properties.map((prop: any) => (
                  <tr key={prop.id} className="hover:bg-zinc-900/20 transition-colors">
                    <td className="p-4">
                      <div>
                        <Link
                          href={`/properties/${prop.id}`}
                          className="font-bold text-zinc-200 hover:text-emerald-400"
                        >
                          {prop.title}
                        </Link>
                        <span className="block text-2xs text-zinc-550 mt-0.5">{prop.location}</span>
                      </div>
                    </td>
                    <td className="p-4 font-bold text-emerald-400">{prop.priceRange}</td>
                    <td className="p-4 text-zinc-400 uppercase text-xs font-semibold">
                      {prop.propertyType}
                    </td>
                    <td className="p-4">
                      {prop.isVerified ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-bold">
                          <CheckCircle className="h-3.5 w-3.5 fill-emerald-950" /> Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-500 font-bold">
                          <AlertTriangle className="h-3.5 w-3.5" /> Pending Approval
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {prop.isAdvertised ? (
                        <span className="inline-flex items-center gap-1 text-xs text-indigo-400 font-semibold">
                          <Flame className="h-3.5 w-3.5" /> Advertised
                        </span>
                      ) : (
                        <span className="text-zinc-500 text-xs font-semibold">Standard</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        {/* Verify button */}
                        {!prop.isVerified ? (
                          <button
                            onClick={() =>
                              updatePropStatusMutation.mutate({ id: prop.id, isVerified: true })
                            }
                            className="rounded bg-emerald-600 px-2 py-1 text-2xs font-bold text-white hover:bg-emerald-500 transition-colors"
                          >
                            Approve
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              updatePropStatusMutation.mutate({ id: prop.id, isVerified: false })
                            }
                            className="rounded bg-zinc-800 px-2 py-1 text-2xs font-semibold text-zinc-450 hover:bg-zinc-700 transition-colors"
                          >
                            Reject
                          </button>
                        )}

                        {/* Advertise Toggle */}
                        <button
                          onClick={() =>
                            updatePropStatusMutation.mutate({
                              id: prop.id,
                              isAdvertised: !prop.isAdvertised,
                            })
                          }
                          className={`rounded px-2 py-1 text-2xs font-bold transition-colors ${
                            prop.isAdvertised
                              ? "bg-indigo-950 border border-indigo-800 text-indigo-400 hover:bg-indigo-900"
                              : "bg-zinc-800 border border-zinc-700 text-zinc-400 hover:bg-zinc-700"
                          }`}
                        >
                          {prop.isAdvertised ? "Stop Promo" : "Promote"}
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => {
                            if (confirm("Delete this listing permanently?")) {
                              deletePropMutation.mutate(prop.id);
                            }
                          }}
                          className="p-1 text-zinc-500 hover:text-rose-400 hover:bg-zinc-900 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Users Management List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-zinc-100">Manage Accounts</h2>

        {isUsersLoading ? (
          <div className="h-32 w-full animate-pulse rounded-xl bg-zinc-900/30" />
        ) : users.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-905 p-8 text-center text-sm text-zinc-500">
            No registered users.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/10">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50 text-xs font-bold uppercase tracking-wider text-zinc-400">
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Agent Verification</th>
                  <th className="p-4">Security Flags</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {users.map((account: any) => (
                  <tr key={account.id} className="hover:bg-zinc-900/20 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={account.imageUrl}
                          alt={account.name}
                          className="h-8 w-8 rounded-full border border-zinc-850 object-cover"
                        />
                        <span className="font-bold text-zinc-200">{account.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-zinc-400">{account.email}</td>
                    <td className="p-4 uppercase text-xs font-semibold">{account.role}</td>
                    <td className="p-4">
                      {account.role === "AGENT" ? (
                        account.isVerified ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-semibold">
                            <CheckCircle className="h-3.5 w-3.5" /> Verified Agent
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-500 font-semibold">
                            <AlertTriangle className="h-3.5 w-3.5" /> Pending Certification
                          </span>
                        )
                      ) : (
                        <span className="text-zinc-600 text-xs italic">N/A (Buyer/Admin)</span>
                      )}
                    </td>
                    <td className="p-4">
                      {account.role === "AGENT" ? (
                        account.isFraud ? (
                          <span className="inline-flex items-center gap-1 rounded bg-rose-955/20 border border-rose-900/40 px-2.5 py-0.5 text-xs font-bold text-rose-400 animate-pulse">
                            Fraud Flagged
                          </span>
                        ) : (
                          <span className="text-emerald-500 text-xs font-semibold">Clear</span>
                        )
                      ) : (
                        <span className="text-zinc-650 text-xs">Clear</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        {/* Verify Agent Toggle */}
                        {account.role === "AGENT" && (
                          <>
                            {!account.isVerified ? (
                              <button
                                onClick={() =>
                                  updateUserMutation.mutate({
                                    userId: account.id,
                                    isVerified: true,
                                  })
                                }
                                className="rounded bg-emerald-600 px-2 py-1 text-2xs font-bold text-white hover:bg-emerald-500 transition-colors"
                              >
                                Verify
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  updateUserMutation.mutate({
                                    userId: account.id,
                                    isVerified: false,
                                  })
                                }
                                className="rounded bg-zinc-800 px-2 py-1 text-2xs font-semibold text-zinc-450 hover:bg-zinc-700 transition-colors"
                              >
                                Revoke
                              </button>
                            )}

                            {/* Fraud Toggle */}
                            <button
                              onClick={() =>
                                updateUserMutation.mutate({
                                  userId: account.id,
                                  isFraud: !account.isFraud,
                                })
                              }
                              className={`rounded px-2 py-1 text-2xs font-bold transition-colors ${
                                account.isFraud
                                  ? "bg-rose-950 border border-rose-800 text-rose-400 hover:bg-rose-900"
                                  : "bg-zinc-800 border border-zinc-700 text-zinc-400 hover:bg-zinc-700"
                              }`}
                            >
                              {account.isFraud ? "Clear Fraud" : "Mark Fraud"}
                            </button>
                          </>
                        )}

                        {/* Delete User */}
                        {account.role !== "ADMIN" && (
                          <button
                            onClick={() => {
                              if (
                                confirm(
                                  `Delete user "${account.name}"? If Agent, all listed properties will also be removed!`
                                )
                              ) {
                                deleteUserMutation.mutate(account.id);
                              }
                            }}
                            className="p-1 text-zinc-550 hover:text-rose-400 hover:bg-zinc-900 rounded"
                            title="Delete User"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
