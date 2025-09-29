import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, Stack } from 'expo-router';

/**
 * This is a redirect page that sends users to the new profile editing interface.
 * The old monolithic edit-profile page has been replaced with individual section editors.
 */
export default function EditProfileRedirectScreen() {
  const router = useRouter();
  
  // Automatically redirect to the profile page
  useEffect(() => {
    // Small delay to show the redirect message
    const redirectTimer = setTimeout(() => {
      router.replace('/tabs/profile');
    }, 1000);
    
    return () => clearTimeout(redirectTimer);
  }, [router]);
  
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Redirecting...' }} />
      <View style={styles.content}>
        <ActivityIndicator size="large" color="#0284c7" />
        <Text style={styles.redirectText}>
          Redirecting to the new profile page...
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  redirectText: {
    fontSize: 16,
    color: '#4b5563',
    marginTop: 16,
    textAlign: 'center',
  }
});