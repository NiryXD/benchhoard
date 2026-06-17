import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { useEffect } from 'react';

import { usePushNotifications } from '@/lib/notifications';
import { identifyUser, resetAnalytics, wrapWithSentry } from '@/lib/observability';
import { useEnsureProfile } from '@/lib/profile';
import { setClerkTokenGetter } from '@/lib/supabase';

const queryClient = new QueryClient();

/** Bridges the Clerk session into the Supabase client (runbook section 2.3). */
function SupabaseTokenBridge() {
  const { getToken } = useAuth();
  useEffect(() => {
    setClerkTokenGetter(() => getToken());
  }, [getToken]);
  return null;
}

// [Opus 4.8] Register for push, tie analytics/crash reports to the user, and
// create the hoarder profile row on first sign-in. Browsing is anonymous, so
// none of this runs (and nothing is required) until the user signs in.
function SessionBridge() {
  const { userId, isSignedIn } = useAuth();
  usePushNotifications();
  const ensureProfile = useEnsureProfile();
  useEffect(() => {
    if (isSignedIn && userId) {
      identifyUser(userId);
      ensureProfile.mutate(undefined);
    } else {
      resetAnalytics();
    }
    // ensureProfile is stable enough for this one-shot bootstrap; deps kept lean
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, userId]);
  return null;
}

function RootLayout() {
  return (
    <ClerkProvider tokenCache={tokenCache}>
      <QueryClientProvider client={queryClient}>
        <SupabaseTokenBridge />
        <SessionBridge />
        <Stack screenOptions={{ headerShown: false }} />
      </QueryClientProvider>
    </ClerkProvider>
  );
}

// [Opus 4.8] wrap for Sentry error boundary (no-op without a DSN)
export default wrapWithSentry(RootLayout);
