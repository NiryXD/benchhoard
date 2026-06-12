import { glossary } from '@ltb/shared';
import { StyleSheet, Text, View } from 'react-native';

import { LTB } from '@/constants/theme';

export default function YourResumeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.name}>{glossary.brand.name}</Text>
        <Text style={styles.tagline}>{glossary.brand.tagline}</Text>
      </View>
      <Text style={styles.hint}>
        Onboarding ("{glossary.onboarding.title}") lands here next: photo slots, executive
        summary, experience, education, behavioral questions.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 16 },
  card: { backgroundColor: LTB.paper, borderRadius: 8, padding: 20 },
  name: { color: LTB.primary, fontWeight: '800', fontSize: 22 },
  tagline: { color: LTB.inkSecondary, marginTop: 4, fontStyle: 'italic' },
  hint: { color: LTB.inkSecondary, lineHeight: 20 },
});
