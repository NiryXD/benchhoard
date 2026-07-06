import { ConfigContext, ExpoConfig } from 'expo/config';

// [Fable 5] Dynamic config layered over app.json. Its only job is to inject the
// Google Maps API key from the environment at build time, so the key powering
// react-native-maps on Android never lives in source control. Set
// GOOGLE_MAPS_API_KEY locally (.env) or as an EAS secret for cloud builds.
// Everything else continues to live in the static app.json.
export default ({ config }: ConfigContext): ExpoConfig => {
  const base = config as ExpoConfig;
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  return {
    ...base,
    android: {
      ...base.android,
      config: {
        ...base.android?.config,
        ...(apiKey ? { googleMaps: { apiKey } } : {}),
      },
    },
  };
};
