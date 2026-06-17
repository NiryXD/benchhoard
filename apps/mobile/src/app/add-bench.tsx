// ─── [Opus 4.8] Benchhoard — add a bench to the map ─────────────────────────
import {
  AMENITIES,
  type Amenity,
  glossary,
  SEAT_TYPES,
  type SeatType,
  SIGHTLINES,
  type Sightline,
  SUN_EXPOSURE,
  type SunExposure,
} from '@ltb/shared';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { LTB, Spacing } from '@/constants/theme';
import { useAddBench } from '@/lib/benches';
import { useDeviceLocation } from '@/lib/location';

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.chip, on ? styles.chipOn : null]} onPress={onPress}>
      <Text style={[styles.chipText, on ? styles.chipTextOn : null]}>{label}</Text>
    </Pressable>
  );
}

export default function AddBenchScreen() {
  const router = useRouter();
  const { coords, status } = useDeviceLocation();
  const addBench = useAddBench();

  const [seatType, setSeatType] = useState<SeatType>('true_bench');
  const [sunExposure, setSunExposure] = useState<SunExposure | undefined>(undefined);
  const [sightline, setSightline] = useState<Sightline | undefined>(undefined);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');

  const toggleAmenity = (a: Amenity) =>
    setAmenities((cur) => (cur.includes(a) ? cur.filter((x) => x !== a) : [...cur, a]));

  const onSubmit = () => {
    if (!coords) {
      Alert.alert(glossary.addBench.title, glossary.addBench.locationMissing);
      return;
    }
    addBench.mutate(
      {
        lat: coords.lat,
        lng: coords.lng,
        seatType,
        name: name.trim() || undefined,
        sunExposure,
        sightline,
        amenities,
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: (res) => {
          const badge = res.badges[0];
          Alert.alert(
            glossary.addBench.success,
            badge
              ? `${glossary.rewards.pointsAwarded(res.pointsAwarded)} · ${glossary.rewards.earned(badge)}`
              : glossary.rewards.pointsAwarded(res.pointsAwarded),
          );
          router.back();
        },
        onError: () => Alert.alert(glossary.addBench.title, glossary.addBench.error),
      },
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: glossary.addBench.title, headerShown: true }} />
      <ScrollView style={styles.fill} contentContainerStyle={styles.content}>
        <Text style={styles.sub}>{glossary.addBench.sub}</Text>
        <Text style={styles.location}>
          {status === 'granted' && coords
            ? glossary.addBench.useMyLocation
            : glossary.map.locationDenied}
        </Text>

        <Text style={styles.label}>{glossary.bench.seatType}</Text>
        <View style={styles.chips}>
          {SEAT_TYPES.map((s) => (
            <Chip key={s} label={glossary.seatTypes[s]} on={seatType === s} onPress={() => setSeatType(s)} />
          ))}
        </View>

        <Text style={styles.label}>{glossary.bench.sun}</Text>
        <View style={styles.chips}>
          {SUN_EXPOSURE.map((s) => (
            <Chip
              key={s}
              label={glossary.sunExposure[s]}
              on={sunExposure === s}
              onPress={() => setSunExposure((cur) => (cur === s ? undefined : s))}
            />
          ))}
        </View>

        <Text style={styles.label}>{glossary.bench.sightline}</Text>
        <View style={styles.chips}>
          {SIGHTLINES.map((s) => (
            <Chip
              key={s}
              label={glossary.sightlines[s]}
              on={sightline === s}
              onPress={() => setSightline((cur) => (cur === s ? undefined : s))}
            />
          ))}
        </View>

        <Text style={styles.label}>{glossary.bench.amenities}</Text>
        <View style={styles.chips}>
          {AMENITIES.map((a) => (
            <Chip key={a} label={glossary.amenities[a]} on={amenities.includes(a)} onPress={() => toggleAmenity(a)} />
          ))}
        </View>

        <Text style={styles.label}>{glossary.addBench.nameLabel}</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder={glossary.addBench.namePlaceholder}
          placeholderTextColor={LTB.inkSecondary}
          maxLength={80}
        />

        <Text style={styles.label}>{glossary.addBench.notesLabel}</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={notes}
          onChangeText={setNotes}
          placeholder={glossary.addBench.notesPlaceholder}
          placeholderTextColor={LTB.inkSecondary}
          multiline
          maxLength={280}
        />

        <Pressable
          style={[styles.submit, addBench.isPending ? styles.submitDisabled : null]}
          onPress={onSubmit}
          disabled={addBench.isPending}>
          {addBench.isPending ? (
            <ActivityIndicator color={LTB.paper} />
          ) : (
            <Text style={styles.submitText}>{glossary.addBench.submit}</Text>
          )}
        </Pressable>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: LTB.feedGray },
  content: { padding: Spacing.four, gap: Spacing.two, paddingBottom: Spacing.six },
  sub: { color: LTB.inkSecondary },
  location: { color: LTB.primary, fontWeight: '600' },
  label: {
    marginTop: Spacing.three,
    fontWeight: '700',
    color: LTB.ink,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  chip: {
    backgroundColor: LTB.paper,
    borderWidth: 1,
    borderColor: LTB.divider,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
  },
  chipOn: { backgroundColor: LTB.primary, borderColor: LTB.primary },
  chipText: { color: LTB.ink },
  chipTextOn: { color: LTB.paper, fontWeight: '700' },
  input: {
    backgroundColor: LTB.paper,
    borderWidth: 1,
    borderColor: LTB.divider,
    borderRadius: 10,
    padding: Spacing.three,
    color: LTB.ink,
  },
  multiline: { minHeight: 88, textAlignVertical: 'top' },
  submit: {
    marginTop: Spacing.four,
    backgroundColor: LTB.primary,
    borderRadius: 12,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: LTB.paper, fontWeight: '800', fontSize: 16 },
});
