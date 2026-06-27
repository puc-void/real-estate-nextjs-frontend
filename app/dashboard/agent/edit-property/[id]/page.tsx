"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { ArrowLeft, Image as ImageIcon, Upload, Loader2, AlertCircle, Save } from "lucide-react";
import Link from "next/link";

export default function EditPropertyPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, loading } = useAuth();
  
  const propertyId = Number(params.id);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [location, setLocation] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [propertyType, setPropertyType] = useState<"HOUSE" | "APARTMENT" | "COMMERCIAL">("APARTMENT");
  const [bedrooms, setBedrooms] = useState(2);
  const [bathrooms, setBathrooms] = useState(2);

  // Image Uploading States
  const [uploading, setUploading] = useState(false);
  const [imgbbKey, setImgbbKey] = useState("");
  const [uploadError, setUploadError] = useState("");

  // Fetch current property
  const { data: prop, isLoading: isFetching, error } = useQuery({
    queryKey: ["property", propertyId],
    queryFn: async () => {
      const response = await axios.get(`/api/v1/property/${propertyId}`);
      return response.data.data;
    },
    enabled: !!propertyId,
  });

  // Redirect if not agent or if property belongs to someone else
  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== "AGENT") {
        router.push("/auth/login");
      }
    }
  }, [user, loading]);

  useEffect(() => {
    if (prop) {
      // Security check: only listing agent can edit
      if (user && prop.agentId !== user.agentId) {
        alert("Unauthorized. You do not own this listing.");
        router.push("/dashboard/agent");
        return;
      }

      setTitle(prop.title);
      setDescription(prop.description);
      setImageUrl(prop.imageUrl);
      setLocation(prop.location);
      setPriceRange(prop.priceRange);
      setPropertyType(prop.propertyType);
      setBedrooms(prop.bedrooms || 0);
      setBathrooms(prop.bathrooms || 0);
    }
  }, [prop, user]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError("");

    const formData = new FormData();
    formData.append("image", file);
    if (imgbbKey.trim()) {
      formData.append("key", imgbbKey.trim());
    }

    try {
      const response = await axios.post("/api/v1/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.data.success) {
        setImageUrl(response.data.url);
      } else {
        setUploadError(response.data.message || "Failed to upload image.");
      }
    } catch (err: any) {
      setUploadError("Image upload failed. Using local mockup fallback.");
      // Set a random unsplash house image URL as fallback
      const fallbacks = [
        "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800",
        "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800",
        "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800",
      ];
      const selected = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      setImageUrl(selected);
    } finally {
      setUploading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim() || !location.trim() || !priceRange.trim()) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      const payload = {
        title,
        description,
        imageUrl,
        location,
        priceRange,
        propertyType,
        bedrooms: Number(bedrooms),
        bathrooms: Number(bathrooms),
      };

      const response = await axios.put(`/api/v1/property/${propertyId}`, payload);
      if (response.data.success) {
        alert("Property listing updated successfully!");
        queryClient.invalidateQueries({ queryKey: ["property", propertyId] });
        queryClient.invalidateQueries({ queryKey: ["agent-properties"] });
        queryClient.invalidateQueries({ queryKey: ["properties"] });
        router.push("/dashboard/agent");
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update property listing.");
    }
  };

  if (loading || isFetching) {
    return (
      <div className="flex flex-1 items-center justify-center p-16">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !prop) {
    return (
      <div className="mx-auto max-w-md p-16 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-zinc-200">Listing not found</h2>
        <p className="mt-2 text-sm text-zinc-500">The property you are trying to edit does not exist or has been removed.</p>
        <Link href="/dashboard/agent" className="mt-6 inline-flex items-center gap-1 text-emerald-400 hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Back Button */}
      <Link
        href="/dashboard/agent"
        className="inline-flex items-center gap-1 text-sm font-semibold text-zinc-400 hover:text-zinc-200 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 sm:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-100 flex items-center gap-2">
            Edit Property Listing
          </h1>
          <p className="text-sm text-zinc-500">
            Update listing configurations. Modifications will save immediately.
          </p>
        </div>

        {/* Imgbb Key configurations (Optional) */}
        <div className="rounded-xl bg-zinc-950 p-4 border border-zinc-900 space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
            Imgbb API Key (Optional)
          </label>
          <input
            type="text"
            placeholder="Enter key to upload to your Imgbb. Otherwise uses fallback."
            value={imgbbKey}
            onChange={(e) => setImgbbKey(e.target.value)}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-zinc-300 focus:outline-none"
          />
        </div>

        {/* Form */}
        <form onSubmit={handleFormSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
              Property Title
            </label>
            <input
              type="text"
              placeholder="e.g. Luxury Penthouse"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-700 focus:border-emerald-500 focus:outline-none"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
              Description
            </label>
            <textarea
              placeholder="Provide listing details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-700 focus:border-emerald-500 focus:outline-none"
              required
            />
          </div>

          {/* Location and Price Range Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Location */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                Location / Address
              </label>
              <input
                type="text"
                placeholder="e.g. Gulshan, Dhaka"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-700 focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                Price Range
              </label>
              <input
                type="text"
                placeholder="e.g. $1500-$1900"
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-700 focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Property Type and Specs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Property Type */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                Property Type
              </label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value as any)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none"
              >
                <option value="APARTMENT">Apartment</option>
                <option value="HOUSE">House</option>
                <option value="COMMERCIAL">Commercial Space</option>
              </select>
            </div>

            {/* Bedrooms */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                Bedrooms
              </label>
              <input
                type="number"
                min={0}
                value={bedrooms}
                onChange={(e) => setBedrooms(Number(e.target.value))}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Bathrooms */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                Bathrooms
              </label>
              <input
                type="number"
                min={0}
                value={bathrooms}
                onChange={(e) => setBathrooms(Number(e.target.value))}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Image Input and Upload */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500">
              Property Image
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-4 rounded-xl border border-dashed border-zinc-800 bg-zinc-950/40 p-5">
              <div className="flex flex-col items-center justify-center border border-zinc-800 bg-zinc-900/20 rounded-xl h-24 w-40 overflow-hidden shrink-0">
                {imageUrl ? (
                  <img src={imageUrl} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-zinc-700" />
                )}
              </div>

              <div className="flex-1 space-y-2 text-center sm:text-left w-full">
                <div className="flex justify-center sm:justify-start">
                  <label className="flex items-center gap-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:text-white px-3.5 py-2 text-xs font-semibold text-zinc-200 cursor-pointer">
                    {uploading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Upload className="h-3.5 w-3.5" />
                    )}
                    {uploading ? "Uploading..." : "Upload New Image"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Direct Image URL input */}
            <input
              type="url"
              placeholder="Or paste property image URL directly..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-700 focus:border-emerald-500 focus:outline-none"
            />
            {uploadError && (
              <div className="flex items-center gap-1 text-xs text-amber-500">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full rounded-xl bg-emerald-600 py-3.5 text-sm font-semibold text-white shadow-md hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2"
          >
            <Save className="h-4.5 w-4.5" />
            Save Modifications
          </button>
        </form>
      </div>
    </div>
  );
}
