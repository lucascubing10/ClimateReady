import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { InputField, Button } from '../../../components/AuthComponents';
import { useAuth } from '../../../context/AuthContext';

export default function EditAddressScreen() {
  const { userProfile, updateUserProfile } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // Use current profile data as initial state
  const [formData, setFormData] = useState({
    street: userProfile?.address?.street || '',
    city: userProfile?.address?.city || '',
    state: userProfile?.address?.state || '',
    zip: userProfile?.address?.zip || '',
    country: userProfile?.address?.country || 'United States', // Default value
  });
  
  const [errors, setErrors] = useState({
    street: '',
    city: '',
    state: '',
    zip: '',
  });
  
  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };
  
  const validateForm = () => {
    const newErrors = { ...errors };
    let isValid = true;
    
    // Basic ZIP code validation (US format)
    if (formData.zip && !/^\d{5}(-\d{4})?$/.test(formData.zip)) {
      newErrors.zip = 'Please enter a valid ZIP code';
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };
  
  const handleSave = async () => {
    if (!validateForm()) return;
    
    try {
      setIsLoading(true);
      
      await updateUserProfile({
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
          country: formData.country,
        },
        updatedAt: Date.now(),
      });
      
      Alert.alert('Success', 'Address updated successfully');
      // Navigate back to profile page
      router.replace('/(tabs)/profile' as any);
    } catch (error) {
      // @ts-ignore
      Alert.alert('Error', error.message || 'Failed to update address');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Edit Address',
          headerShown: true,
          headerTitleAlign: 'center',
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.back()}
              style={{ paddingHorizontal: 16 }}
            >
              <Ionicons name="arrow-back" size={24} color="#0284c7" />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>Home Address</Text>
            
            <InputField
              label="Street Address"
              value={formData.street}
              onChangeText={(text) => handleChange('street', text)}
              placeholder="123 Main St"
              error={errors.street}
              leftIcon={<Ionicons name="location-outline" size={20} color="#9ca3af" />}
            />
            
            <InputField
              label="City"
              value={formData.city}
              onChangeText={(text) => handleChange('city', text)}
              placeholder="City"
              error={errors.city}
            />
            
            <View style={styles.rowContainer}>
              <InputField
                label="State"
                value={formData.state}
                onChangeText={(text) => handleChange('state', text)}
                placeholder="State"
                error={errors.state}
                containerStyle={styles.stateInput}
              />
              
              <InputField
                label="ZIP Code"
                value={formData.zip}
                onChangeText={(text) => handleChange('zip', text)}
                placeholder="12345"
                keyboardType="number-pad"
                error={errors.zip}
                containerStyle={styles.zipInput}
              />
            </View>
            
            <InputField
              label="Country"
              value={formData.country}
              onChangeText={(text) => handleChange('country', text)}
              placeholder="Country"
            />
            
            <View style={styles.noteContainer}>
              <Ionicons name="information-circle" size={20} color="#6b7280" />
              <Text style={styles.noteText}>
                Your address helps us provide location-specific emergency information.
              </Text>
            </View>
            
            <Button
              title={isLoading ? 'Saving...' : 'Save Changes'}
              onPress={handleSave}
              disabled={isLoading}
              style={styles.saveButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 20,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stateInput: {
    width: '48%',
  },
  zipInput: {
    width: '48%',
  },
  noteContainer: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 24,
  },
  noteText: {
    flex: 1,
    marginLeft: 8,
    color: '#6b7280',
    fontSize: 14,
  },
  saveButton: {
    marginBottom: 16,
  },
});