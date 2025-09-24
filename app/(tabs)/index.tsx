import React from 'react';
import { View, ScrollView, Text } from 'react-native';
import { Stack } from 'expo-router';

// Import the home page directly instead of using a redirect
// This ensures the content appears in the tabs layout
export default function TabsIndex() {
  // Import the Home component's content directly
  const HomeScreen = require('../index').default;
  
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <HomeScreen />
    </>
  );
}