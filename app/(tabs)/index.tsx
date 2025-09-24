import React from 'react';
import { View, Text } from 'react-native';
import { Stack } from 'expo-router';
import HomeScreen from '../index';

// Render the home screen content directly instead of redirecting
export default function TabsIndex() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <HomeScreen />
    </>
  );
}