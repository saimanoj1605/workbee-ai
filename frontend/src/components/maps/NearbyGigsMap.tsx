"use client";

import { MapPin } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { api } from "@/lib/api";

type NearbyGig = {
  id: string;
  title: string;
  location: string | null;
  latitude: number;
  longitude: number;
  distanceKm: number;
  business: { businessName: string };
};

export default function NearbyGigsMap() {
  const [gigs, setGigs] = useState<NearbyGig[]>([]);
  const [loading, setLoading] = useState(true);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null
  );

  const loadNearby = useCallback(async (lat: number, lng: number) => {
    try {
      const data = await api<{ gigs: NearbyGig[] }>(
        `/api/ai/nearby?lat=${lat}&lng=${lng}&radius=25`
      );
      setGigs(data.gigs);
    } catch {
      setGigs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });
        loadNearby(lat, lng);
      },
      () => setLoading(false)
    );
  }, [loadNearby]);

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground flex items-center gap-2">
        <MapPin className="w-4 h-4 animate-pulse" />
        Finding gigs near you...
      </p>
    );
  }

  if (!coords) {
    return (
      <p className="text-sm text-muted-foreground">
        Enable location to see nearby gigs.
      </p>
    );
  }

  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  return (
    <div className="space-y-4">
      {mapsKey ? (
        <iframe
          title="Nearby gigs map"
          className="w-full h-64 rounded-xl border border-border"
          loading="lazy"
          src={`https://www.google.com/maps/embed/v1/view?key=${mapsKey}&center=${coords.lat},${coords.lng}&zoom=12`}
        />
      ) : (
        <div className="w-full h-48 rounded-xl border border-border bg-muted flex items-center justify-center text-sm text-muted-foreground">
          Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY for live map
        </div>
      )}

      <ul className="space-y-2">
        {gigs.length === 0 ? (
          <li className="text-sm text-muted-foreground">No open gigs nearby.</li>
        ) : (
          gigs.map((gig) => (
            <li
              key={gig.id}
              className="flex justify-between items-start p-3 rounded-lg border border-border text-sm"
            >
              <div>
                <p className="font-medium">{gig.title}</p>
                <p className="text-muted-foreground">{gig.business.businessName}</p>
              </div>
              <span className="text-primary whitespace-nowrap">
                {gig.distanceKm.toFixed(1)} km
              </span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
