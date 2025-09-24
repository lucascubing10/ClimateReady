import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function Index() {
  const { isLoggedIn } = useAuth();
  
  // Redirect to the appropriate route based on authentication status
  if (isLoggedIn) {
    return <Redirect href="/(tabs)" />;
  }
  
  return <Redirect href="/login" />;
}