'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Issue } from '@/lib/types';
import IssueCard from '@/components/IssueCard';
import { FileText, PlusCircle, CheckCircle2, Clock, AlertCircle, ArrowRight, Shield } from 'lucide-react';

function MyReportsContent() {
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const submittedJustNow = searchParams.get('submitted') === 'true';

  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'All' | 'Pending' | 'In Progress' | 'Resolved'>('All');

  const fetchMyIssues = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/issues/my');
      if (res.ok) {
        const data = await res.json();
        setIssues(data.issues || []);
      }
    } catch (err) {
      console.error('Error fetching citizen reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMyIssues();
    }
  }, [user]);

  if (!authLoading && !user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto">
          <FileText className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Sign In to View Your Reports</h2>
        <p className="text-xs text-slate-500">
          Track the progress and municipality responses for your submitted civic issues.
        </p>
        <Link
          href="/login"
          className="inline-block mt-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const filteredIssues = activeTab === 'All'
    ? issues
    : issues.filter((i) => {
        if (activeTab === 'Pending') return i.status === 'Pending' || i.status === 'Under Review';
        return i.status === activeTab;
      });

  const pendingCount = issues.filter((i) => i.status === 'Pending' || i.status === 'Under Review').length;
  const inProgressCount = issues.filter((i) => i.status === 'In Progress').length;
  const resolvedCount = issues.filter((i) => i.status === 'Resolved').length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Success banner if redirected from submit */}
      {submittedJustNow && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-sm text-emerald-800 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold">Issue Reported Successfully!</p>
              <p className="text-xs text-emerald-700">The municipality has received your report. You can track official responses right here.</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              My Civic Reports
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
              {issues.length} {issues.length === 1 ? 'Report' : 'Reports'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track real-time status updates and official municipal response notes for all your reported issues.
          </p>
        </div>

        <Link
          href="/report"
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          Report Another Issue
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('All')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'All'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Reports ({issues.length})
        </button>
        <button
          onClick={() => setActiveTab('Pending')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'Pending'
              ? 'bg-amber-500 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Pending / Review ({pendingCount})
        </button>
        <button
          onClick={() => setActiveTab('In Progress')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'In Progress'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          In Progress ({inProgressCount})
        </button>
        <button
          onClick={() => setActiveTab('Resolved')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'Resolved'
              ? 'bg-emerald-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Resolved ({resolvedCount})
        </button>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="text-center py-20 text-slate-400 text-sm">
          Loading your reports...
        </div>
      ) : filteredIssues.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200/80 p-8 space-y-4">
          <FileText className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">
            {activeTab === 'All' ? 'No reports submitted yet' : `No reports under ${activeTab}`}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Report any pothole, waste accumulation, broken streetlight or water leak in your area to get municipal response.
          </p>
          <Link
            href="/report"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            Report an Issue Now
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIssues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} />
          ))}
        </div>
      )}

    </div>
  );
}

export default function MyReportsPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-slate-400 text-sm">Loading your reports...</div>}>
      <MyReportsContent />
    </Suspense>
  );
}

