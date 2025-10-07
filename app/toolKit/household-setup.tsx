// app/(tabs)/toolkit/household-setup.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Modal } from 'react-native';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { Picker } from '@react-native-picker/picker';
import { UserProfile } from '../../utils/userDataModel';
import { getUserDocument } from '../../firebaseConfig';
import { useAuth } from '../../context/AuthContext'; // If you have an auth context
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

export default function HouseholdSetupScreen() {
  const [household, setHousehold] = useState({
    householdType: '',
    adults: 2,
    children: 0,
    elderly: 0,
    pets: 0,
    specialNeeds: [] as string[],
    region: '',
    riskProfile: [] as string[],
  });

  const { user } = useAuth ? useAuth() : { user: null }; // fallback if no context

  // Fetch householdType from Firestore on mount
  useEffect(() => {
    const fetchHouseholdType = async () => {
      if (!user?.uid) return;
      try {
        const docSnapshot = await getUserDocument(user.uid);
        if (docSnapshot.exists()) {
          const profile = docSnapshot.data() as UserProfile;
          if (profile.householdType) {
            setHousehold(prev => ({
              ...prev,
              householdType: profile.householdType ?? ''
            }));
          }
        }
      } catch (error) {
        console.warn('Failed to fetch household type:', error);
      }
    };
    fetchHouseholdType();
  }, [user?.uid]);

  const householdTypeOptions = [
    'House',
    'Apartment',
    'Mobile Home',
    'Shared Accommodation',
    'Retirement Community',
  ];

  const specialNeedsOptions = ['mobility', 'visual', 'hearing', 'cognitive', 'medical', 'dietary'];
  const riskProfileOptions = ['earthquake', 'flood', 'hurricane', 'tornado', 'wildfire'];
  const regionOptions = [
    'North America',
    'South America',
    'Europe',
    'Asia',
    'Africa',
    'Australia',
    'Antarctica',
  ];

  const toggleSpecialNeed = (need: string) => {
    setHousehold(prev => ({
      ...prev,
      specialNeeds: prev.specialNeeds.includes(need)
        ? prev.specialNeeds.filter(n => n !== need)
        : [...prev.specialNeeds, need]
    }));
  };

  const toggleRiskProfile = (risk: string) => {
    setHousehold(prev => ({
      ...prev,
      riskProfile: prev.riskProfile.includes(risk)
        ? prev.riskProfile.filter(r => r !== risk)
        : [...prev.riskProfile, risk]
    }));
  };

  const [profileSaved, setProfileSaved] = useState(false);

  const saveProfile = async () => {
    setProfileSaved(true); // Show animation

    // Save household profile to AsyncStorage (or your backend)
    await AsyncStorage.setItem('householdProfile', JSON.stringify({ ...household, householdCompleted: true }));

    setTimeout(() => {
      setProfileSaved(false);
      router.replace('/tabs/toolKit'); // Go to toolkit page (not back)
    }, 2000);
  };

  const [regionPickerVisible, setRegionPickerVisible] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const GOOGLE_API_KEY = Constants.expoConfig?.extra?.GOOGLE_MAPS_API_KEY || '';

  const getRegionFromCoords = async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_API_KEY}`
      );
      const data = await response.json();
      if (data.status === 'OK' && data.results.length > 0) {
        const address = data.results[0].address_components;
        const regionObj = address.find((c: any) =>
          c.types.includes('administrative_area_level_1')
        );
        const countryObj = address.find((c: any) =>
          c.types.includes('country')
        );
        return regionObj?.long_name || countryObj?.long_name || '';
      }
    } catch (e) {
      console.warn('Failed to reverse geocode:', e);
    }
    return '';
  };

  const handleUseGPS = async () => {
    setLoadingLocation(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to detect your region.');
        setLoadingLocation(false);
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      const region = await getRegionFromCoords(location.coords.latitude, location.coords.longitude);
      if (region) {
        setHousehold(prev => ({ ...prev, region }));
      } else {
        Alert.alert('Location Error', 'Could not determine your region.');
      }
    } catch (error) {
      Alert.alert('Location Error', 'Failed to get location.');
    }
    setLoadingLocation(false);
  };

  return (
    <>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Household Profile</Text>
        <Text style={styles.subtitle}>Customize your preparedness plan</Text>

        {/* Household Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Household Type</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={household.householdType}
              onValueChange={(itemValue) =>
                setHousehold(prev => ({ ...prev, householdType: itemValue }))
              }
              style={styles.picker}
              dropdownIconColor="#2e7d32"
            >
              <Picker.Item label="Select household type" value="" />
              {householdTypeOptions.map(type => (
                <Picker.Item key={type} label={type} value={type} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Family Members */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Family Members</Text>
          {['adults', 'children', 'elderly', 'pets'].map((type) => (
            <View key={type} style={styles.counterRow}>
              <Text style={styles.counterLabel}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
                {type === 'elderly' && ' (65+)'
}
              </Text>
              <View style={styles.counter}>
                <TouchableOpacity 
                  style={styles.counterButton}
                  onPress={() => setHousehold(prev => ({ 
                    ...prev, 
                    [type]: Math.max(type === 'adults' ? 1 : 0, prev[type as keyof typeof prev] as number - 1)
                  }))}
                >
                  <Text style={styles.counterButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.counterValue}>{household[type as keyof typeof household]}</Text>
                <TouchableOpacity 
                  style={styles.counterButton}
                  onPress={() => setHousehold(prev => ({ 
                    ...prev, 
                    [type]: (prev[type as keyof typeof prev] as number) + 1
                  }))}
                >
                  <Text style={styles.counterButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Special Needs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Special Needs</Text>
          <Text style={styles.sectionDescription}>Select any special needs in your household</Text>
          <View style={styles.chipContainer}>
            {specialNeedsOptions.map(need => (
              <TouchableOpacity
                key={need}
                style={[
                  styles.chip,
                  household.specialNeeds.includes(need) && styles.chipSelected
                ]}
                onPress={() => toggleSpecialNeed(need)}
              >
                <Text style={[
                  styles.chipText,
                  household.specialNeeds.includes(need) && styles.chipTextSelected
                ]}>
                  {need.charAt(0).toUpperCase() + need.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Location & Risks */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location & Risks</Text>
          <Text style={styles.label}>Your Region</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity
              style={[styles.input, { flex: 1 }]}
              onPress={() => setRegionPickerVisible(true)}
            >
              <Text style={styles.inputText}>
                {household.region || 'Select your region'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                backgroundColor: '#e8f5e8',
                borderRadius: 8,
                padding: 10,
                marginLeft: 8,
                borderWidth: 1,
                borderColor: '#2e7d32',
              }}
              onPress={handleUseGPS}
              disabled={loadingLocation}
            >
              {loadingLocation ? (
                <ActivityIndicator color="#2e7d32" />
              ) : (
                <Text style={{ color: '#2e7d32', fontWeight: '600' }}>Use GPS</Text>
              )}
            </TouchableOpacity>
          </View>
          {regionPickerVisible && (
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={household.region}
                onValueChange={(itemValue) => {
                  setHousehold(prev => ({ ...prev, region: itemValue }));
                  setRegionPickerVisible(false);
                }}
                style={styles.picker}
                dropdownIconColor="#2e7d32"
              >
                <Picker.Item label="Select your region" value="" />
                {regionOptions.map(region => (
                  <Picker.Item key={region} label={region} value={region} />
                ))}
              </Picker>
            </View>
          )}

          <Text style={styles.label}>Potential Risks in Your Area</Text>
          <View style={styles.chipContainer}>
            {riskProfileOptions.map(risk => (
              <TouchableOpacity
                key={risk}
                style={[
                  styles.chip,
                  household.riskProfile.includes(risk) && styles.chipSelected
                ]}
                onPress={() => toggleRiskProfile(risk)}
              >
                <Text style={[
                  styles.chipText,
                  household.riskProfile.includes(risk) && styles.chipTextSelected
                ]}>
                  {risk.charAt(0).toUpperCase() + risk.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={saveProfile}>
          <Text style={styles.saveButtonText}>Save Household Profile</Text>
        </TouchableOpacity>
      </ScrollView>
      {/* Fun AI Loading Animation Modal */}
      <Modal visible={profileSaved} transparent animationType="fade">
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.15)',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 20,
            padding: 32,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.15,
            shadowRadius: 16,
            elevation: 10
          }}>
            <ActivityIndicator size="large" color="#7c3aed" />
            <Text style={{ marginTop: 20, fontSize: 18, fontWeight: '700', color: '#7c3aed', textAlign: 'center' }}>
              Personalizing your toolkit...
            </Text>
            <Text style={{ marginTop: 8, fontSize: 14, color: '#6366f1', textAlign: 'center' }}>
              Our AI is preparing recommendations just for you!
            </Text>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2e7d32',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f8f9fa',
    marginVertical: 8,
  },
  picker: {
    height: 48,
    width: '100%',
    color: '#333',
    backgroundColor: '#f8f9fa',
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  counterLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  counterButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e8f5e8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2e7d32',
  },
  counterValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    minWidth: 20,
    textAlign: 'center',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  chipSelected: {
    backgroundColor: '#e8f5e8',
    borderColor: '#2e7d32',
  },
  chipText: {
    fontSize: 14,
    color: '#666',
  },
  chipTextSelected: {
    color: '#2e7d32',
    fontWeight: '500',
  },
  label: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  inputText: {
    fontSize: 16,
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#2e7d32',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginVertical: 16,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});