import React from 'react';
import { View, ScrollView, Text } from 'react-native';
import { Stack } from 'expo-router';

// This screen simply renders the root home experience inside the tab navigator.
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