import { Stack } from 'expo-router';
import { AuthProvider } from '../../context/AuthContext';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

export default function AuthLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{
        headerShown: false,
      }} />
    </AuthProvider>
  );
}