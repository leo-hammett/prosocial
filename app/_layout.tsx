import '../global.css';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useColorScheme } from '../components/useColorScheme';
import { useAuthStore } from '../stores/authStore';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { subscribeToNetworkChanges, processPendingMutations } from '../lib/offline';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  const { initialize, initialized } = useAuthStore();
  const [isOnline, setIsOnline] = useState(true);

  // Initialize auth
  useEffect(() => {
    initialize();
  }, []);

  // Subscribe to network changes for offline support
  useEffect(() => {
    const unsubscribe = subscribeToNetworkChanges(async (online) => {
      setIsOnline(online);
      
      // When coming back online, sync pending changes
      if (online) {
        const result = await processPendingMutations();
        if (result.processed > 0) {
          console.log(`Synced ${result.processed} pending changes`);
        }
      }
    });
    
    return unsubscribe;
  }, []);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded && initialized) {
      SplashScreen.hideAsync();
    }
  }, [loaded, initialized]);

  if (!loaded || !initialized) {
    return null;
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        {!isOnline && (
          <View className="bg-yellow-500 px-4 py-2">
            <Text className="text-white text-center text-sm font-medium">
              You're offline. Changes will sync when back online.
            </Text>
          </View>
        )}
        <RootLayoutNav />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { user } = useAuthStore();

  // Custom theme with our brand colors
  const ProsocialTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: '#e05c4f',
      background: '#f9fafb',
      card: '#ffffff',
      text: '#111827',
      border: '#e5e7eb',
    },
  };

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : ProsocialTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="person/[id]" 
          options={{ 
            headerShown: true,
            title: '',
            headerBackTitle: 'Back',
          }} 
        />
        <Stack.Screen 
          name="person/new" 
          options={{ 
            presentation: 'modal',
            headerShown: true,
            title: 'Add Person',
          }} 
        />
        <Stack.Screen 
          name="person/edit/[id]" 
          options={{ 
            presentation: 'modal',
            headerShown: true,
            title: 'Edit',
          }} 
        />
        <Stack.Screen 
          name="log" 
          options={{ 
            presentation: 'modal',
            headerShown: false,
          }} 
        />
      </Stack>
    </ThemeProvider>
  );
}
