import React from "react";
import PropertyGrid from "../../components/PropertyGrid";

export const metadata = {
  title: "Browse Properties - Nestora",
  description: "Browse every available verified and listed property, filtered by location, type, and budget.",
};

export default function PropertiesPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-50 sm:text-4xl">
          Explore Available Properties
        </h1>
        <p className="mt-2 text-base text-zinc-400 max-w-2xl">
          Search and compare our hand-selected verified listings. Find your dream home, workspace, or commercial real estate with full transparency.
        </p>
      </div>

      {/* Interactive Catalog Grid */}
      <PropertyGrid />
    </div>
  );
}
