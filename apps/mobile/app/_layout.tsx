// app/_layout.tsx
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* grupo de auth */}
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      {/* grupo de tabs */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      {/* la pantalla index (gate) vive como archivo app/index.tsx */}
    </Stack>
  );
}
