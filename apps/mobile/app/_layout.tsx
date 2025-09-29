import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) return null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* Labs */}
        <Stack.Screen name="lab/[id]/details" options={{ title: 'Detalle del Laboratorio' }} />
        <Stack.Screen name="lab/[id]/calendar" options={{ title: 'Calendario' }} />
        <Stack.Screen name="lab/[id]/catalog" options={{ title: 'Catálogo' }} />

        {/* Solicitudes */}
        <Stack.Screen name="requests/index" options={{ title: 'Solicitudes' }} />
        <Stack.Screen name="requests/new" options={{ title: 'Nueva Solicitud' }} />
        <Stack.Screen name="requests/[id]" options={{ title: 'Solicitud' }} />

        {/* Control 1.4 */}
        <Stack.Screen name="requests/[id]/assignments" options={{ title: 'Asignaciones/Devoluciones' }} />
        <Stack.Screen name="requests/[id]/consumptions" options={{ title: 'Consumo de Materiales' }} />
        <Stack.Screen name="requests/[id]/benefits" options={{ title: 'Beneficios Académicos' }} />
        <Stack.Screen name="reports/usage" options={{ title: 'Reporte de Uso' }} />

        {/* Admin */}
        <Stack.Screen name="admin/departments" options={{ title: 'Departamentos' }} />
        <Stack.Screen name="admin/resource-types" options={{ title: 'Tipos de Recurso' }} />

        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
