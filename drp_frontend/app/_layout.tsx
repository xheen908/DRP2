import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar'; // Expo StatusBar importieren
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { lightColors, darkColors } from '../constants/theme'; // <-- Importiere die Theme-Farben

export default function RootLayout() {
  const colorScheme = useColorScheme(); // 'light' oder 'dark' basierend auf System

  // Wählen Sie die Farben basierend auf dem System-Farbschema
  const currentThemeColors = colorScheme === 'dark' ? darkColors : lightColors;
  const navigationTheme = colorScheme === 'dark' ? DarkTheme : DefaultTheme; // Für React Navigation

  return (
    <SafeAreaProvider>
      <ThemeProvider value={navigationTheme}> {/* React Navigation Theme */}
        {/* HIER IST DIE KORREKTUR für die StatusBar */}
        <StatusBar style={currentThemeColors.statusBarContent === 'dark-content' ? 'dark' : 'light'} /> 
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="dashboard" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}