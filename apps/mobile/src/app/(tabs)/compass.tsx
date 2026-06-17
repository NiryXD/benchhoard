import { glossary, type SeatType } from '@ltb/shared';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { LTB, Spacing } from '@/constants/theme';
import { useNearbyBenches } from '@/lib/benches';
import { useDeviceLocation, useHeading } from '@/lib/location';

export default function CompassScreen() {
  const { coords, status } = useDeviceLocation();
  const { data: benches } = useNearbyBenches(coords, 10);
  const { heading } = useHeading();
  const nearest = benches?.[0] ?? null;

  if (status === 'loading') {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={LTB.primary} />
      </View>
    );
  }
  if (status === 'denied') {
    return (
      <View style={styles.container}>
        <Text style={styles.muted}>{glossary.map.locationDenied}</Text>
      </View>
    );
  }
  if (!nearest) {
    return (
      <View style={styles.container}>
        <Text style={styles.muted}>{glossary.compass.noBench}</Text>
      </View>
    );
  }

  // Rotate the arrow from the device's current heading toward the bench bearing.
  const rotation = nearest.bearing_deg - (heading ?? 0);
  const arrived = nearest.distance_m < 8;
  const benchName = nearest.name ?? glossary.seatTypes[nearest.seat_type as SeatType];

  return (
    <View style={styles.container}>
      <Text style={styles.benchName}>{benchName}</Text>
      <View style={styles.dial}>
        <Text style={[styles.arrow, { transform: [{ rotate: `${rotation}deg` }] }]}>↑</Text>
      </View>
      <Text style={styles.distance}>
        {arrived ? glossary.compass.arrived : glossary.compass.distance(nearest.distance_m)}
      </Text>
      <Text style={styles.hint}>
        {heading == null ? glossary.compass.headingUnavailable : glossary.compass.sub}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.four,
    padding: Spacing.four,
    backgroundColor: LTB.feedGray,
  },
  benchName: { fontSize: 20, fontWeight: '700', color: LTB.ink, textAlign: 'center' },
  dial: {
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 2,
    borderColor: LTB.divider,
    backgroundColor: LTB.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: { fontSize: 120, lineHeight: 132, color: LTB.primary },
  distance: { fontSize: 28, fontWeight: '800', color: LTB.navy },
  hint: { color: LTB.inkSecondary, textAlign: 'center' },
  muted: { color: LTB.inkSecondary, textAlign: 'center' },
});
