// app/(tabs)/toolkit/household-setup.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';

export default function HouseholdSetupScreen() {
  const [household, setHousehold] = useState({
    adults: 2,
    children: 0,
    elderly: 0,
    pets: 0,
    specialNeeds: [] as string[],
    region: '',
    riskProfile: [] as string[],
  });

  const specialNeedsOptions = ['mobility', 'visual', 'hearing', 'cognitive', 'medical', 'dietary'];
  const riskProfileOptions = ['earthquake', 'flood', 'hurricane', 'tornado', 'wildfire'];

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

  const saveProfile = () => {
    console.log('Saving household profile:', household);
    router.back();
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Household Profile</Text>
      <Text style={styles.subtitle}>Customize your preparedness plan</Text>

      {/* Family Members */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Family Members</Text>
        
        {['adults', 'children', 'elderly', 'pets'].map((type) => (
          <View key={type} style={styles.counterRow}>
            <Text style={styles.counterLabel}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
              {type === 'elderly' && ' (65+)'}
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
        <TouchableOpacity style={styles.input}>
          <Text style={styles.inputText}>
            {household.region || 'Select your region'}
          </Text>
        </TouchableOpacity>

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