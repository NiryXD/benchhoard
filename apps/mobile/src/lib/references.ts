import { useAuth } from '@clerk/clerk-expo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from './supabase';

export const REFERENCE_FORM_URL = 'https://letstouchbase.pages.dev/reference';

export type ReferenceLetter = {
  id: number;
  author_name: string;
  relationship: string | null;
  body: string;
  is_approved: boolean;
  created_at: string;
};

export function useMyReferences() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ['my-references', userId],
    enabled: !!userId,
    queryFn: async (): Promise<ReferenceLetter[]> => {
      const { data, error } = await supabase
        .from('reference_letters')
        .select('id, author_name, relationship, body, is_approved, created_at')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

/** Mint a shareable invite link (14-day expiry, single use). */
export function useCreateReferenceInvite() {
  const { userId } = useAuth();
  return useMutation({
    mutationFn: async (): Promise<string> => {
      const { data, error } = await supabase
        .from('reference_invites')
        .insert({ user_id: userId! })
        .select('token')
        .single();
      if (error) throw error;
      return `${REFERENCE_FORM_URL}?token=${data.token}`;
    },
  });
}

export function useSetReferenceApproval() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: number; approved: boolean }) => {
      const { error } = await supabase
        .from('reference_letters')
        .update({ is_approved: input.approved })
        .eq('id', input.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-references'] }),
  });
}

export function useDeleteReference() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from('reference_letters').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-references'] }),
  });
}
