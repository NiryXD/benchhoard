// ─── [Opus 4.8] Benchhoard — notification settings (push + quiet hours) ─────
import { glossary } from '@ltb/shared';
import { Stack } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { LTB, Spacing } from '@/constants/theme';
import { useNotificationPrefs, useUpdateNotificationPrefs } from '@/lib/notification-prefs';

const N = glossary.notifications;

function formatHour(h: number): string {
  const period = h < 12 ? 'AM' : 'PM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour} ${period}`;
}

export default function NotificationsScreen() {
  const { data: prefs } = useNotificationPrefs();
  const update = useUpdateNotificationPrefs();

  const pushEnabled = prefs?.pushEnabled ?? true;
  const quietStart = prefs?.quietStart ?? 22;
  const quietEnd = prefs?.quietEnd ?? 7;
  const quietOn = prefs?.quietStart != null && prefs?.quietEnd != null;

  const stepHour = (which: 'start' | 'end', delta: number) => {
    const next = (((which === 'start' ? quietStart : quietEnd) + delta) % 24 + 24) % 24;
    update.mutate(which === 'start' ? { quietStart: next } : { quietEnd: next });
  };

  return (
    <>
      <Stack.Screen options={{ title: N.title, headerShown: true }} />
      <ScrollView style={styles.fill} contentContainerStyle={styles.content}>
        <Text style={styles.sub}>{N.sub}</Text>

        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>{N.master}</Text>
            <Text style={styles.rowSub}>{N.masterSub}</Text>
          </View>
          <Switch
            value={pushEnabled}
            onValueChange={(v) => update.mutate({ pushEnabled: v })}
            trackColor={{ true: LTB.primary, false: LTB.divider }}
          />
        </View>

        <Text style={styles.sectionTitle}>{N.quietTitle}</Text>
        <Text style={styles.sub}>{N.quietSub}</Text>
        <View style={styles.row}>
          <Text style={styles.rowTitle}>{N.quietEnable}</Text>
          <Switch
            value={quietOn}
            onValueChange={(v) =>
              update.mutate(v ? { quietStart: 22, quietEnd: 7 } : { quietStart: null, quietEnd: null })
            }
            trackColor={{ true: LTB.primary, false: LTB.divider }}
          />
        </View>

        {quietOn ? (
          <View style={styles.quietControls}>
            <View style={styles.stepper}>
              <Text style={styles.stepperLabel}>{N.quietFrom}</Text>
              <Pressable style={styles.stepBtn} onPress={() => stepHour('start', -1)}>
                <Text style={styles.stepBtnText}>−</Text>
              </Pressable>
              <Text style={styles.stepValue}>{formatHour(quietStart)}</Text>
              <Pressable style={styles.stepBtn} onPress={() => stepHour('start', 1)}>
                <Text style={styles.stepBtnText}>＋</Text>
              </Pressable>
            </View>
            <View style={styles.stepper}>
              <Text style={styles.stepperLabel}>{N.quietTo}</Text>
              <Pressable style={styles.stepBtn} onPress={() => stepHour('end', -1)}>
                <Text style={styles.stepBtnText}>−</Text>
              </Pressable>
              <Text style={styles.stepValue}>{formatHour(quietEnd)}</Text>
              <Pressable style={styles.stepBtn} onPress={() => stepHour('end', 1)}>
                <Text style={styles.stepBtnText}>＋</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: LTB.feedGray },
  content: { padding: Spacing.four, gap: Spacing.two, paddingBottom: Spacing.six },
  sub: { color: LTB.inkSecondary },
  sectionTitle: {
    marginTop: Spacing.four,
    fontSize: 13,
    fontWeight: '700',
    color: LTB.inkSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: LTB.paper,
    borderRadius: 12,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: LTB.divider,
    marginTop: Spacing.two,
  },
  rowText: { flex: 1, paddingRight: Spacing.three },
  rowTitle: { fontWeight: '700', color: LTB.ink },
  rowSub: { color: LTB.inkSecondary, fontSize: 12 },
  quietControls: { flexDirection: 'row', gap: Spacing.three, marginTop: Spacing.two },
  stepper: {
    flex: 1,
    backgroundColor: LTB.paper,
    borderRadius: 12,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: LTB.divider,
    alignItems: 'center',
    gap: Spacing.two,
  },
  stepperLabel: { color: LTB.inkSecondary, fontSize: 12, textTransform: 'uppercase' },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: LTB.feedGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: { fontSize: 20, color: LTB.primary, fontWeight: '700' },
  stepValue: { fontSize: 18, fontWeight: '800', color: LTB.navy },
});
