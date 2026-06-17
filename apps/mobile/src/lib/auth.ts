// ─── [Opus 4.8] Benchhoard — browse-anon, sign-in-to-hoard gate ─────────────
import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';

/**
 * Gate a write action behind sign-in. Browsing is always free; claiming,
 * adding, and reviewing benches route a signed-out user to the auth screen
 * instead. Returns true (and runs `action`) when already signed in.
 */
export function useRequireAuth() {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  return useCallback(
    (action?: () => void): boolean => {
      if (!isSignedIn) {
        router.push('/(auth)/sign-in');
        return false;
      }
      action?.();
      return true;
    },
    [isSignedIn, router],
  );
}
