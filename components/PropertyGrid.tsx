"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import PropertyCard from "./PropertyCard";
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useAuth } from "../lib/auth-context";

export default function PropertyGrid() {
  const { user } = useAuth();

  // Fetch all properties
  const { data: propertiesData, isLoading: isPropsLoading } = useQuery({
    queryKey: ["properties"],
    queryFn: async () => {
      const response = await axios.get("/api/v1/property");
      return response.data.data;
    },
  });

  // Fetch wishlist items (only if user is logged in)
  const { data: wishlistData } = useQuery({
    queryKey: ["wishlist"],
    queryFn: async () => {
      const response = await axios.get("/api/v1/wishlist");
      return response.data.data;
    },
    enabled: !!user && user.role === "USER",
  });

  // Create a Set of wishlisted property IDs for O(1) lookup
  const wishlistedIds = useMemo(() => {
    if (!wishlistData) return new Set<number>();
    return new Set<number>(wishlistData.map((item: any) => item.propertyId));
  }, [wishlistData]);

  // Filter & Search states
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [locationFilter, setLocationFilter] = useState("ALL");
  const [maxPrice, setMaxPrice] = useState("");
  const [bedrooms, setBedrooms] = useState("ALL");
  const [bathrooms, setBathrooms] = useState("ALL");
  const [sortBy, setSortBy] = useState("LATEST");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Extract distinct locations for dropdown filter
  const locationsList = useMemo(() => {
    if (!propertiesData) return [];
    const locs = propertiesData
      .filter((p: any) => p.isVerified && p.isAdvertised && !p.isBought)
      .map((p: any) => p.location.split(",").pop().trim());
    return Array.from(new Set(locs)) as string[];
  }, [propertiesData]);

  // Helper to parse min and max prices from string like "$1500-$1900"
  const parseMinMaxPrice = (priceStr: string) => {
    const cleanStr = priceStr.replace(/\$/g, "");
    const parts = cleanStr.split("-");
    const min = parseInt(parts[0], 10) || 0;
    const max = parseInt(parts[1], 10) || Infinity;
    return { min, max };
  };

  // Filtered & Sorted properties
  const processedProperties = useMemo(() => {
    if (!propertiesData) return [];

    let list = [...propertiesData];

    // ONLY show verified and advertised properties on the public catalog, which are not bought yet
    list = list.filter((p) => p.isVerified && p.isAdvertised && !p.isBought);

    // 1. Search Query
    if (search.trim() !== "") {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    // 2. Property Type Filter
    if (typeFilter !== "ALL") {
      list = list.filter((p) => p.propertyType === typeFilter);
    }

    // 3. Location Filter
    if (locationFilter !== "ALL") {
      list = list.filter((p) => p.location.toLowerCase().includes(locationFilter.toLowerCase()));
    }

    // 4. Max Price Filter
    if (maxPrice.trim() !== "") {
      const maxVal = parseFloat(maxPrice);
      if (!isNaN(maxVal)) {
        list = list.filter((p) => {
          const { min } = parseMinMaxPrice(p.priceRange);
          return min <= maxVal;
        });
      }
    }

    // 5. Bedrooms Filter
    if (bedrooms !== "ALL") {
      const bedCount = parseInt(bedrooms, 10);
      list = list.filter((p) => p.bedrooms >= bedCount);
    }

    // 6. Bathrooms Filter
    if (bathrooms !== "ALL") {
      const bathCount = parseInt(bathrooms, 10);
      list = list.filter((p) => p.bathrooms >= bathCount);
    }

    // 7. Sorting
    if (sortBy === "LATEST") {
      list.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
    } else if (sortBy === "PRICE_ASC") {
      list.sort((a, b) => parseMinMaxPrice(a.priceRange).min - parseMinMaxPrice(b.priceRange).min);
    } else if (sortBy === "PRICE_DESC") {
      list.sort((a, b) => parseMinMaxPrice(b.priceRange).min - parseMinMaxPrice(a.priceRange).min);
    }

    return list;
  }, [propertiesData, search, typeFilter, locationFilter, maxPrice, bedrooms, bathrooms, sortBy]);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, typeFilter, locationFilter, maxPrice, bedrooms, bathrooms, sortBy]);

  // Pagination calculations
  const totalPages = Math.ceil(processedProperties.length / itemsPerPage) || 1;
  const paginatedProperties = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return processedProperties.slice(startIndex, startIndex + itemsPerPage);
  }, [processedProperties, currentPage]);

  const handleResetFilters = () => {
    setSearch("");
    setTypeFilter("ALL");
    setLocationFilter("ALL");
    setMaxPrice("");
    setBedrooms("ALL");
    setBathrooms("ALL");
    setSortBy("LATEST");
  };

  return (
    <div className="space-y-6">
      {/* Search and Quick Filters bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute top-3.5 left-3.5 h-4.5 w-4.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by title, location or keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 py-3 pr-4 pl-11 text-sm text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex gap-2">
          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm font-semibold text-zinc-200 hover:bg-zinc-800 md:hidden"
          >
            <SlidersHorizontal className="h-4.5 w-4.5" />
            Filters
          </button>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm font-semibold text-zinc-200 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="LATEST">Newest Listings</option>
            <option value="PRICE_ASC">Price: Low to High</option>
            <option value="PRICE_DESC">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Main Filter Section */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        {/* Desktop Sidebar Filters */}
        <div className={`space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 ${showMobileFilters ? "block fixed inset-0 z-50 overflow-y-auto bg-zinc-950 p-8" : "hidden lg:block"}`}>
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <SlidersHorizontal className="h-4.5 w-4.5 text-emerald-400" />
              Search Filters
            </h3>
            {showMobileFilters ? (
              <button onClick={() => setShowMobileFilters(false)} className="text-zinc-400 hover:text-zinc-200">
                <X className="h-5 w-5" />
              </button>
            ) : (
              <button
                onClick={handleResetFilters}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300"
              >
                Reset All
              </button>
            )}
          </div>

          <div className="space-y-5">
            {/* Property Type */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-500">Property Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2.5 text-sm text-zinc-200 focus:border-emerald-500 focus:outline-none"
              >
                <option value="ALL">All Types</option>
                <option value="HOUSE">House</option>
                <option value="APARTMENT">Apartment</option>
                <option value="COMMERCIAL">Commercial Space</option>
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-500">Location</label>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2.5 text-sm text-zinc-200 focus:border-emerald-500 focus:outline-none"
              >
                <option value="ALL">All Locations</option>
                {locationsList.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            {/* Max Price Budget */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-500">Max Budget ($)</label>
              <input
                type="number"
                placeholder="e.g. 2500"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Bedrooms */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-500">Bedrooms</label>
              <select
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2.5 text-sm text-zinc-200 focus:border-emerald-500 focus:outline-none"
              >
                <option value="ALL">Any Count</option>
                <option value="1">1+ Bedroom</option>
                <option value="2">2+ Bedrooms</option>
                <option value="3">3+ Bedrooms</option>
                <option value="4">4+ Bedrooms</option>
              </select>
            </div>

            {/* Bathrooms */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-500">Bathrooms</label>
              <select
                value={bathrooms}
                onChange={(e) => setBathrooms(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2.5 text-sm text-zinc-200 focus:border-emerald-500 focus:outline-none"
              >
                <option value="ALL">Any Count</option>
                <option value="1">1+ Bathroom</option>
                <option value="2">2+ Bathrooms</option>
                <option value="3">3+ Bathrooms</option>
              </select>
            </div>
          </div>

          {showMobileFilters && (
            <button
              onClick={() => setShowMobileFilters(false)}
              className="mt-6 w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-500"
            >
              Apply Filters
            </button>
          )}
        </div>

        {/* Property Grid Results */}
        <div className="lg:col-span-3 space-y-8">
          {isPropsLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="h-[420px] w-full animate-pulse rounded-2xl border border-zinc-850 bg-zinc-900/30"
                />
              ))}
            </div>
          ) : processedProperties.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 p-16 text-center">
              <span className="text-lg font-bold text-zinc-300">No properties found</span>
              <p className="mt-1 text-sm text-zinc-500">Try adjusting your filters or search terms.</p>
              <button
                onClick={handleResetFilters}
                className="mt-6 rounded-lg bg-zinc-900 border border-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <>
              {/* Properties Card Grid */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {paginatedProperties.map((prop: any) => (
                  <PropertyCard
                    key={prop.id}
                    property={prop}
                    isWishlisted={wishlistedIds.has(prop.id)}
                  />
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 border-t border-zinc-900 pt-6">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:bg-zinc-800 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-semibold transition-all ${
                          currentPage === page
                            ? "bg-emerald-600 text-white"
                            : "border border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:bg-zinc-800 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
