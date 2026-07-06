// ─── [Fable 5] Benchhoard — notification preferences ────────────────────────
import { useAuth } from '@clerk/clerk-expo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from './supabase';

export type NotificationPrefs = {
  pushEnabled: boolean;
  nearby: boolean; // new benches mapped near a place you've hoarded
  badges: boolean; // badges & streak milestones
  verified: boolean; // a bench you added gets confirmed by another hoarder
  quietStart: number | null;
  quietEnd: number | null;
  tz: string | null;
};

const DEFAULTS: NotificationPrefs = {
  pushEnabled: true,
  nearby: true,
  badges: true,
  verified: true,
  quietStart: null,
  quietEnd: null,
  tz: null,
};

export function useNotificationPrefs() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ['notification-prefs', userId],
    enabled: !!userId,
    queryFn: async (): Promise<NotificationPrefs> => {
      const { data, error } = await supabase
        .from('notification_prefs')
        .select('push_enabled, nearby, badges, verified, quiet_start, quiet_end, tz')
        .eq('user_id', userId!)
        .maybeSingle();
      if (error) throw error;
      if (!data) return DEFAULTS;
      return {
        pushEnabled: data.push_enabled,
        nearby: data.nearby,
        badges: data.badges,
        verified: data.verified,
        quietStart: data.quiet_start,
        quietEnd: data.quiet_end,
        tz: data.tz,
      };
    },
  });
}

/**
 * Upsert a partial change. Always stamps the device timezone so server-side
 * quiet-hours evaluation has an IANA zone to work with.
 */
export function useUpdateNotificationPrefs() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<NotificationPrefs>) => {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const row: Record<string, unknown> = { user_id: userId!, tz, updated_at: new Date().toISOString() };
      if (patch.pushEnabled !== undefined) row.push_enabled = patch.pushEnabled;
      if (patch.nearby !== undefined) row.nearby = patch.nearby;
      if (patch.badges !== undefined) row.badges = patch.badges;
      if (patch.verified !== undefined) row.verified = patch.verified;
      if (patch.quietStart !== undefined) row.quiet_start = patch.quietStart;
      if (patch.quietEnd !== undefined) row.quiet_end = patch.quietEnd;
      const { error } = await supabase
        .from('notification_prefs')
        .upsert(row, { onConflict: 'user_id' });
      if (error) throw error;
    },
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: ['notification-prefs', userId] });
      const prev = queryClient.getQueryData<NotificationPrefs>(['notification-prefs', userId]);
      if (prev) {
        queryClient.setQueryData<NotificationPrefs>(['notification-prefs', userId], { ...prev, ...patch });
      }
      return { prev };
    },
    onError: (_e, _patch, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['notification-prefs', userId], ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['notification-prefs', userId] }),
  });
}
