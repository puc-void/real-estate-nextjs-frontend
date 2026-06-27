"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Home, Building2, Tag, CheckCircle2, Heart } from "lucide-react";
import { useAuth } from "../lib/auth-context";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

export interface PropertyCardProps {
  property: {
    id: number;
    title: string;
    description: string;
    imageUrl: string;
    location: string;
    priceRange: string;
    propertyType: "HOUSE" | "APARTMENT" | "COMMERCIAL";
    isVerified: boolean;
    isBought: boolean;
    agent?: {
      id: string;
      isVerified: boolean;
      isFraud: boolean;
    } | null;
  };
  isWishlisted?: boolean;
}

export default function PropertyCard({ property, isWishlisted = false }: PropertyCardProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Wishlist toggle mutation
  const wishlistMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post("/api/v1/wishlist", {
        propertyId: property.id,
      });
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate queries to refresh wishlist states
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });

  const getIcon = () => {
    switch (property.propertyType) {
      case "HOUSE":
        return <Home className="h-4 w-4" />;
      case "COMMERCIAL":
        return <Building2 className="h-4 w-4 text-emerald-400" />;
      default:
        return <Building2 className="h-4 w-4" />;
    }
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      alert("Please log in to add properties to your wishlist.");
      return;
    }
    wishlistMutation.mutate();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3 }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm transition-all hover:border-zinc-700/80 hover:shadow-lg hover:shadow-emerald-950/10"
    >
      {/* Property Image & Status Badges */}
      <div className="relative aspect-video w-full overflow-hidden bg-zinc-800">
        <img
          src={property.imageUrl}
          alt={property.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-md bg-zinc-950/80 px-2.5 py-1 text-xs font-semibold text-zinc-200 backdrop-blur-sm">
            {getIcon()}
            <span className="capitalize">{property.propertyType.toLowerCase()}</span>
          </span>
          {property.isVerified && (
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/90 px-2.5 py-1 text-xs font-bold text-zinc-950 shadow-sm">
              <CheckCircle2 className="h-3 w-3" />
              Verified
            </span>
          )}
          {property.isBought && (
            <span className="inline-flex items-center rounded-md bg-rose-500 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
              Sold Out
            </span>
          )}
        </div>

        {/* Wishlist Button (Only for role: USER) */}
        {(!user || user.role === "USER") && (
          <button
            onClick={handleWishlistClick}
            disabled={wishlistMutation.isPending}
            className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-950/80 text-zinc-400 backdrop-blur-sm transition-all hover:bg-zinc-900 hover:text-rose-500 active:scale-95 disabled:opacity-50"
            title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
          >
            <Heart
              className={`h-4.5 w-4.5 transition-colors ${
                isWishlisted ? "fill-rose-500 text-rose-500" : ""
              }`}
            />
          </button>
        )}
      </div>

      {/* Property Details */}
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xl font-bold tracking-tight text-emerald-400">
            {property.priceRange}
          </span>
        </div>

        <h3 className="mb-1 text-lg font-bold text-zinc-100 line-clamp-1 group-hover:text-emerald-300 transition-colors">
          {property.title}
        </h3>

        <div className="mb-4 flex items-center gap-1 text-xs text-zinc-500">
          <MapPin className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
          <span className="line-clamp-1">{property.location}</span>
        </div>

        <p className="mb-5 text-sm text-zinc-400 line-clamp-2 leading-relaxed">
          {property.description}
        </p>

        {/* Action Button */}
        <div className="mt-auto pt-3 border-t border-zinc-800/80 flex items-center justify-between">
          <Link
            href={`/properties/${property.id}`}
            className="w-full text-center rounded-lg border border-zinc-800 bg-zinc-900/60 py-2.5 text-sm font-semibold text-zinc-200 transition-all hover:bg-zinc-800 hover:text-white"
          >
            View Details
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
