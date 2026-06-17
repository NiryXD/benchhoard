import { glossary, HOSTILITY_RANK, type SeatType } from '@benchhoard/shared';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';

import { hostilityColor, BH, Spacing } from '@/constants/theme';
import { BenchSheet } from '@/features/bench/BenchSheet';
import { useRequireAuth } from '@/lib/auth';
import { useNearbyBenches, type NearbyBench } from '@/lib/benches';
import { useDeviceLocation } from '@/lib/location';

export default function MapScreen() {
  const { coords, status } = useDeviceLocation();
  const { data: benches } = useNearbyBenches(coords, 5);
  const [selected, setSelected] = useState<NearbyBench | null>(null);
  const requireAuth = useRequireAuth();
  const router = useRouter();

  const region = useMemo<Region | undefined>(
    () =>
      coords
        ? { latitude: coords.lat, longitude: coords.lng, latitudeDelta: 0.04, longitudeDelta: 0.04 }
        : undefined,
    [coords],
  );

  if (status === 'loading') {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={BH.primary} />
        <Text style={styles.muted}>{glossary.map.locating}</Text>
      </View>
    );
  }
  if (status === 'denied') {
    return (
      <View style={styles.centered}>
        <Text style={styles.muted}>{glossary.map.locationDenied}</Text>
      </View>
    );
  }

  return (
    <View style={styles.fill}>
      <MapView style={styles.fill} initialRegion={region} showsUserLocation>
        {(benches ?? []).map((b) => (
          <Marker
            key={b.id}
            coordinate={{ latitude: b.lat, longitude: b.lng }}
            pinColor={hostilityColor(HOSTILITY_RANK[b.seat_type as SeatType] ?? 0)}
            title={b.name ?? glossary.seatTypes[b.seat_type as SeatType]}
            onPress={() => setSelected(b)}
          />
        ))}
      </MapView>

      <Pressable
        style={styles.fab}
        onPress={() => requireAuth(() => router.push('/add-bench'))}
        accessibilityLabel={glossary.map.addCta}>
        <Text style={styles.fabText}>＋ {glossary.map.addCta}</Text>
      </Pressable>

      {selected ? <BenchSheet bench={selected} onClose={() => setSelected(null)} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
    backgroundColor: BH.feedGray,
  },
  muted: { color: BH.inkSecondary, textAlign: 'center' },
  fab: {
    position: 'absolute',
    right: Spacing.three,
    bottom: Spacing.four,
    backgroundColor: BH.primary,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  fabText: { color: BH.paper, fontWeight: '700' },
});
