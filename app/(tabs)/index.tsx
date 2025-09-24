import React from 'react';
import { Redirect } from 'expo-router';

// This file redirects from /(tabs) to the main home screen
export default function TabsIndex() {
  return <Redirect href={'/'} />;
}