// ─── [Opus 4.8] Benchhoard — the hoard (claimed benches) data layer ─────────
import { useAuth } from '@clerk/clerk-expo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { RewardResult } from './benches';
import { supabase } from './supabase';

export type HoardedBench = {
  bench_id: string;
  label: string | null;
  created_at: string;
  bench: { name: string | null; seat_type: string } | null;
};

export function useMyHoard() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ['hoard', userId],
    enabled: !!userId,
    queryFn: async (): Promise<HoardedBench[]> => {
      const { data, error } = await supabase
        .from('hoards')
        .select('bench_id, label, created_at, bench:benches(name, seat_type)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as HoardedBench[];
    },
  });
}

/** Whether the current user has hoarded a given bench (drives the claim button). */
export function useIsHoarded(benchId: string | null) {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ['hoard', 'is', userId, benchId],
    enabled: !!userId && !!benchId,
    queryFn: async (): Promise<boolean> => {
      const { count, error } = await supabase
        .from('hoards')
        .select('*', { count: 'exact', head: true })
        .eq('bench_id', benchId!);
      if (error) throw error;
      return (count ?? 0) > 0;
    },
  });
}

export function useToggleHoard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: { benchId: string; label?: string },
    ): Promise<RewardResult & { hoarded: boolean }> => {
      const { data, error } = await supabase.rpc('bh_toggle_hoard', {
        in_bench: input.benchId,
        in_label: input.label ?? null,
      });
      if (error) throw error;
      return data as RewardResult & { hoarded: boolean };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hoard'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}
