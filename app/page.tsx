'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Issue } from '@/lib/types';
import AllIssuesMap from '@/components/AllIssuesMap';
import IssueCard from '@/components/IssueCard';
import { PlusCircle, ShieldCheck, CheckCircle2, Clock, AlertTriangle, ArrowRight, MapPin, Building, Sparkles } from 'lucide-react';

export default function HomePage() {
  const { user } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/issues');
      if (res.ok) {
        const data = await res.json();
        setIssues(data.issues || []);
      }
    } catch (err) {
      console.error('Failed to load issues', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  const totalReports = issues.length;
  const resolvedReports = issues.filter((i) => i.status === 'Resolved').length;
  const inProgressReports = issues.filter((i) => i.status === 'In Progress').length;
  const pendingReports = issues.filter((i) => i.status === 'Pending').length;

  const categories = ['All', 'Roads & Potholes', 'Garbage & Waste', 'Street Lighting', 'Water & Sewage', 'Public Amenities', 'Other'];

  const filteredIssues = selectedCategory === 'All'
    ? issues
    : issues.filter((i) => i.category === selectedCategory);

  return (
    <div className="space-y-12 pb-16">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-900 via-slate-900 to-slate-950 text-white pt-16 pb-20 px-4 sm:px-6 lg:px-8">
        {/* Subtle decorative circles */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5" />
            Civic Issue Reporting & Municipal Response Portal
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-white">
            See a Problem in Your City? <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
              Report it & Get It Fixed.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 font-normal leading-relaxed">
            Report potholes, garbage overflow, broken lights, and water leaks directly to the municipality with a photo, pinpoint map location, and landmark. Track official municipal responses in real-time.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
            <Link
              href="/report"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5"
            >
              <PlusCircle className="w-5 h-5 text-slate-950" />
              Report Civic Issue Now
            </Link>

            {user?.role === 'citizen' ? (
              <Link
                href="/my-reports"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-xs transition-colors"
              >
                Track My Reports
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : user?.role === 'admin' ? (
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/25 transition-colors"
              >
                <ShieldCheck className="w-5 h-5" />
                Go to Admin Dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-xs transition-colors"
              >
                Sign In to Track
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>

          {/* Admin Demo Helper Banner */}
          <div className="pt-4 max-w-lg mx-auto">
            <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs text-slate-300 flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Municipality Admin Login:</span>
              </span>
              <div className="flex items-center gap-2 font-mono text-[11px] text-purple-300">
                <span>user: <strong>admin</strong></span>
                <span>•</span>
                <span>pass: <strong>admin</strong></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Row */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{totalReports}</p>
              <p className="text-xs font-medium text-slate-500">Total Reports</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-amber-600">{pendingReports}</p>
              <p className="text-xs font-medium text-slate-500">Pending Review</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-blue-600">{inProgressReports}</p>
              <p className="text-xs font-medium text-slate-500">In Progress</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-emerald-600">{resolvedReports}</p>
              <p className="text-xs font-medium text-slate-500">Resolved Issues</p>
            </div>
          </div>
        </div>
      </section>

      {/* Public Interactive Map Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              <MapPin className="w-6 h-6 text-emerald-600" />
              Live Municipality Issues Map
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Interactive map displaying citizen-reported civic issues with real-time municipality status pins.
            </p>
          </div>
          
          <Link
            href="/report"
            className="self-start sm:self-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
          >
            + Report New Issue
          </Link>
        </div>

        <AllIssuesMap issues={issues} />
      </section>

      {/* Reported Issues Feed */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Recent Civic Reports</h3>
            <p className="text-xs text-slate-500">Track issues and official responses in your neighborhood</p>
          </div>

          {/* Category filter tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-slate-400 text-sm">
            Loading civic issues...
          </div>
        ) : filteredIssues.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 space-y-3">
            <Building className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="font-bold text-slate-700">No issues found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {selectedCategory !== 'All' 
                ? `No reported issues under "${selectedCategory}".` 
                : 'No civic issues have been reported yet. Be the first citizen to report one!'}
            </p>
            <Link
              href="/report"
              className="inline-block mt-2 px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl"
            >
              Report an Issue
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredIssues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
