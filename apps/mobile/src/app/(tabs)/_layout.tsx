import { glossary } from '@benchhoard/shared';
import { Tabs } from 'expo-router';
import { Text } from 'react-native';

import { BH } from '@/constants/theme';

// [Opus 4.8] Anonymous-first: anyone can browse the map, compass, and a bench's
// qualities without an account. Sign-in is only prompted on write actions
// (hoarding, adding, reviewing) via useRequireAuth — so no gate here.
function TabIcon({ glyph }: { glyph: string }) {
  return <Text style={{ fontSize: 18 }}>{glyph}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: BH.paper },
        headerTitleStyle: { color: BH.navy, fontWeight: '700' },
        headerShadowVisible: true,
        tabBarActiveTintColor: BH.primary,
        tabBarInactiveTintColor: BH.inkSecondary,
        tabBarStyle: { backgroundColor: BH.paper },
        sceneStyle: { backgroundColor: BH.feedGray },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: glossary.tabs.map,
          headerTitle: glossary.map.title,
          tabBarIcon: () => <TabIcon glyph="🗺️" />,
        }}
      />
      <Tabs.Screen
        name="compass"
        options={{
          title: glossary.tabs.compass,
          headerTitle: glossary.compass.title,
          tabBarIcon: () => <TabIcon glyph="🧭" />,
        }}
      />
      <Tabs.Screen
        name="hoard"
        options={{
          title: glossary.tabs.hoard,
          headerTitle: glossary.hoard.title,
          tabBarIcon: () => <TabIcon glyph="📌" />,
        }}
      />
      <Tabs.Screen
        name="you"
        options={{
          title: glossary.tabs.you,
          tabBarIcon: () => <TabIcon glyph="🌳" />,
        }}
      />
    </Tabs>
  );
}
