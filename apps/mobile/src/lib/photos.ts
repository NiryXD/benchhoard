// ─── [Fable 5] Benchhoard — bench photo capture + upload ────────────────────
import { useAuth } from '@clerk/clerk-expo';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';

import { track } from './observability';
import { supabase } from './supabase';

export type PickedPhoto = { base64: string; mimeType: string };

// Base64 → bytes without a dependency or the `data:` prefix expo-image-picker
// omits. Streaming decoder (6 bits in, 8 bits out) so large photos stay cheap.
const B64_LOOKUP = (() => {
  const table = new Int16Array(128).fill(-1);
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  for (let i = 0; i < alphabet.length; i++) table[alphabet.charCodeAt(i)] = i;
  return table;
})();

function base64ToBytes(b64: string): Uint8Array {
  const end = b64.indexOf('='); // strip padding
  const clean = end >= 0 ? b64.slice(0, end) : b64;
  const out = new Uint8Array((clean.length * 3) >> 2);
  let acc = 0;
  let bits = 0;
  let p = 0;
  for (let i = 0; i < clean.length; i++) {
    const v = B64_LOOKUP[clean.charCodeAt(i)];
    if (v < 0) continue;
    acc = (acc << 6) | v;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out[p++] = (acc >> bits) & 0xff;
    }
  }
  return p === out.length ? out : out.subarray(0, p);
}

function extFor(mime: string): string {
  if (mime.includes('png')) return 'png';
  if (mime.includes('webp')) return 'webp';
  if (mime.includes('heic')) return 'heic';
  return 'jpg';
}

/**
 * Prompt for library permission and let the user pick one photo. Returns null on
 * denial or cancel (callers just no-op), so the flow never throws at the user.
 */
export async function pickBenchPhoto(): Promise<PickedPhoto | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.5,
    base64: true,
  });
  const asset = res.canceled ? undefined : res.assets[0];
  if (!asset?.base64) return null;
  return { base64: asset.base64, mimeType: asset.mimeType ?? 'image/jpeg' };
}

/**
 * Upload one photo to `bench-photos/{uid}/{benchId}/…` and record the row.
 * The storage path's first segment is the uid (storage RLS) and the row's
 * `added_by` is the uid (table RLS), so this needs no RPC.
 */
export function useUploadBenchPhoto() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ benchId, photo }: { benchId: string; photo: PickedPhoto }) => {
      if (!userId) throw new Error('unauthenticated');
      const path = `${userId}/${benchId}/${Date.now()}.${extFor(photo.mimeType)}`;
      const uploaded = await supabase.storage
        .from('bench-photos')
        .upload(path, base64ToBytes(photo.base64), { contentType: photo.mimeType, upsert: false });
      if (uploaded.error) throw uploaded.error;
      const { error } = await supabase
        .from('bench_photos')
        .insert({ bench_id: benchId, storage_path: path, added_by: userId });
      if (error) throw error;
      track('bench_photo_added');
    },
    onSuccess: (_data, vars) => queryClient.invalidateQueries({ queryKey: ['bench', vars.benchId] }),
  });
}
