'use client';

import React, { useEffect, useRef } from 'react';
import { Issue } from '@/lib/types';

interface AllIssuesMapProps {
  issues: Issue[];
  onSelectIssue?: (issue: Issue) => void;
}

export default function AllIssuesMap({ issues, onSelectIssue }: AllIssuesMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    const initMap = async () => {
      if (!mapContainerRef.current) return;
      if (mapInstanceRef.current) return;

      const L = (await import('leaflet')).default;
      if (!isMounted || !mapContainerRef.current || mapInstanceRef.current) return;

      if ((mapContainerRef.current as any)._leaflet_id) {
        (mapContainerRef.current as any)._leaflet_id = null;
      }

      // Determine initial center
      const defaultCenter: [number, number] = issues.length > 0
        ? [issues[0].latitude, issues[0].longitude]
        : [13.0827, 80.2707];

      const map = L.map(mapContainerRef.current).setView(defaultCenter, issues.length > 0 ? 12 : 11);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      mapInstanceRef.current = map;

      renderMarkers(L, map, markersGroup);
    };

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersLayerRef.current = null;
      }
    };
  }, []);

  const renderMarkers = async (L: any, map: any, group: any) => {
    if (!L || !group) return;
    group.clearLayers();

    if (issues.length === 0) return;

    const bounds = L.latLngBounds([]);

    issues.forEach((issue) => {
      if (!issue.latitude || !issue.longitude) return;

      bounds.extend([issue.latitude, issue.longitude]);

      const getStatusColor = (status: string) => {
        switch (status) {
          case 'Resolved': return '#16a34a'; // green
          case 'In Progress': return '#2563eb'; // blue
          case 'Under Review': return '#ea580c'; // orange
          case 'Rejected': return '#dc2626'; // red
          default: return '#ca8a04'; // yellow/amber for Pending
        }
      };

      const color = getStatusColor(issue.status);

      const customIcon = L.divIcon({
        className: 'civic-issue-marker',
        html: `
          <div style="
            width: 28px;
            height: 28px;
            background: ${color};
            border: 2px solid #ffffff;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 3px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="width: 8px; height: 8px; background: #fff; border-radius: 50%; transform: rotate(45deg);"></div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -28],
      });

      const popupHtml = `
        <div style="min-width: 220px; font-family: sans-serif; font-size: 12px; line-height: 1.4;">
          ${issue.photo_url ? `<img src="${issue.photo_url}" style="width: 100%; height: 110px; object-fit: cover; border-radius: 6px; margin-bottom: 6px;" alt="${issue.title}" />` : ''}
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="font-size: 10px; font-weight: bold; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; color: #475569;">${issue.category}</span>
            <span style="font-size: 10px; font-weight: bold; color: ${color};">${issue.status}</span>
          </div>
          <h4 style="font-weight: 700; margin: 0 0 4px 0; color: #0f172a; font-size: 13px;">${issue.title}</h4>
          <p style="margin: 0 0 2px 0; color: #334155;"><strong>Street:</strong> ${issue.street_name}</p>
          <p style="margin: 0 0 6px 0; color: #334155;"><strong>Landmark:</strong> ${issue.landmark}</p>
          ${issue.admin_response ? `<div style="background: #ecfdf5; border-left: 3px solid #10b981; padding: 4px 6px; margin-bottom: 6px; font-size: 11px;"><strong>Municipality:</strong> ${issue.admin_response}</div>` : ''}
          <p style="margin: 0; font-size: 10px; color: #64748b;">Reported by: ${issue.username || 'Citizen'}</p>
        </div>
      `;

      const marker = L.marker([issue.latitude, issue.longitude], { icon: customIcon });
      marker.bindPopup(popupHtml);

      if (onSelectIssue) {
        marker.on('click', () => {
          onSelectIssue(issue);
        });
      }

      group.addLayer(marker);
    });

    if (issues.length > 0 && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  };

  // Re-render markers if issues change
  useEffect(() => {
    if (mapInstanceRef.current && markersLayerRef.current) {
      import('leaflet').then((L) => {
        renderMarkers(L.default, mapInstanceRef.current, markersLayerRef.current);
      });
    }
  }, [issues]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm h-96 w-full bg-slate-100">
      <div ref={mapContainerRef} className="h-full w-full" />
      
      {/* Legend */}
      <div className="absolute bottom-3 right-3 z-20 bg-white/95 backdrop-blur-xs p-3 rounded-xl border border-slate-200 shadow-md text-xs space-y-1.5">
        <p className="font-semibold text-slate-800 text-[11px] uppercase tracking-wider mb-1">Issue Status</p>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-500"></span>
          <span className="text-slate-600">Pending Review</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-600"></span>
          <span className="text-slate-600">In Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
          <span className="text-slate-600">Resolved</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-600"></span>
          <span className="text-slate-600">Rejected / Closed</span>
        </div>
      </div>
    </div>
  );
}

