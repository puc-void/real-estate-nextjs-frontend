"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import axios from "axios";
import { ArrowLeft, Image as ImageIcon, Upload, Loader2, AlertCircle, Sparkles } from "lucide-react";
import Link from "next/link";

export default function AddPropertyPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect if not logged in or not an agent
  React.useEffect(() => {
    if (!loading && (!user || user.role !== "AGENT")) {
      router.push("/auth/login");
    }
  }, [user, loading]);

  // Image Uploading States
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [imgbbKey, setImgbbKey] = useState("");
  const [uploadError, setUploadError] = useState("");

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
        setUploadedUrl(response.data.url);
        // Set the value in the form
        form.setFieldValue("imageUrl", response.data.url);
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
      setUploadedUrl(selected);
      form.setFieldValue("imageUrl", selected);
    } finally {
      setUploading(false);
    }
  };

  // TanStack Form Setup
  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
      imageUrl: "",
      location: "",
      priceRange: "",
      propertyType: "APARTMENT" as "HOUSE" | "APARTMENT" | "COMMERCIAL",
      bedrooms: 2,
      bathrooms: 2,
    },
    onSubmit: async ({ value }) => {
      if (!user?.agentId) return;

      try {
        const payload = {
          ...value,
          agentId: user.agentId,
          // Convert bedrooms/bathrooms to numbers
          bedrooms: Number(value.bedrooms),
          bathrooms: Number(value.bathrooms),
        };

        const response = await axios.post("/api/v1/property", payload);
        if (response.data.success) {
          alert("Property listed successfully! Pending admin verification.");
          router.push("/dashboard/agent");
        }
      } catch (err: any) {
        alert(err.response?.data?.message || "Failed to add property.");
      }
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
            <Sparkles className="h-5 w-5 text-emerald-400" />
            Add New Property listing
          </h1>
          <p className="text-sm text-zinc-500">
            Publish a new real estate property. Standard listings will start as unverified until reviewed.
          </p>
        </div>

        {/* Imgbb Key configurations (Optional) */}
        <div className="rounded-xl bg-zinc-950 p-4 border border-zinc-900 space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
            Imgbb API Key (Optional)
          </label>
          <input
            type="text"
            placeholder="Enter key to upload to your Imgbb. Otherwise uses high-quality property fallback."
            value={imgbbKey}
            onChange={(e) => setImgbbKey(e.target.value)}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-zinc-300 focus:outline-none"
          />
        </div>

        {/* Main form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-6"
        >
          {/* Title */}
          <form.Field
            name="title"
            validators={{
              onChange: z.string().min(3, "Title must be at least 3 characters"),
            }}
            children={(field) => (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                  Property Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Luxury Penthouse at Gulshan"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-700 focus:border-emerald-500 focus:outline-none"
                />
                {field.state.meta.errors && (
                  <p className="mt-1 text-xs text-rose-400 font-medium">
                    {field.state.meta.errors.join(", ")}
                  </p>
                )}
              </div>
            )}
          />

          {/* Description */}
          <form.Field
            name="description"
            validators={{
              onChange: z.string().min(10, "Description must be at least 10 characters"),
            }}
            children={(field) => (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                  Description
                </label>
                <textarea
                  placeholder="Provide details about rooms, amenities, parking space, rooftop access, building policies, etc."
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-700 focus:border-emerald-500 focus:outline-none"
                />
                {field.state.meta.errors && (
                  <p className="mt-1 text-xs text-rose-400 font-medium">
                    {field.state.meta.errors.join(", ")}
                  </p>
                )}
              </div>
            )}
          />

          {/* Location and Price Range Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Location */}
            <form.Field
              name="location"
              validators={{
                onChange: z.string().min(3, "Location must be at least 3 characters"),
              }}
              children={(field) => (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                    Location / Address
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Gulshan-2, Dhaka"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-700 focus:border-emerald-500 focus:outline-none"
                  />
                  {field.state.meta.errors && (
                    <p className="mt-1 text-xs text-rose-400 font-medium">
                      {field.state.meta.errors.join(", ")}
                    </p>
                  )}
                </div>
              )}
            />

            {/* Price Range */}
            <form.Field
              name="priceRange"
              validators={{
                onChange: z.string().min(3, "Price range is required"),
              }}
              children={(field) => (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                    Price Range
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. $1500-$1900"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-700 focus:border-emerald-500 focus:outline-none"
                  />
                  {field.state.meta.errors && (
                    <p className="mt-1 text-xs text-rose-400 font-medium">
                      {field.state.meta.errors.join(", ")}
                    </p>
                  )}
                </div>
              )}
            />
          </div>

          {/* Property Type and Specs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Property Type */}
            <form.Field
              name="propertyType"
              children={(field) => (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                    Property Type
                  </label>
                  <select
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value as any)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="APARTMENT">Apartment</option>
                    <option value="HOUSE">House</option>
                    <option value="COMMERCIAL">Commercial Space</option>
                  </select>
                </div>
              )}
            />

            {/* Bedrooms */}
            <form.Field
              name="bedrooms"
              children={(field) => (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                    Bedrooms
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(Number(e.target.value))}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              )}
            />

            {/* Bathrooms */}
            <form.Field
              name="bathrooms"
              children={(field) => (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                    Bathrooms
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(Number(e.target.value))}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              )}
            />
          </div>

          {/* Image Upload Input */}
          <form.Field
            name="imageUrl"
            validators={{
              onChange: z.string().url("Must be a valid property image URL"),
            }}
            children={(field) => (
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Property Image
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-4 rounded-xl border border-dashed border-zinc-800 bg-zinc-950/40 p-5">
                  <div className="flex flex-col items-center justify-center border border-zinc-800 bg-zinc-900/20 rounded-xl h-24 w-40 overflow-hidden shrink-0">
                    {uploadedUrl ? (
                      <img src={uploadedUrl} alt="Preview" className="h-full w-full object-cover" />
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
                        {uploading ? "Uploading..." : "Upload Image File"}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={uploading}
                        />
                      </label>
                    </div>
                    <p className="text-3xs text-zinc-655">
                      Supports JPG, PNG formats. If no file is chosen, input a custom URL below.
                    </p>
                  </div>
                </div>

                {/* Text URL Input option */}
                <input
                  type="url"
                  placeholder="Or paste property image URL directly here..."
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => {
                    field.handleChange(e.target.value);
                    setUploadedUrl(e.target.value);
                  }}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-700 focus:border-emerald-500 focus:outline-none"
                />

                {field.state.meta.errors && (
                  <p className="mt-1 text-xs text-rose-400 font-medium">
                    {field.state.meta.errors.join(", ")}
                  </p>
                )}
                {uploadError && (
                  <div className="flex items-center gap-1 text-xs text-amber-500">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}
              </div>
            )}
          />

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full rounded-xl bg-emerald-600 py-3.5 text-sm font-semibold text-white shadow-md hover:bg-emerald-500 transition-colors"
          >
            Create Listing
          </button>
        </form>
      </div>
    </div>
  );
}
