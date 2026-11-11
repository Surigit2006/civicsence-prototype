'use client';

import React, { useState } from 'react';
import { Issue } from '@/lib/types';
import { MapPin, Calendar, User, MessageSquare, CheckCircle, Clock, AlertTriangle, XCircle, Info, ExternalLink } from 'lucide-react';

interface IssueCardProps {
  issue: Issue;
  onRespond?: (issue: Issue) => void;
  isAdmin?: boolean;
}

export default function IssueCard({ issue, onRespond, isAdmin = false }: IssueCardProps) {
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5" /> Resolved
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3.5 h-3.5" /> In Progress
          </span>
        );
      case 'Under Review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
            <Info className="w-3.5 h-3.5" /> Under Review
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <XCircle className="w-3.5 h-3.5" /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5" /> Pending Review
          </span>
        );
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between">
        <div>
          {/* Photo & Status Header */}
          <div className="relative h-48 w-full bg-slate-100 overflow-hidden group">
            {issue.photo_url ? (
              <img
                src={issue.photo_url}
                alt={issue.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                onClick={() => setShowPhotoModal(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                No image available
              </div>
            )}

            <div className="absolute top-3 left-3">
              <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-900/80 backdrop-blur-xs text-white">
                {issue.category}
              </span>
            </div>

            <div className="absolute top-3 right-3">
              {getStatusBadge(issue.status)}
            </div>

            <button
              onClick={() => setShowPhotoModal(true)}
              className="absolute bottom-3 right-3 bg-white/90 hover:bg-white text-slate-700 text-xs px-2.5 py-1 rounded-md backdrop-blur-xs shadow-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity"
            >
              Enlarge Photo
            </button>
          </div>

          {/* Content Body */}
          <div className="p-5 space-y-3.5">
            <div>
              <h3 className="text-lg font-bold text-slate-900 leading-snug">{issue.title}</h3>
              {issue.description && (
                <p className="text-sm text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                  {issue.description}
                </p>
              )}
            </div>

            {/* Location Details */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs text-slate-700">
              <div className="flex items-start gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-900">{issue.street_name}</span>
                  <p className="text-slate-500">Landmark: <span className="text-slate-700 font-medium">{issue.landmark}</span></p>
                </div>
              </div>
              <div className="pl-5 text-[11px] font-mono text-slate-500">
                Coords: {issue.latitude.toFixed(5)}, {issue.longitude.toFixed(5)}
              </div>
            </div>

            {/* Municipality Response Section (Crucial Feature) */}
            {issue.admin_response ? (
              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                    Municipality Official Response
                  </span>
                  {issue.responded_at && (
                    <span className="text-[10px] text-emerald-700 font-medium">
                      {formatDate(issue.responded_at)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-emerald-950 font-medium leading-relaxed">
                  "{issue.admin_response}"
                </p>
                {issue.responder_username && (
                  <p className="text-[10px] text-emerald-700">
                    Handled by: <span className="font-semibold">{issue.responder_username}</span> (Municipality Staff)
                  </p>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/60 text-xs text-amber-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Awaiting official review and response from the municipality.</span>
              </div>
            )}
          </div>
        </div>

        {/* Card Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(issue.created_at)}
            </span>
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              {issue.username || 'Citizen'}
            </span>
          </div>

          {isAdmin && onRespond && (
            <button
              onClick={() => onRespond(issue)}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-xs transition-colors"
            >
              Respond & Update
            </button>
          )}
        </div>
      </div>

      {/* Enlarged Photo Modal */}
      {showPhotoModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowPhotoModal(false)}
        >
          <div 
            className="relative max-w-3xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900">{issue.title}</h4>
                <p className="text-xs text-slate-500">{issue.street_name}, {issue.landmark}</p>
              </div>
              <button
                onClick={() => setShowPhotoModal(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto flex items-center justify-center bg-slate-950 p-2">
              <img
                src={issue.photo_url}
                alt={issue.title}
                className="max-h-[70vh] w-auto object-contain rounded"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

