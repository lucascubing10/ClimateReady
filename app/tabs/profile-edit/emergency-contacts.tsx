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

export default function EditEmergencyContactsScreen() {
  const { userProfile, updateUserProfile } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // Get the primary contact or create a default empty one
  const primaryContact = userProfile?.emergencyContacts?.length 
    ? userProfile.emergencyContacts[0] 
    : { name: '', phoneNumber: '', relationship: '', email: '' };
  
  // Use current profile data as initial state
  const [formData, setFormData] = useState({
    name: primaryContact.name,
    phoneNumber: primaryContact.phoneNumber,
    relationship: primaryContact.relationship,
    email: primaryContact.email || '',
  });
  
  const [errors, setErrors] = useState({
    name: '',
    phoneNumber: '',
    relationship: '',
    email: '',
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
    
    if (!formData.name.trim()) {
      newErrors.name = 'Contact name is required';
      isValid = false;
    }
    
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Contact phone number is required';
      isValid = false;
    } else if (!/^\+?\d{10,15}$/.test(formData.phoneNumber.replace(/\s/g, ''))) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
      isValid = false;
    }
    
    if (!formData.relationship.trim()) {
      newErrors.relationship = 'Relationship is required';
      isValid = false;
    }
    
    // Email validation if provided
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };
  
  const handleSave = async () => {
    if (!validateForm()) return;
    
    try {
      setIsLoading(true);
      
      // Create an array with the updated primary contact
      const updatedContacts = [{
        name: formData.name,
        phoneNumber: formData.phoneNumber,
        relationship: formData.relationship,
        email: formData.email,
      }];
      
      await updateUserProfile({
        emergencyContacts: updatedContacts,
        hasAddedEmergencyContact: true,
        updatedAt: Date.now(),
      });
      
      Alert.alert('Success', 'Emergency contact updated successfully');
      // Navigate back to profile page
      router.replace('/tabs/profile' as any);
    } catch (error) {
      // @ts-ignore
      Alert.alert('Error', error.message || 'Failed to update emergency contact');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Edit Emergency Contact',
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
            <Text style={styles.sectionTitle}>Primary Emergency Contact</Text>
            
            <InputField
              label="Full Name"
              value={formData.name}
              onChangeText={(text) => handleChange('name', text)}
              placeholder="Contact Name"
              error={errors.name}
              required
              leftIcon={<Ionicons name="person-outline" size={20} color="#9ca3af" />}
            />
            
            <InputField
              label="Phone Number"
              value={formData.phoneNumber}
              onChangeText={(text) => handleChange('phoneNumber', text)}
              placeholder="Contact Phone Number"
              keyboardType="phone-pad"
              error={errors.phoneNumber}
              required
              leftIcon={<Ionicons name="call-outline" size={20} color="#9ca3af" />}
            />
            
            <InputField
              label="Relationship"
              value={formData.relationship}
              onChangeText={(text) => handleChange('relationship', text)}
              placeholder="e.g. Parent, Spouse, Friend"
              error={errors.relationship}
              required
              leftIcon={<Ionicons name="people-outline" size={20} color="#9ca3af" />}
            />
            
            <InputField
              label="Email (Optional)"
              value={formData.email}
              onChangeText={(text) => handleChange('email', text)}
              placeholder="contact@example.com"
              keyboardType="email-address"
              error={errors.email}
              leftIcon={<Ionicons name="mail-outline" size={20} color="#9ca3af" />}
            />
            
            <View style={styles.noteContainer}>
              <Ionicons name="information-circle" size={20} color="#6b7280" />
              <Text style={styles.noteText}>
                Emergency contacts will be notified in crisis situations when you use safety features.
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