import { useAuth } from '@clerk/clerk-expo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from './supabase';

// [Opus 4.8] Benchhoard: a hoarder is just an identity with an optional name.
export type ProfileRow = {
  user_id: string;
  display_name: string | null;
};

export function useMyProfile() {
  const { userId, isSignedIn } = useAuth();
  return useQuery({
    queryKey: ['my-profile', userId],
    enabled: !!isSignedIn && !!userId,
    queryFn: async (): Promise<ProfileRow | null> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .eq('user_id', userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

/** Create the profile row lazily on first sign-in (idempotent, server-side). */
export function useEnsureProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (displayName?: string) => {
      const { error } = await supabase.rpc('bh_ensure_profile', {
        display_name: displayName ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-profile'] }),
  });
}
