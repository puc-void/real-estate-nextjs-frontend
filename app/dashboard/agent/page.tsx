"use client";

import React, { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "@/lib/auth-context";
import { Plus, Edit, Trash2, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Mail, Check, X } from "lucide-react";
import Link from "next/link";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";

interface AgentProperty {
  id: number;
  title: string;
  location: string;
  priceRange: string;
  propertyType: string;
  isVerified: boolean;
  isBought: boolean;
  isAdvertised: boolean;
}

const columnHelper = createColumnHelper<AgentProperty>();

export default function AgentDashboard() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();

  // Redirect if not logged in or not an agent
  React.useEffect(() => {
    if (!loading && (!user || user.role !== "AGENT")) {
      window.location.href = "/auth/login";
    }
  }, [user, loading]);

  // Fetch Agent properties
  const { data: properties = [], isLoading: isPropsLoading } = useQuery<AgentProperty[]>({
    queryKey: ["agent-properties", user?.agentId],
    queryFn: async () => {
      const response = await axios.get(`/api/v1/property/agent/${user?.agentId}`);
      return response.data.data;
    },
    enabled: !!user?.agentId,
  });

  // Fetch offers received
  const { data: offers = [], isLoading: isOffersLoading } = useQuery({
    queryKey: ["agent-received-offers"],
    queryFn: async () => {
      const response = await axios.get("/api/v1/offers");
      return response.data.data;
    },
    enabled: !!user,
  });

  // Delete property mutation
  const deletePropMutation = useMutation({
    mutationFn: async (id: number) => {
      await axios.delete(`/api/v1/property/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-properties"] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });

  // Accept/Reject offer mutation
  const updateOfferMutation = useMutation({
    mutationFn: async ({ offerId, status }: { offerId: number; status: "ACCEPTED" | "REJECTED" }) => {
      await axios.put(`/api/v1/offers/${offerId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-received-offers"] });
      queryClient.invalidateQueries({ queryKey: ["agent-properties"] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || "Failed to update offer status.");
    },
  });

  // Define columns for TanStack Table
  const columns = useMemo(
    () => [
      columnHelper.accessor("title", {
        header: "Property Title",
        cell: (info) => <span className="font-bold text-zinc-100">{info.getValue()}</span>,
      }),
      columnHelper.accessor("location", {
        header: "Location",
        cell: (info) => <span className="text-zinc-400 text-xs">{info.getValue()}</span>,
      }),
      columnHelper.accessor("priceRange", {
        header: "Price Range",
        cell: (info) => <span className="text-emerald-400 font-bold">{info.getValue()}</span>,
      }),
      columnHelper.accessor("propertyType", {
        header: "Type",
        cell: (info) => (
          <span className="text-2xs bg-zinc-900 border border-zinc-800 rounded px-2 py-0.5 font-semibold uppercase text-zinc-400">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor("isVerified", {
        header: "Verification",
        cell: (info) =>
          info.getValue() ? (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" /> Verified
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-amber-500 font-semibold">
              <AlertTriangle className="h-3.5 w-3.5" /> Pending
            </span>
          ),
      }),
      columnHelper.accessor("isBought", {
        header: "Status",
        cell: (info) =>
          info.getValue() ? (
            <span className="text-xs bg-rose-950/20 text-rose-400 border border-rose-900/40 rounded px-2 py-0.5 font-bold">
              Sold
            </span>
          ) : (
            <span className="text-xs bg-emerald-950/20 text-emerald-400 border border-emerald-900/40 rounded px-2 py-0.5 font-semibold">
              Available
            </span>
          ),
      }),
      columnHelper.display({
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: (info) => (
          <div className="flex justify-end gap-2">
            <Link
              href={`/dashboard/agent/edit-property/${info.row.original.id}`}
              className="p-1 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-900 rounded transition-all"
              title="Edit Property"
            >
              <Edit className="h-4 w-4" />
            </Link>
            <button
              onClick={() => {
                if (confirm("Are you sure you want to delete this property?")) {
                  deletePropMutation.mutate(info.row.original.id);
                }
              }}
              className="p-1 text-zinc-500 hover:text-rose-400 hover:bg-zinc-900 rounded transition-all"
              title="Delete Property"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ),
      }),
    ],
    [deletePropMutation]
  );

  // TanStack Table Instance
  const table = useReactTable({
    data: properties,
    columns,
    getCoreRowModel: getCoreRowModel(),
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
      {/* Profile Header */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-center gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <img
            src={user.imageUrl}
            alt={user.name}
            className="h-20 w-20 rounded-full border-2 border-emerald-500 object-cover"
          />
          <div className="text-center sm:text-left space-y-1">
            <h1 className="text-2xl font-extrabold text-zinc-100 flex items-center justify-center sm:justify-start gap-2">
              {user.name}
              <span className="rounded-full bg-cyan-950/40 border border-cyan-900 px-2.5 py-0.5 text-3xs font-extrabold uppercase text-cyan-400">
                Agent
              </span>
            </h1>
            <p className="text-sm text-zinc-400">{user.email}</p>
            <p className="text-xs text-zinc-500 flex items-center justify-center sm:justify-start gap-1">
              <span>Agent ID: {user.agentId}</span>
              {user.isVerified ? (
                <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                  (<ShieldCheck className="h-3 w-3 inline" /> Verified Partner)
                </span>
              ) : (
                <span className="text-amber-500 font-semibold">
                  (Pending Verification)
                </span>
              )}
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/agent/add-property"
          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-md hover:bg-emerald-500 transition-colors shrink-0"
        >
          <Plus className="h-4 w-4" /> Add New Property
        </Link>
      </div>

      {/* Properties Table Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-zinc-100">My Listings ({properties.length})</h2>

        {isPropsLoading ? (
          <div className="h-32 w-full animate-pulse rounded-xl bg-zinc-900/30" />
        ) : properties.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-800 p-12 text-center">
            <p className="text-sm text-zinc-500">You haven't listed any properties yet.</p>
            <Link
              href="/dashboard/agent/add-property"
              className="mt-4 inline-block text-xs font-bold text-emerald-400 hover:underline"
            >
              Add your first listing
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/10">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr
                    key={headerGroup.id}
                    className="border-b border-zinc-800 bg-zinc-900/50 text-xs font-bold uppercase tracking-wider text-zinc-400"
                  >
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className="p-4">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-zinc-900/20 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="p-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Offers Received Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-zinc-100">Offers Received</h2>

        {isOffersLoading ? (
          <div className="h-32 w-full animate-pulse rounded-xl bg-zinc-900/30" />
        ) : offers.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/10 p-8 text-center text-sm text-zinc-500">
            No offers received on your properties.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/10">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50 text-xs font-bold uppercase tracking-wider text-zinc-400">
                  <th className="p-4">Property</th>
                  <th className="p-4">Buyer Details</th>
                  <th className="p-4">Offered Price</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {offers.map((offer: any) => (
                  <tr key={offer.id} className="hover:bg-zinc-900/20 transition-colors">
                    <td className="p-4">
                      {offer.property ? (
                        <div>
                          <Link
                            href={`/properties/${offer.propertyId}`}
                            className="font-bold text-zinc-200 hover:text-emerald-400"
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
                    <td className="p-4">
                      <div className="text-zinc-200 font-medium">{offer.buyerName}</div>
                      <div className="text-zinc-500 text-xs">{offer.buyerEmail}</div>
                    </td>
                    <td className="p-4 font-bold text-emerald-400">{offer.offerAmount}</td>
                    <td className="p-4">
                      <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold border ${
                        offer.status === "PENDING"
                          ? "bg-amber-950/20 text-amber-400 border-amber-900/40"
                          : offer.status === "ACCEPTED"
                          ? "bg-emerald-950/20 text-emerald-400 border-emerald-900/40"
                          : offer.status === "BOUGHT"
                          ? "bg-cyan-950/20 text-cyan-400 border-cyan-900/40"
                          : "bg-rose-950/20 text-rose-400 border-rose-900/40"
                      }`}>
                        {offer.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {offer.status === "PENDING" && (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => updateOfferMutation.mutate({ offerId: offer.id, status: "ACCEPTED" })}
                            disabled={updateOfferMutation.isPending}
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
                            title="Accept Offer"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => updateOfferMutation.mutate({ offerId: offer.id, status: "REJECTED" })}
                            disabled={updateOfferMutation.isPending}
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-950 border border-rose-800 text-rose-400 hover:bg-rose-900 transition-colors"
                            title="Reject Offer"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                      {offer.status === "ACCEPTED" && (
                        <span className="text-xs text-zinc-500 italic">Waiting for buyer payment</span>
                      )}
                      {offer.status === "BOUGHT" && (
                        <span className="text-xs text-cyan-400 font-bold">Sold out / Completed</span>
                      )}
                      {offer.status === "REJECTED" && (
                        <span className="text-xs text-zinc-650 italic">Rejected</span>
                      )}
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
