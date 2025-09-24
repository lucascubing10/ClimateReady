import React, { useEffect } from 'react';
import { Slot, router, SplashScreen } from 'expo-router';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Keep the splash screen visible while we check authentication
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <AuthProvider>
      <SafeAreaProvider>
        <RootLayoutNav />
      </SafeAreaProvider>
    </AuthProvider>
  );
}

function RootLayoutNav() {
  const { isLoading, isLoggedIn, user } = useAuth();
  
  useEffect(() => {
    if (!isLoading) {
      // Automatically route based on auth status
      try {
        if (isLoggedIn && user) {
          // Navigate to the home screen tab
          router.replace('/(tabs)/index' as any);
        } else {
          // Navigate to login
          router.replace('/(auth)/login' as any);
        }
      } catch (error) {
        console.error('Navigation error:', error);
        // Fallback navigation if the main routes fail
        router.replace('/');
      }
      
      // Hide splash screen once we know where to go
      SplashScreen.hideAsync();
    }
  }, [isLoading, isLoggedIn, user]);
  
  // While loading, return nothing (splash screen remains visible)
  if (isLoading) return null;
  
  // Return a slot to enable child routes to be rendered
  return <Slot />;
}
