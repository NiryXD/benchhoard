// ─── [Opus 4.8] Benchhoard — device location + compass heading ──────────────
import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

import type { Coords } from './benches';

export type LocationState = {
  coords: Coords | null;
  status: 'loading' | 'granted' | 'denied';
};

/** One-shot device location, with graceful denial (the map still loads). */
export function useDeviceLocation(): LocationState {
  const [state, setState] = useState<LocationState>({ coords: null, status: 'loading' });
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (!active) return;
        if (status !== 'granted') {
          setState({ coords: null, status: 'denied' });
          return;
        }
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (!active) return;
        setState({ coords: { lat: pos.coords.latitude, lng: pos.coords.longitude }, status: 'granted' });
      } catch {
        if (active) setState({ coords: null, status: 'denied' });
      }
    })();
    return () => {
      active = false;
    };
  }, []);
  return state;
}

export type HeadingState = { heading: number | null; accuracy: number | null };

/**
 * Live magnetic/true compass heading in degrees (0 = north), via expo-location's
 * magnetometer stream — no extra native module needed. Returns null until the
 * first reading arrives or if the device has no compass.
 */
export function useHeading(): HeadingState {
  const [state, setState] = useState<HeadingState>({ heading: null, accuracy: null });
  useEffect(() => {
    let active = true;
    let sub: Location.LocationSubscription | null = null;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted' || !active) return;
        sub = await Location.watchHeadingAsync((h) => {
          // trueHeading is -1 when unavailable; fall back to magnetic north.
          setState({ heading: h.trueHeading >= 0 ? h.trueHeading : h.magHeading, accuracy: h.accuracy });
        });
      } catch {
        // no compass on this device — leave heading null
      }
    })();
    return () => {
      active = false;
      sub?.remove();
    };
  }, []);
  return state;
}

/** Geocode a typed place name to coordinates (used when adding a bench by address). */
export async function geocodeAddress(address: string): Promise<Coords | null> {
  const trimmed = address.trim();
  if (!trimmed) return null;
  const matches = await Location.geocodeAsync(trimmed);
  if (!matches[0]) return null;
  return { lat: matches[0].latitude, lng: matches[0].longitude };
}
