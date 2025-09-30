import React, { useEffect } from 'react';
import { Slot, router, SplashScreen } from 'expo-router';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
      try {
        // Check for inconsistent auth state
        const checkAuthState = async () => {
          const asyncAuth = await AsyncStorage.getItem('user_authenticated');
          if ((isLoggedIn && !user) || (!isLoggedIn && asyncAuth === 'true')) {
            await AsyncStorage.removeItem('user_authenticated');
          }
        };
        checkAuthState();
        
        if (isLoggedIn && user) {
          router.replace('/tabs/' as any);
        } else {
          router.replace('/auth/login' as any);
        }
      } catch (error) {
        console.error('Navigation error:', error);
        router.replace('/auth/login');
      }
      
      // Hide splash screen once we know where to go
      SplashScreen.hideAsync();
    }
  }, [isLoading, isLoggedIn, user]);
  
  // While loading, return nothing (splash screen remains visible)
  if (isLoading) return null;
  
  // Return a slot to enable child routes to be rendered
  return <Slot />;
  
  // Note: Settings page is accessible from both tabs and directly
}
