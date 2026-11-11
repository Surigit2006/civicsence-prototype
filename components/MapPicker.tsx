'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Loader2 } from 'lucide-react';

interface MapPickerProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number, suggestedAddress?: { road?: string; suburb?: string }) => void;
}

export default function MapPicker({ latitude, longitude, onChange }: MapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [locating, setLocating] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Default coordinate (City center or fallback: e.g. 13.0827, 80.2707 or 40.7128, -74.0060)
  const defaultLat = latitude || 13.0827;
  const defaultLng = longitude || 80.2707;

  useEffect(() => {
    let isMounted = true;

    // Dynamically load leaflet on client only
    const initMap = async () => {
      if (!mapContainerRef.current) return;
      if (mapInstanceRef.current) return;

      const L = (await import('leaflet')).default;
      if (!isMounted || !mapContainerRef.current || mapInstanceRef.current) return;

      if ((mapContainerRef.current as any)._leaflet_id) {
        (mapContainerRef.current as any)._leaflet_id = null;
      }

      // Create custom SVG marker icon
      const createCustomIcon = () => {
        return L.divIcon({
          className: 'custom-map-marker',
          html: `
            <div style="
              width: 34px;
              height: 34px;
              background: #059669;
              border: 3px solid #ffffff;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              box-shadow: 0 4px 10px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
            ">
              <div style="
                width: 10px;
                height: 10px;
                background: #ffffff;
                border-radius: 50%;
                transform: rotate(45deg);
              "></div>
            </div>
          `,
          iconSize: [34, 34],
          iconAnchor: [17, 34],
          popupAnchor: [0, -34],
        });
      };

      const map = L.map(mapContainerRef.current).setView([defaultLat, defaultLng], latitude && longitude ? 15 : 12);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      // Function to reverse geocode
      const reverseLookup = async (lat: number, lng: number) => {
        try {
          setGeocoding(true);
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
            { headers: { 'Accept-Language': 'en' } }
          );
          if (res.ok) {
            const data = await res.json();
            const road = data.address?.road || data.address?.pedestrian || data.address?.suburb || '';
            const suburb = data.address?.neighbourhood || data.address?.suburb || data.address?.city_district || data.address?.city || '';
            onChange(lat, lng, { road, suburb });
            return;
          }
        } catch {
          // Ignore reverse geocode failures
        } finally {
          setGeocoding(false);
        }
        onChange(lat, lng);
      };

      // Place or update marker
      const setMarker = (lat: number, lng: number, shouldLookup = true) => {
        if (!markerRef.current) {
          const marker = L.marker([lat, lng], {
            icon: createCustomIcon(),
            draggable: true,
          }).addTo(map);

          marker.on('dragend', () => {
            const pos = marker.getLatLng();
            reverseLookup(pos.lat, pos.lng);
          });

          markerRef.current = marker;
        } else {
          markerRef.current.setLatLng([lat, lng]);
        }

        if (shouldLookup) {
          reverseLookup(lat, lng);
        }
      };

      if (latitude && longitude) {
        setMarker(latitude, longitude, false);
      }

      // Click event on map
      map.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        setMarker(lat, lng, true);
      });
    };

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  // Update marker if external lat/lng changes
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current && latitude && longitude) {
      markerRef.current.setLatLng([latitude, longitude]);
    }
  }, [latitude, longitude]);

  // Handle GPS Locate Me
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      return;
    }

    setLocating(true);
    setErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setLocating(false);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([lat, lng], 16, { duration: 1.5 });
          
          const L = (await import('leaflet')).default;
          if (!markerRef.current) {
            const customIcon = L.divIcon({
              className: 'custom-map-marker',
              html: `
                <div style="
                  width: 34px;
                  height: 34px;
                  background: #059669;
                  border: 3px solid #ffffff;
                  border-radius: 50% 50% 50% 0;
                  transform: rotate(-45deg);
                  box-shadow: 0 4px 10px rgba(0,0,0,0.3);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  cursor: pointer;
                ">
                  <div style="width: 10px; height: 10px; background: #fff; border-radius: 50%; transform: rotate(45deg);"></div>
                </div>
              `,
              iconSize: [34, 34],
              iconAnchor: [17, 34],
            });

            const marker = L.marker([lat, lng], {
              icon: customIcon,
              draggable: true,
            }).addTo(mapInstanceRef.current);

            marker.on('dragend', () => {
              const p = marker.getLatLng();
              onChange(p.lat, p.lng);
            });

            markerRef.current = marker;
          } else {
            markerRef.current.setLatLng([lat, lng]);
          }

          // Trigger reverse lookup
          try {
            setGeocoding(true);
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`, {
              headers: { 'Accept-Language': 'en' },
            });
            if (res.ok) {
              const data = await res.json();
              const road = data.address?.road || data.address?.pedestrian || data.address?.suburb || '';
              const suburb = data.address?.neighbourhood || data.address?.suburb || data.address?.city_district || data.address?.city || '';
              onChange(lat, lng, { road, suburb });
              return;
            }
          } catch {
            // Ignore
          } finally {
            setGeocoding(false);
          }
          onChange(lat, lng);
        }
      },
      (err) => {
        setLocating(false);
        setErrorMsg('Could not detect your GPS location. Please click on the map to drop a pin manually.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-emerald-600" />
          Pin Location on Map <span className="text-red-500">*</span>
        </label>
        
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={locating}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors disabled:opacity-50"
        >
          {locating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
          {locating ? 'Locating...' : 'Use My GPS Location'}
        </button>
      </div>

      <p className="text-xs text-slate-500">
        Click anywhere on the map or drag the pin to mark the exact location of the issue.
      </p>

      {errorMsg && (
        <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
          {errorMsg}
        </div>
      )}

      {/* Map Canvas */}
      <div className="relative rounded-xl overflow-hidden border border-slate-300 shadow-inner h-72 w-full bg-slate-100">
        <div ref={mapContainerRef} className="h-full w-full" />

        {geocoding && (
          <div className="absolute top-2 right-2 z-20 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-md text-[11px] font-medium text-slate-600 border border-slate-200 shadow-xs flex items-center gap-1.5">
            <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />
            Fetching address suggestions...
          </div>
        )}

        {latitude && longitude && (
          <div className="absolute bottom-2 left-2 z-20 bg-white/95 backdrop-blur-xs px-2.5 py-1.5 rounded-md text-[11px] font-medium text-slate-700 border border-slate-200 shadow-xs">
            📍 Coordinates: <span className="font-mono text-emerald-700">{latitude.toFixed(5)}, {longitude.toFixed(5)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

