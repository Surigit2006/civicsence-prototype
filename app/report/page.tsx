'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import MapPicker from '@/components/MapPicker';
import { 
  Camera, 
  MapPin, 
  Send, 
  AlertCircle, 
  CheckCircle2, 
  Upload, 
  Trash2, 
  Building2, 
  LogIn, 
  Info,
  Navigation
} from 'lucide-react';

const CATEGORIES = [
  'Roads & Potholes',
  'Garbage & Waste',
  'Street Lighting',
  'Water & Sewage',
  'Public Amenities',
  'Other',
];

export default function ReportIssuePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [streetName, setStreetName] = useState('');
  const [landmark, setLandmark] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle Photo selection & compression to Base64
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPEG, PNG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize down to max 1280px dimension to ensure snappy upload & storage
        const maxDim = 1280;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setPhotoDataUrl(compressedDataUrl);
          setError(null);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleLocationChange = (lat: number, lng: number, suggestedAddress?: { road?: string; suburb?: string }) => {
    setLatitude(lat);
    setLongitude(lng);

    // Auto-fill suggested road / suburb if inputs are currently empty
    if (suggestedAddress) {
      if (suggestedAddress.road && !streetName.trim()) {
        setStreetName(suggestedAddress.road);
      }
      if (suggestedAddress.suburb && !landmark.trim()) {
        setLandmark(`Near ${suggestedAddress.suburb}`);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Form validations
    if (!title.trim()) {
      setError('Please enter a short summary / title for the issue.');
      return;
    }

    // Must post at least 1 photo!
    if (!photoDataUrl) {
      setError('You must upload at least 1 photo of the civic issue.');
      return;
    }

    // Location coordinates required
    if (latitude === null || longitude === null) {
      setError('Please pin the location of the issue on the map.');
      return;
    }

    // Street Name required
    if (!streetName.trim()) {
      setError('Please provide the street name.');
      return;
    }

    // Landmark required
    if (!landmark.trim()) {
      setError('Please provide a nearby landmark.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          category,
          description: description.trim(),
          photo_url: photoDataUrl,
          latitude,
          longitude,
          street_name: streetName.trim(),
          landmark: landmark.trim(),
        }),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        throw new Error(`Server returned status ${res.status}. Please check Vercel function logs.`);
      }
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit issue');
      }

      // Success -> navigate to user's reports
      router.push('/my-reports?submitted=true');
    } catch (err: any) {
      setError(err.message || 'An error occurred while submitting.');
      setSubmitting(false);
    }
  };

  // If user is not logged in
  if (!authLoading && !user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
          <Camera className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Sign In to Report an Issue</h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          Citizens can report civic problems (potholes, garbage, lights) to the municipality and track real-time resolution updates. Please sign in or create a quick account to continue.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/login"
            className="px-5 py-2.5 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/30 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="px-5 py-2.5 rounded-xl font-bold text-sm bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
          >
            Create Account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Page Title */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Report a Civic Issue to Municipality
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Provide issue details, upload a photo, and pinpoint the location on the map so municipal field crews can inspect and resolve it.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs sm:text-sm text-red-700 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* Section 1: Basic Info */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-5">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs flex items-center justify-center font-bold">1</span>
            Issue Overview
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Issue Summary / Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Deep pothole causing accidents near crossing"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Additional Details / Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the severity, how long it has been there, or any safety hazards..."
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Section 2: Photo Upload (Enforces: At least 1 pic) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs flex items-center justify-center font-bold">2</span>
              Upload Photo of the Issue <span className="text-red-500">* (At least 1 required)</span>
            </h2>
            {photoDataUrl && (
              <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Photo Attached
              </span>
            )}
          </div>

          {photoDataUrl ? (
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 max-w-md mx-auto group">
              <img
                src={photoDataUrl}
                alt="Civic Issue Preview"
                className="w-full h-64 object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setPhotoDataUrl(null)}
                  className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md"
                >
                  <Trash2 className="w-4 h-4" /> Remove Photo
                </button>
              </div>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-8 cursor-pointer transition-colors bg-slate-50/50 hover:bg-emerald-50/20">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-800">
                Click or drag & drop to upload photo
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Upload clear evidence of the civic issue (JPEG, PNG, WEBP)
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
                required
              />
            </label>
          )}
        </div>

        {/* Section 3: Map & Landmark Location */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-6">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs flex items-center justify-center font-bold">3</span>
            Location & Landmark Details
          </h2>

          {/* Interactive Map Picker */}
          <MapPicker
            latitude={latitude}
            longitude={longitude}
            onChange={handleLocationChange}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Street Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={streetName}
                  onChange={(e) => setStreetName(e.target.value)}
                  placeholder="e.g., Gandhi Road / 5th Cross Street"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Landmark <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="e.g., Near City Water Tank / Opposite SBI Bank"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Action */}
        <div className="flex items-center justify-end gap-4 pt-2">
          <Link
            href="/"
            className="px-5 py-3 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {submitting ? 'Submitting to Municipality...' : 'Submit Civic Issue'}
          </button>
        </div>

      </form>
    </div>
  );
}

