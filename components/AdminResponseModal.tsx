'use client';

import React, { useState } from 'react';
import { Issue, IssueStatus } from '@/lib/types';
import { X, Send, AlertCircle, CheckCircle, Clock, ShieldCheck, MapPin, User, Calendar } from 'lucide-react';

interface AdminResponseModalProps {
  issue: Issue | null;
  onClose: () => void;
  onSuccess: (updatedIssue: Issue) => void;
}

const STATUS_OPTIONS: { value: IssueStatus; label: string; desc: string }[] = [
  { value: 'Under Review', label: 'Under Review', desc: 'Department has acknowledged and scheduled an inspection.' },
  { value: 'In Progress', label: 'In Progress', desc: 'Field crew or contractor is currently resolving the issue.' },
  { value: 'Resolved', label: 'Resolved', desc: 'Work has been successfully completed and verified.' },
  { value: 'Rejected', label: 'Rejected', desc: 'Duplicate report, private property, or not within municipal jurisdiction.' },
  { value: 'Pending', label: 'Pending', desc: 'Awaiting initial review.' },
];

const QUICK_RESPONSES: Record<string, string[]> = {
  'Roads & Potholes': [
    'Road maintenance crew has been dispatched to patch the pothole. Work expected within 24 hours.',
    'Pothole filled with asphalt mix and rolled smooth. Issue resolved.',
  ],
  'Garbage & Waste': [
    'Sanitation team has cleared the accumulated garbage and sanitized the container area.',
    'Waste collection vehicle dispatched for immediate pickup.',
  ],
  'Street Lighting': [
    'Electrical maintenance team scheduled to replace the faulty bulb/fixture today.',
    'Streetlight fixture repaired and light is fully functional.',
  ],
  'Water & Sewage': [
    'Water supply and drainage engineers inspected the pipeline leak and repairs are underway.',
    'Leakage repaired and pressure restored.',
  ],
};

export default function AdminResponseModal({ issue, onClose, onSuccess }: AdminResponseModalProps) {
  if (!issue) return null;

  const [status, setStatus] = useState<IssueStatus>(issue.status);
  const [responseMsg, setResponseMsg] = useState(issue.admin_response || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!responseMsg.trim()) {
      setError('Please provide an official response message for the citizen.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/issues/${issue.id}/respond`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          admin_response: responseMsg.trim(),
        }),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        throw new Error(`Server returned status ${res.status}. Please check Vercel function logs.`);
      }
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit municipality response');
      }

      onSuccess(data.issue);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative max-w-2xl w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="font-bold text-base">Municipality Official Action & Response</h3>
              <p className="text-xs text-slate-300">Issue #{issue.id}: {issue.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Issue Info Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div className="space-y-1">
              <p className="text-slate-500">Citizen Reporter:</p>
              <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                {issue.username || 'Citizen'}
              </p>
              <p className="text-slate-500 mt-2">Location:</p>
              <p className="font-medium text-slate-800 flex items-start gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>{issue.street_name}, {issue.landmark}</span>
              </p>
            </div>
            <div>
              <p className="text-slate-500 mb-1">Attached Photo:</p>
              {issue.photo_url ? (
                <img
                  src={issue.photo_url}
                  alt={issue.title}
                  className="w-full h-24 object-cover rounded-lg border border-slate-200"
                />
              ) : (
                <div className="h-24 bg-slate-200 rounded-lg flex items-center justify-center text-slate-400">No Photo</div>
              )}
            </div>
          </div>

          {/* Status Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Update Status <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setStatus(opt.value)}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                    status === opt.value
                      ? 'border-purple-600 bg-purple-50/80 ring-2 ring-purple-600/20 font-semibold text-purple-900'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="font-bold">{opt.label}</div>
                  <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Quick response helpers */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Quick Response Templates
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(QUICK_RESPONSES[issue.category] || [
                'Maintenance team dispatched to inspect and resolve.',
                'Issue has been resolved and verified by local inspector.',
                'Scheduled for repair during the next road maintenance cycle.',
              ]).map((template, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setResponseMsg(template)}
                  className="px-2.5 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-left"
                >
                  + {template.substring(0, 45)}...
                </button>
              ))}
            </div>
          </div>

          {/* Official Response Message */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Official Municipality Response to Citizen <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={responseMsg}
              onChange={(e) => setResponseMsg(e.target.value)}
              placeholder="e.g., Road repair vehicle dispatched on 12th Nov. Pothole filled and cured. Thank you for reporting to the municipality."
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600"
              required
            />
            <p className="text-[11px] text-slate-500 mt-1">
              This response will appear immediately on the citizen's dashboard with timestamp and official municipality verification.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md shadow-purple-600/30 transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Submitting Response...' : 'Send Response & Update Status'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

