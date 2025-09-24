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

export default function EditBasicInfoScreen() {
  const { userProfile, updateUserProfile } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // Use current profile data as initial state
  const [formData, setFormData] = useState({
    firstName: userProfile?.firstName || '',
    lastName: userProfile?.lastName || '',
    phoneNumber: userProfile?.phoneNumber || '',
  });
  
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
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
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
      isValid = false;
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
      isValid = false;
    }
    
    // Phone number validation (optional field)
    if (formData.phoneNumber && !/^\+?\d{10,15}$/.test(formData.phoneNumber.replace(/\s/g, ''))) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
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
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        updatedAt: Date.now(),
      });
      
      Alert.alert('Success', 'Basic information updated successfully');
      // Navigate back to profile page
      router.replace('/(tabs)/profile' as any);
    } catch (error) {
      // @ts-ignore
      Alert.alert('Error', error.message || 'Failed to update basic information');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Edit Basic Information',
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
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <View style={styles.nameRow}>
              <InputField
                label="First Name"
                value={formData.firstName}
                onChangeText={(text) => handleChange('firstName', text)}
                placeholder="First name"
                autoCapitalize="words"
                error={errors.firstName}
                required
                containerStyle={styles.nameInput}
              />
              
              <InputField
                label="Last Name"
                value={formData.lastName}
                onChangeText={(text) => handleChange('lastName', text)}
                placeholder="Last name"
                autoCapitalize="words"
                error={errors.lastName}
                required
                containerStyle={styles.nameInput}
              />
            </View>
            
            <InputField
              label="Phone Number"
              value={formData.phoneNumber}
              onChangeText={(text) => handleChange('phoneNumber', text)}
              placeholder="Phone number"
              keyboardType="phone-pad"
              error={errors.phoneNumber}
              leftIcon={<Ionicons name="call-outline" size={20} color="#9ca3af" />}
            />
            
            <View style={styles.noteContainer}>
              <Ionicons name="information-circle" size={20} color="#6b7280" />
              <Text style={styles.noteText}>
                Your name and phone number help identify you in emergency situations.
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
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nameInput: {
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