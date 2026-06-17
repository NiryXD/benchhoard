import { useAuth } from '@clerk/clerk-expo';
import { glossary, type SeatType } from '@ltb/shared';
import { Link } from 'expo-router';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';

import { LTB, Spacing } from '@/constants/theme';
import { useMyHoard } from '@/lib/hoard';

export default function HoardScreen() {
  const { isSignedIn } = useAuth();
  const { data, isLoading } = useMyHoard();

  if (!isSignedIn) {
    return (
      <View style={styles.centered}>
        <Text style={styles.muted}>{glossary.auth.gateBody}</Text>
        <Link href="/(auth)/sign-in" style={styles.link}>
          {glossary.auth.signInCta}
        </Link>
      </View>
    );
  }
  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={LTB.primary} />
      </View>
    );
  }

  const items = data ?? [];
  if (items.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.muted}>{glossary.hoard.empty}</Text>
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={styles.list}
      data={items}
      keyExtractor={(i) => i.bench_id}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.name}>
            {item.bench?.name ??
              (item.bench ? glossary.seatTypes[item.bench.seat_type as SeatType] : 'Bench')}
          </Text>
          {item.label ? <Text style={styles.label}>{item.label}</Text> : null}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
    backgroundColor: LTB.feedGray,
  },
  muted: { color: LTB.inkSecondary, textAlign: 'center' },
  link: { color: LTB.primary, fontWeight: '700', paddingVertical: Spacing.two },
  list: { padding: Spacing.three, gap: Spacing.two },
  card: {
    backgroundColor: LTB.paper,
    borderRadius: 12,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: LTB.divider,
  },
  name: { fontSize: 16, fontWeight: '700', color: LTB.ink },
  label: { marginTop: Spacing.half, color: LTB.inkSecondary, fontStyle: 'italic' },
});
