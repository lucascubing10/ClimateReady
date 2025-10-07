import React from 'react';
import { Stack } from 'expo-router';

// Layout: centralises the stack configuration for the profile edit wizard.
export default function ProfileEditLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="basic-info" />
      <Stack.Screen name="preferences" />
      <Stack.Screen name="personal-details" />
      <Stack.Screen name="address" />
      <Stack.Screen name="emergency-contacts" />
      <Stack.Screen name="medical-info" />
    </Stack>
  );
}