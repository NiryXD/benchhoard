// ─── [Opus 4.8] Benchhoard — bench discovery data layer ─────────────────────
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { track } from './observability';
import { supabase } from './supabase';

export type Coords = { lat: number; lng: number };

/** One row from bh_nearest_benches — carries distance AND bearing for the map + compass. */
export type NearbyBench = {
  id: string;
  name: string | null;
  seat_type: string;
  material: string | null;
  sun_exposure: string | null;
  noise: string | null;
  sightline: string | null;
  amenities: string[];
  capacity: number | null;
  verified: boolean;
  distance_m: number;
  bearing_deg: number;
  lng: number;
  lat: number;
};

/** Shared shape returned by every points-awarding RPC. */
export type RewardResult = { pointsAwarded: number; badges: string[] };

export function useNearbyBenches(origin: Coords | null, radiusKm = 2) {
  return useQuery({
    queryKey: ['benches', 'nearby', origin?.lat, origin?.lng, radiusKm],
    enabled: !!origin,
    staleTime: 60 * 1000,
    queryFn: async (): Promise<NearbyBench[]> => {
      const { data, error } = await supabase.rpc('bh_nearest_benches', {
        in_lng: origin!.lng,
        in_lat: origin!.lat,
        radius_km: radiusKm,
      });
      if (error) throw error;
      return (data ?? []) as NearbyBench[];
    },
  });
}

export type BenchReview = { id: number; comfort: number; note: string | null; created_at: string };
export type BenchPhoto = { id: number; storage_path: string };
export type BenchDetail = { reviews: BenchReview[]; photos: BenchPhoto[]; avgComfort: number | null };

export function useBenchDetail(benchId: string | null) {
  return useQuery({
    queryKey: ['bench', benchId],
    enabled: !!benchId,
    queryFn: async (): Promise<BenchDetail> => {
      const [reviewsRes, photosRes] = await Promise.all([
        supabase
          .from('bench_reviews')
          .select('id, comfort, note, created_at')
          .eq('bench_id', benchId!)
          .order('created_at', { ascending: false }),
        supabase.from('bench_photos').select('id, storage_path').eq('bench_id', benchId!),
      ]);
      if (reviewsRes.error) throw reviewsRes.error;
      if (photosRes.error) throw photosRes.error;
      const reviews = (reviewsRes.data ?? []) as BenchReview[];
      const avg = reviews.length
        ? reviews.reduce((sum, r) => sum + r.comfort, 0) / reviews.length
        : null;
      return { reviews, photos: (photosRes.data ?? []) as BenchPhoto[], avgComfort: avg };
    },
  });
}

/** Public URL for a bench photo in the `bench-photos` storage bucket. */
export function benchPhotoUrl(path: string): string {
  return supabase.storage.from('bench-photos').getPublicUrl(path).data.publicUrl;
}

export type AddBenchInput = {
  lat: number;
  lng: number;
  seatType: string;
  name?: string;
  material?: string;
  sunExposure?: string;
  noise?: string;
  sightline?: string;
  amenities?: string[];
  capacity?: number;
  notes?: string;
};

export function useAddBench() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: AddBenchInput): Promise<RewardResult & { benchId: string }> => {
      const { data, error } = await supabase.rpc('bh_add_bench', {
        in_lng: input.lng,
        in_lat: input.lat,
        in_seat_type: input.seatType,
        in_name: input.name ?? null,
        in_material: input.material ?? null,
        in_sun_exposure: input.sunExposure ?? null,
        in_noise: input.noise ?? null,
        in_sightline: input.sightline ?? null,
        in_amenities: input.amenities ?? [],
        in_capacity: input.capacity ?? null,
        in_notes: input.notes ?? null,
      });
      if (error) throw error;
      track('bench_added', { seatType: input.seatType });
      return data as RewardResult & { benchId: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['benches'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

export function useReviewBench(benchId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { comfort: number; note?: string }): Promise<RewardResult> => {
      const { data, error } = await supabase.rpc('bh_review_bench', {
        in_bench: benchId,
        in_comfort: input.comfort,
        in_note: input.note ?? null,
      });
      if (error) throw error;
      return data as RewardResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bench', benchId] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}
