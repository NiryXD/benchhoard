import { useAuth, useClerk } from '@clerk/clerk-expo';
import { BADGES, glossary } from '@benchhoard/shared';
import { Link, router } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BH, Spacing } from '@/constants/theme';
import { useLeaderboard, useMyStats } from '@/lib/gamification';
import { supabase } from '@/lib/supabase';

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function YouScreen() {
  const { isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const { data: stats } = useMyStats();
  const { data: leaders } = useLeaderboard();

  const earned = new Set(stats?.badges ?? []);

  const onDelete = () =>
    Alert.alert(glossary.you.deleteAccount, glossary.you.deleteConfirm, [
      { text: glossary.common.cancel, style: 'cancel' },
      {
        text: glossary.you.deleteAccount,
        style: 'destructive',
        onPress: async () => {
          try {
            await supabase.functions.invoke('delete-account', { method: 'POST' });
          } catch {
            // best effort; the sign-out below still clears the local session
          }
          await signOut();
        },
      },
    ]);

  if (!isSignedIn) {
    return (
      <View style={styles.centered}>
        <Text style={styles.muted}>{glossary.you.signedOut}</Text>
        <Link href="/(auth)/sign-in" style={styles.link}>
          {glossary.auth.signInCta}
        </Link>
      </View>
    );
  }

  return (
    <ScrollView style={styles.fill} contentContainerStyle={styles.content}>
      <Text style={styles.points}>{stats?.points ?? 0}</Text>
      <Text style={styles.pointsLabel}>{glossary.rewards.points}</Text>

      <View style={styles.statsRow}>
        <Stat value={stats?.benchesAdded ?? 0} label={glossary.rewards.benchesAdded} />
        <Stat value={stats?.benchesHoarded ?? 0} label={glossary.rewards.benchesHoarded} />
        <Stat value={stats?.streak ?? 0} label={glossary.rewards.streak} />
      </View>

      <Text style={styles.sectionTitle}>{glossary.rewards.badges}</Text>
      <View style={styles.badges}>
        {BADGES.map((b) => {
          const on = earned.has(b.key);
          return (
            <View key={b.key} style={[styles.badge, on ? styles.badgeOn : styles.badgeOff]}>
              <Text style={[styles.badgeLabel, on ? styles.badgeLabelOn : null]}>{b.label}</Text>
              <Text style={styles.badgeDesc}>{b.description}</Text>
            </View>
          );
        })}
      </View>

      <Text style={styles.sectionTitle}>{glossary.rewards.leaderboard}</Text>
      {(leaders ?? []).length === 0 ? (
        <Text style={styles.muted}>{glossary.rewards.leaderboardEmpty}</Text>
      ) : (
        (leaders ?? []).map((row, i) => (
          <View key={row.user_id} style={styles.leaderRow}>
            <Text style={styles.leaderRank}>{i + 1}</Text>
            <Text style={styles.leaderName}>{row.name}</Text>
            <Text style={styles.leaderPoints}>{row.points}</Text>
          </View>
        ))
      )}

      <Text style={styles.sectionTitle}>{glossary.you.settings}</Text>
      <Pressable style={styles.linkRow} onPress={() => router.push('/notifications')}>
        <Text style={styles.linkRowText}>{glossary.you.notifications}</Text>
      </Pressable>
      <Pressable style={styles.linkRow} onPress={() => signOut()}>
        <Text style={styles.linkRowText}>{glossary.auth.signOut}</Text>
      </Pressable>
      <Pressable style={styles.linkRow} onPress={onDelete}>
        <Text style={[styles.linkRowText, styles.danger]}>{glossary.you.deleteAccount}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: BH.feedGray },
  content: { padding: Spacing.four, gap: Spacing.two, paddingBottom: Spacing.six },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
    backgroundColor: BH.feedGray,
  },
  muted: { color: BH.inkSecondary, textAlign: 'center' },
  link: { color: BH.primary, fontWeight: '700', paddingVertical: Spacing.two },
  points: { fontSize: 56, fontWeight: '900', color: BH.primary, textAlign: 'center' },
  pointsLabel: {
    textAlign: 'center',
    color: BH.inkSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 12,
  },
  statsRow: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.three },
  stat: {
    flex: 1,
    backgroundColor: BH.paper,
    borderRadius: 12,
    padding: Spacing.three,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BH.divider,
  },
  statValue: { fontSize: 24, fontWeight: '800', color: BH.navy },
  statLabel: { fontSize: 11, color: BH.inkSecondary, textAlign: 'center' },
  sectionTitle: {
    marginTop: Spacing.four,
    fontSize: 13,
    fontWeight: '700',
    color: BH.inkSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badges: { gap: Spacing.two },
  badge: { borderRadius: 12, padding: Spacing.three, borderWidth: 1 },
  badgeOn: { backgroundColor: BH.paper, borderColor: BH.accent },
  badgeOff: { backgroundColor: BH.feedGray, borderColor: BH.divider, opacity: 0.6 },
  badgeLabel: { fontWeight: '700', color: BH.ink },
  badgeLabelOn: { color: BH.accent },
  badgeDesc: { color: BH.inkSecondary, fontSize: 12 },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: BH.divider,
  },
  leaderRank: { width: 24, fontWeight: '800', color: BH.inkSecondary },
  leaderName: { flex: 1, color: BH.ink },
  leaderPoints: { fontWeight: '700', color: BH.primary },
  linkRow: {
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: BH.divider,
  },
  linkRowText: { color: BH.ink, fontSize: 16 },
  danger: { color: BH.danger },
});
