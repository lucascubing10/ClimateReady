import React from 'react';
import { Stack } from 'expo-router';
import ToolkitScreen from '../toolKit/index';

// This file is needed to make the ToolKit tab appear in the bottom navigation
export default function ToolKitTab() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ToolkitScreen />
    </>
  );
}