import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function Index() {
  const { isLoggedIn } = useAuth();
  
  // Redirect to the appropriate route based on authentication status
  if (isLoggedIn) {
    // Using type assertion to bypass type checking for path
    return <Redirect href={'/(tabs)/index' as any} />;
  }
  
  // Using type assertion to bypass type checking for path
  return <Redirect href={'/(auth)/login' as any} />;
}