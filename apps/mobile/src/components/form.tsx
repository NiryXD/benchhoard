import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';

import { BH } from '@/constants/theme';

export function StepScreen({
  title,
  subtitle,
  children,
  ctaLabel,
  onNext,
  ctaDisabled,
  busy,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  ctaLabel: string;
  onNext: () => void;
  ctaDisabled?: boolean;
  busy?: boolean;
}) {
  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        <View style={styles.body}>{children}</View>
        <Pressable
          style={[styles.cta, (ctaDisabled || busy) && styles.ctaDisabled]}
          disabled={ctaDisabled || busy}
          onPress={onNext}>
          {busy ? (
            <ActivityIndicator color={BH.paper} />
          ) : (
            <Text style={styles.ctaText}>{ctaLabel}</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function Field({
  label,
  hint,
  ...inputProps
}: { label: string; hint?: string } & TextInputProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, inputProps.multiline && styles.inputMultiline]}
        placeholderTextColor={BH.inkSecondary}
        {...inputProps}
      />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

export function Chips<T extends string>({
  label,
  options,
  selected,
  onToggle,
  display,
}: {
  label: string;
  options: readonly T[];
  selected: T[] | T | null;
  onToggle: (value: T) => void;
  display?: (value: T) => string;
}) {
  const isSelected = (v: T) =>
    Array.isArray(selected) ? selected.includes(v) : selected === v;
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.chipWrap}>
        {options.map((opt) => (
          <Pressable
            key={opt}
            style={[styles.chip, isSelected(opt) && styles.chipOn]}
            onPress={() => onToggle(opt)}>
            <Text style={[styles.chipText, isSelected(opt) && styles.chipTextOn]}>
              {display ? display(opt) : opt}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 40 },
  title: { color: BH.navy, fontWeight: '700', fontSize: 24 },
  subtitle: { color: BH.inkSecondary, marginTop: 4 },
  body: { marginTop: 16, gap: 4 },
  field: { marginBottom: 14 },
  label: { color: BH.ink, fontWeight: '600', fontSize: 13, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: BH.divider,
    borderRadius: 6,
    padding: 12,
    color: BH.ink,
    backgroundColor: BH.paper,
  },
  inputMultiline: { minHeight: 90, textAlignVertical: 'top' },
  hint: { color: BH.inkSecondary, fontSize: 12, marginTop: 4 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: BH.divider,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: BH.paper,
  },
  chipOn: { backgroundColor: BH.primary, borderColor: BH.primary },
  chipText: { color: BH.ink, fontSize: 13 },
  chipTextOn: { color: BH.paper, fontWeight: '600' },
  cta: {
    backgroundColor: BH.primary,
    borderRadius: 6,
    padding: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  ctaDisabled: { opacity: 0.5 },
  ctaText: { color: BH.paper, fontWeight: '700', fontSize: 16 },
});
