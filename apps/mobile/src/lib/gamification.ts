// ─── [Opus 4.8] Benchhoard — discovery incentive (points, badges, board) ────
import { useAuth } from '@clerk/clerk-expo';
import { useQuery } from '@tanstack/react-query';

import { supabase } from './supabase';

export type MyStats = {
  points: number;
  benchesAdded: number;
  benchesHoarded: number;
  streak: number;
  badges: string[];
};

export function useMyStats() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ['stats', userId],
    enabled: !!userId,
    queryFn: async (): Promise<MyStats> => {
      const { data, error } = await supabase.rpc('bh_my_stats');
      if (error) throw error;
      return data as MyStats;
    },
  });
}

export type LeaderRow = {
  user_id: string;
  name: string;
  points: number;
  benches_added: number;
};

export function useLeaderboard() {
  return useQuery({
    queryKey: ['leaderboard'],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<LeaderRow[]> => {
      const { data, error } = await supabase.rpc('bh_leaderboard', { lim: 20 });
      if (error) throw error;
      return (data ?? []) as LeaderRow[];
    },
  });
}
