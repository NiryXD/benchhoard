import { useAuth, useClerk } from '@clerk/clerk-expo';
import { glossary } from '@ltb/shared';
import { useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import { LTB } from '@/constants/theme';
import { ResumeCard } from '@/features/discovery/ResumeCard';
import { useProfileCard } from '@/lib/discovery';
import { useMyProfile } from '@/lib/profile';
import {
  useCreateReferenceInvite,
  useDeleteReference,
  useMyReferences,
  useSetReferenceApproval,
} from '@/lib/references';
import { supabase } from '@/lib/supabase';

const OTW_COLORS = {
  committed: LTB.openToWork.committed,
  casual: LTB.openToWork.casual,
  networking: LTB.openToWork.networking,
} as const;

export default function YourResumeScreen() {
  const { signOut } = useClerk();
  const { userId } = useAuth();
  const { data: profile } = useMyProfile();
  const { data: card } = useProfileCard(userId ?? undefined);
  const { data: references } = useMyReferences();
  const createInvite = useCreateReferenceInvite();
  const setApproval = useSetReferenceApproval();
  const deleteReference = useDeleteReference();
  const queryClient = useQueryClient();

  const toggleOutOfOffice = async (value: boolean) => {
    await supabase.from('profiles').update({ out_of_office: value }).eq('user_id', userId!);
    queryClient.invalidateQueries({ queryKey: ['my-profile'] });
    queryClient.invalidateQueries({ queryKey: ['profile-card', userId] });
  };

  const requestReference = async () => {
    try {
      const link = await createInvite.mutateAsync();
      await Share.share({
        message: `I'm listing you as a reference. Write me one (takes 2 minutes, expires in 14 days): ${link}`,
      });
    } catch {
      Alert.alert('Could not create the invite link. Try again.');
    }
  };

  const tenderResignation = () => {
    Alert.alert(
      'Tender Your Resignation',
      'This permanently deletes your account: resume, photos, matches, alignment calls — everything. There is no rehire process.',
      [
        { text: 'Stay employed', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () =>
            Alert.alert('Final confirmation', 'Sign and submit your resignation?', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Resign permanently',
                style: 'destructive',
                onPress: async () => {
                  const { error } = await supabase.functions.invoke('delete-account');
                  if (error) {
                    Alert.alert('Deletion failed', 'Please try again.');
                    return;
                  }
                  await signOut();
                },
              },
            ]),
        },
      ],
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {profile ? (
        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingMeta}>
              <Text style={styles.settingLabel}>{glossary.profile.outOfOffice}</Text>
              <Text style={styles.settingHint}>
                Auto-reply mode: you stay visible, expectations get managed.
              </Text>
            </View>
            <Switch
              value={profile.out_of_office}
              onValueChange={toggleOutOfOffice}
              trackColor={{ true: LTB.primary }}
            />
          </View>
          <View style={styles.settingRow}>
            <View style={styles.settingMeta}>
              <Text style={styles.settingLabel}>{glossary.profile.openToWork}</Text>
            </View>
            <View
              style={[styles.otwBadge, { backgroundColor: OTW_COLORS[profile.open_to_work] }]}>
              <Text style={styles.otwText}>
                {glossary.openToWorkStatuses[profile.open_to_work]}
              </Text>
            </View>
          </View>
        </View>
      ) : null}

      {card ? (
        <>
          <Text style={styles.previewLabel}>
            Your resume, as candidates see it (tap targets disabled):
          </Text>
          <ResumeCard card={card} onAnnotate={() => {}} />
        </>
      ) : null}

      <Pressable style={styles.signOut} onPress={() => signOut()}>
        <Text style={styles.signOutText}>{glossary.auth.signOut}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 14 },
  settingsCard: { backgroundColor: LTB.paper, borderRadius: 8, padding: 16, gap: 14 },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingMeta: { flex: 1 },
  settingLabel: { color: LTB.ink, fontWeight: '600' },
  settingHint: { color: LTB.inkSecondary, fontSize: 12, marginTop: 2 },
  otwBadge: { borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12 },
  otwText: { color: LTB.paper, fontSize: 12, fontWeight: '600' },
  previewLabel: { color: LTB.inkSecondary, fontSize: 12 },
  signOut: {
    borderWidth: 1,
    borderColor: LTB.divider,
    borderRadius: 6,
    padding: 12,
    alignItems: 'center',
    backgroundColor: LTB.paper,
  },
  signOutText: { color: LTB.reject, fontWeight: '600' },
});
