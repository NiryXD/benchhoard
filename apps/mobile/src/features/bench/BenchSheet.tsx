// ─── [Opus 4.8] Benchhoard — bench detail sheet (qualities + reviews + hoard) ─
import { glossary, HOSTILITY_RANK, type Amenity, type SeatType } from '@benchhoard/shared';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { hostilityColor, BH, Spacing } from '@/constants/theme';
import { useRequireAuth } from '@/lib/auth';
import { useBenchDetail, useReviewBench, type NearbyBench } from '@/lib/benches';
import { useIsHoarded, useToggleHoard } from '@/lib/hoard';

/** A tappable 1–5 comfort picker. */
function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} onPress={() => onChange(n)} hitSlop={6} accessibilityLabel={`${n} stars`}>
          <Text style={[styles.starPick, n <= value ? styles.starPickOn : null]}>★</Text>
        </Pressable>
      ))}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export function BenchSheet({ bench, onClose }: { bench: NearbyBench; onClose: () => void }) {
  const { data: detail } = useBenchDetail(bench.id);
  const { data: hoarded } = useIsHoarded(bench.id);
  const toggleHoard = useToggleHoard();
  const review = useReviewBench(bench.id);
  const requireAuth = useRequireAuth();

  const [comfort, setComfort] = useState(0);
  const [note, setNote] = useState('');

  const rank = HOSTILITY_RANK[bench.seat_type as SeatType] ?? 0;
  const hostilityLabel =
    rank <= 0 ? glossary.hostility.welcoming : rank <= 2 ? glossary.hostility.moderate : glossary.hostility.hostile;

  const onHoard = () =>
    requireAuth(() => toggleHoard.mutate({ benchId: bench.id }));

  const onSubmitReview = () =>
    requireAuth(() => {
      if (comfort < 1) return;
      review.mutate(
        { comfort, note: note.trim() || undefined },
        {
          onSuccess: () => {
            setComfort(0);
            setNote('');
          },
        },
      );
    });

  return (
    <View style={styles.backdrop}>
      <Pressable style={styles.dismissArea} onPress={onClose} accessibilityLabel={glossary.common.cancel} />
      <View style={styles.sheet}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>
            {bench.name ?? glossary.seatTypes[bench.seat_type as SeatType]}
          </Text>
          {!bench.verified ? <Text style={styles.unverified}>{glossary.bench.unverified}</Text> : null}

          <Text style={styles.sectionTitle}>{glossary.bench.qualities}</Text>
          <Row label={glossary.bench.seatType} value={glossary.seatTypes[bench.seat_type as SeatType]} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{glossary.bench.hostility}</Text>
            <Text style={[styles.badge, { backgroundColor: hostilityColor(rank) }]}>{hostilityLabel}</Text>
          </View>
          {bench.material ? (
            <Row
              label={glossary.bench.material}
              value={glossary.materials[bench.material as keyof typeof glossary.materials] ?? bench.material}
            />
          ) : null}
          {bench.sun_exposure ? (
            <Row
              label={glossary.bench.sun}
              value={glossary.sunExposure[bench.sun_exposure as keyof typeof glossary.sunExposure]}
            />
          ) : null}
          {bench.noise ? (
            <Row
              label={glossary.bench.noise}
              value={glossary.noiseLevels[bench.noise as keyof typeof glossary.noiseLevels]}
            />
          ) : null}
          {bench.sightline ? (
            <Row
              label={glossary.bench.sightline}
              value={glossary.sightlines[bench.sightline as keyof typeof glossary.sightlines]}
            />
          ) : null}
          {bench.capacity ? (
            <Row label={glossary.bench.capacity} value={String(bench.capacity)} />
          ) : null}
          {bench.amenities.length > 0 ? (
            <View style={styles.chips}>
              {bench.amenities.map((a) => (
                <Text key={a} style={styles.chip}>
                  {glossary.amenities[a as Amenity] ?? a}
                </Text>
              ))}
            </View>
          ) : null}

          <Text style={styles.sectionTitle}>
            {glossary.review.title}
            {detail?.avgComfort != null ? ` · ${detail.avgComfort.toFixed(1)}★` : ''}
          </Text>
          {(detail?.reviews ?? []).length === 0 ? (
            <Text style={styles.reviewEmpty}>{glossary.review.empty}</Text>
          ) : (
            (detail?.reviews ?? []).slice(0, 5).map((r) => (
              <View key={r.id} style={styles.review}>
                <Text style={styles.reviewStars}>{'★'.repeat(r.comfort)}</Text>
                {r.note ? <Text style={styles.reviewNote}>{r.note}</Text> : null}
              </View>
            ))
          )}

          <View style={styles.reviewForm}>
            <Text style={styles.reviewPrompt}>{glossary.review.prompt}</Text>
            <StarPicker value={comfort} onChange={setComfort} />
            {comfort > 0 ? (
              <>
                <TextInput
                  style={styles.reviewInput}
                  value={note}
                  onChangeText={setNote}
                  placeholder={glossary.review.notePlaceholder}
                  placeholderTextColor={BH.inkSecondary}
                  multiline
                  maxLength={200}
                />
                <Pressable
                  style={[styles.reviewSubmit, review.isPending ? styles.reviewSubmitDisabled : null]}
                  onPress={onSubmitReview}
                  disabled={review.isPending}>
                  <Text style={styles.reviewSubmitText}>{glossary.review.submit}</Text>
                </Pressable>
              </>
            ) : null}
          </View>

          <Pressable
            style={[styles.hoardBtn, hoarded ? styles.hoardBtnOn : null]}
            onPress={onHoard}
            disabled={toggleHoard.isPending}>
            <Text style={[styles.hoardText, hoarded ? styles.hoardTextOn : null]}>
              {hoarded ? glossary.hoard.claimed : glossary.hoard.claim}
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'flex-end' },
  dismissArea: { flex: 1 },
  sheet: {
    backgroundColor: BH.paper,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  content: { padding: Spacing.four, gap: Spacing.two },
  title: { fontSize: 22, fontWeight: '800', color: BH.ink },
  unverified: { color: BH.danger, fontSize: 12 },
  sectionTitle: {
    marginTop: Spacing.two,
    fontSize: 13,
    fontWeight: '700',
    color: BH.inkSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { color: BH.inkSecondary },
  rowValue: { color: BH.ink, fontWeight: '600' },
  badge: {
    color: BH.paper,
    fontWeight: '700',
    fontSize: 12,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one, marginTop: Spacing.one },
  chip: {
    backgroundColor: BH.feedGray,
    color: BH.ink,
    borderRadius: 8,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    fontSize: 12,
  },
  review: { marginTop: Spacing.one },
  reviewStars: { color: BH.accent },
  reviewNote: { color: BH.ink },
  reviewEmpty: { color: BH.inkSecondary, fontStyle: 'italic' },
  reviewForm: {
    marginTop: Spacing.two,
    padding: Spacing.three,
    backgroundColor: BH.feedGray,
    borderRadius: 12,
    gap: Spacing.two,
  },
  reviewPrompt: { color: BH.inkSecondary, fontSize: 13 },
  starRow: { flexDirection: 'row', gap: Spacing.one },
  starPick: { fontSize: 30, color: BH.divider },
  starPickOn: { color: BH.accent },
  reviewInput: {
    backgroundColor: BH.paper,
    borderWidth: 1,
    borderColor: BH.divider,
    borderRadius: 10,
    padding: Spacing.three,
    color: BH.ink,
    minHeight: 64,
    textAlignVertical: 'top',
  },
  reviewSubmit: {
    backgroundColor: BH.primary,
    borderRadius: 10,
    paddingVertical: Spacing.two + 2,
    alignItems: 'center',
  },
  reviewSubmitDisabled: { opacity: 0.6 },
  reviewSubmitText: { color: BH.paper, fontWeight: '700' },
  hoardBtn: {
    marginTop: Spacing.three,
    backgroundColor: BH.primary,
    borderRadius: 12,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  hoardBtnOn: { backgroundColor: BH.feedGray, borderWidth: 1, borderColor: BH.primary },
  hoardText: { color: BH.paper, fontWeight: '800', fontSize: 16 },
  hoardTextOn: { color: BH.primary },
});
