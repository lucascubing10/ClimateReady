import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SafeZonesScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ 
        title: 'Safe Zones',
        headerShown: true 
      }} />
      
      <View style={styles.content}>
        <Image
          source={require('../../assets/images/ClimateReadyv3.png')}
          style={styles.comingSoonImage}
          resizeMode="contain"
        />
        <Text style={styles.title}>Safe Zones Feature Coming Soon</Text>
        <Text style={styles.description}>
          Find and share designated safety zones in your area during emergencies.
          This feature will allow you to:
        </Text>
        
        <View style={styles.featureList}>
          <View style={styles.featureItem}>
            <Text style={styles.featureTitle}>• Discover Nearby Safe Zones</Text>
            <Text style={styles.featureDescription}>Find emergency shelters, hospitals, and other designated safe areas near you.</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Text style={styles.featureTitle}>• Save Personal Safe Zones</Text>
            <Text style={styles.featureDescription}>Mark places you consider safe for quick access during emergencies.</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Text style={styles.featureTitle}>• Share With Contacts</Text>
            <Text style={styles.featureDescription}>Let your emergency contacts know where to find you in case of emergency.</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  comingSoonImage: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#4b5563',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  featureList: {
    width: '100%',
    marginTop: 10,
  },
  featureItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0284c7',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
});