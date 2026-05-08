import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="counting-game" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
        <Stack.Screen name="counting-game-hard" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
        <Stack.Screen name="schulte-game" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
        <Stack.Screen name="schulte-prime-game" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
        <Stack.Screen name="memory-game" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
        <Stack.Screen name="memory-game-image" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
