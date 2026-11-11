'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Issue, IssueStatus } from '@/lib/types';
import AllIssuesMap from '@/components/AllIssuesMap';
import IssueCard from '@/components/IssueCard';
import AdminResponseModal from '@/components/AdminResponseModal';
import { 
  ShieldCheck, 
  MapPin, 
  Filter, 
  Search, 
  MessageSquare, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  Layers, 
  RefreshCw,
  Building,
  User,
  ExternalLink
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'table' | 'map'>('table');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedIssueForResponse, setSelectedIssueForResponse] = useState<Issue | null>(null);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/issues');
      if (res.ok) {
        const data = await res.json();
        setIssues(data.issues || []);
      }
    } catch (err) {
      console.error('Failed to load issues for admin:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchIssues();
    }
  }, [user]);

  // Auth Guard
  if (!authLoading && user?.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">Municipality Admin Portal</h2>
        <p className="text-xs sm:text-sm text-slate-600">
          This portal is reserved for municipal officials to review citizen issues, deploy response crews, and issue official statements.
        </p>
        <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 text-xs text-purple-900">
          Sign in with admin credentials: <br />
          Username: <strong>admin</strong> | Password: <strong>admin</strong>
        </div>
        <Link
          href="/login"
          className="inline-block px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
        >
          Go to Sign In
        </Link>
      </div>
    );
  }

  // Filter logic
  const filteredIssues = issues.filter((issue) => {
    if (statusFilter !== 'All' && issue.status !== statusFilter) return false;
    if (categoryFilter !== 'All' && issue.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = issue.title.toLowerCase().includes(q);
      const matchStreet = issue.street_name.toLowerCase().includes(q);
      const matchLandmark = issue.landmark.toLowerCase().includes(q);
      const matchCitizen = (issue.username || '').toLowerCase().includes(q);
      if (!matchTitle && !matchStreet && !matchLandmark && !matchCitizen) return false;
    }
    return true;
  });

  const totalCount = issues.length;
  const pendingCount = issues.filter((i) => i.status === 'Pending').length;
  const reviewCount = issues.filter((i) => i.status === 'Under Review').length;
  const inProgressCount = issues.filter((i) => i.status === 'In Progress').length;
  const resolvedCount = issues.filter((i) => i.status === 'Resolved').length;

  const handleResponseSuccess = (updatedIssue: Issue) => {
    setIssues((prev) =>
      prev.map((i) => (i.id === updatedIssue.id ? updatedIssue : i))
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Resolved':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">Resolved</span>;
      case 'In Progress':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">In Progress</span>;
      case 'Under Review':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-orange-100 text-orange-800">Under Review</span>;
      case 'Rejected':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800">Rejected</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">Pending</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Admin Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Municipality Administration & Response Center
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review citizen complaints, inspect photos and map locations, assign teams, and send official municipality responses.
          </p>
        </div>

        <button
          onClick={fetchIssues}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Total Reports</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalCount}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-xs">
          <p className="text-xs font-medium text-amber-800">Pending Review</p>
          <p className="text-2xl font-black text-amber-600 mt-1">{pendingCount}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-orange-200 bg-orange-50/20 shadow-xs">
          <p className="text-xs font-medium text-orange-800">Under Review</p>
          <p className="text-2xl font-black text-orange-600 mt-1">{reviewCount}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-blue-200 bg-blue-50/20 shadow-xs">
          <p className="text-xs font-medium text-blue-800">In Progress</p>
          <p className="text-2xl font-black text-blue-600 mt-1">{inProgressCount}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-xs col-span-2 md:col-span-1">
          <p className="text-xs font-medium text-emerald-800">Resolved</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{resolvedCount}</p>
        </div>
      </div>

      {/* View Switcher & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        
        {/* View Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-fit">
          <button
            onClick={() => setActiveView('table')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeView === 'table'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Table & Action View
          </button>
          <button
            onClick={() => setActiveView('map')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeView === 'map'
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            City Map View
          </button>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search title, street, citizen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white font-medium text-slate-700 focus:outline-hidden focus:border-purple-600"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Under Review">Under Review</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Rejected">Rejected</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white font-medium text-slate-700 focus:outline-hidden focus:border-purple-600"
          >
            <option value="All">All Categories</option>
            <option value="Roads & Potholes">Roads & Potholes</option>
            <option value="Garbage & Waste">Garbage & Waste</option>
            <option value="Street Lighting">Street Lighting</option>
            <option value="Water & Sewage">Water & Sewage</option>
            <option value="Public Amenities">Public Amenities</option>
            <option value="Other">Other</option>
          </select>
        </div>

      </div>

      {/* Main Content Area */}
      {activeView === 'map' ? (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 mb-2">City-wide Issue Geographic Distribution</h3>
            <AllIssuesMap 
              issues={filteredIssues}
              onSelectIssue={(issue) => setSelectedIssueForResponse(issue)}
            />
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Photo</th>
                  <th className="py-3 px-4">Issue Details</th>
                  <th className="py-3 px-4">Location & Landmark</th>
                  <th className="py-3 px-4">Citizen</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Municipality Response</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredIssues.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No issues match the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredIssues.map((issue) => (
                    <tr key={issue.id} className="hover:bg-slate-50/80 transition-colors">
                      
                      {/* ID */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-500">
                        #{issue.id}
                      </td>

                      {/* Photo Thumbnail */}
                      <td className="py-3 px-4">
                        {issue.photo_url ? (
                          <img
                            src={issue.photo_url}
                            alt={issue.title}
                            className="w-12 h-12 object-cover rounded-lg border border-slate-200"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-[10px] text-slate-400">
                            No Pic
                          </div>
                        )}
                      </td>

                      {/* Title & Category */}
                      <td className="py-3 px-4 max-w-xs">
                        <span className="font-bold text-slate-900 block truncate">{issue.title}</span>
                        <span className="text-[11px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-medium mt-0.5 inline-block">
                          {issue.category}
                        </span>
                      </td>

                      {/* Location & Landmark */}
                      <td className="py-3 px-4 text-slate-700 max-w-xs">
                        <div className="font-medium truncate">{issue.street_name}</div>
                        <div className="text-slate-500 text-[11px] truncate">Near: {issue.landmark}</div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {issue.latitude.toFixed(4)}, {issue.longitude.toFixed(4)}
                        </div>
                      </td>

                      {/* Citizen */}
                      <td className="py-3 px-4 text-slate-600">
                        <span className="font-semibold text-slate-800">{issue.username || 'Citizen'}</span>
                        <span className="block text-[10px] text-slate-400">
                          {new Date(issue.created_at).toLocaleDateString()}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {getStatusBadge(issue.status)}
                      </td>

                      {/* Municipality Response */}
                      <td className="py-3 px-4 max-w-xs">
                        {issue.admin_response ? (
                          <div className="p-2 rounded bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] line-clamp-2">
                            "{issue.admin_response}"
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">No response sent yet</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedIssueForResponse(issue)}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-xs transition-colors"
                        >
                          Respond
                        </button>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Admin Response Modal */}
      {selectedIssueForResponse && (
        <AdminResponseModal
          issue={selectedIssueForResponse}
          onClose={() => setSelectedIssueForResponse(null)}
          onSuccess={handleResponseSuccess}
        />
      )}

    </div>
  );
}

