// src/hooks/useGeolocation.js
// Shared GPS hook — used by all map-enabled pages in BloodConnect
import { useState, useCallback } from 'react';

/**
 * useGeolocation
 * Returns { location, loading, error, getLocation, clearError }
 *
 * location → { lat, lng } or null
 * getLocation() → Promise<{ lat, lng }> — triggers browser GPS prompt
 */
export function useGeolocation() {
  const [location, setLocation] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  const getLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const msg = 'Geolocation is not supported by your browser.';
        setError(msg);
        reject(new Error(msg));
        return;
      }

      setLoading(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setLocation(coords);
          setLoading(false);
          resolve(coords);
        },
        (err) => {
          let msg = 'Could not get your location.';
          if (err.code === err.PERMISSION_DENIED)  msg = 'Location permission denied. Please allow location access.';
          if (err.code === err.POSITION_UNAVAILABLE) msg = 'Location unavailable. Check your device settings.';
          if (err.code === err.TIMEOUT)              msg = 'Location request timed out. Please try again.';
          setError(msg);
          setLoading(false);
          reject(new Error(msg));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { location, loading, error, getLocation, clearError };
}

/**
 * calculateDistance
 * Haversine formula — returns distance in km between two lat/lng points
 */
export function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * reverseGeocode
 * Uses Nominatim (free, no API key) to get a city/district name from lat/lng
 * Returns a human-readable address string
 */
export async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    const a = data.address || {};
    // Build a short readable label: "City, District" or "Suburb, City"
    const parts = [
      a.suburb || a.neighbourhood || a.village || a.town,
      a.city || a.district || a.county || a.state_district,
    ].filter(Boolean);
    return parts.join(', ') || data.display_name?.split(',').slice(0, 2).join(',') || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}
