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
import { genderOptions } from '../../../utils/userDataModel';

export default function EditPersonalDetailsScreen() {
  const { userProfile, updateUserProfile } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // Use current profile data as initial state
  const [formData, setFormData] = useState({
    gender: userProfile?.gender || '',
    birthday: userProfile?.birthday || '',
  });
  
  const [errors, setErrors] = useState({
    birthday: '',
  });
  
  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'birthday' && errors.birthday) {
      setErrors(prev => ({ ...prev, birthday: '' }));
    }
  };
  
  const validateForm = () => {
    const newErrors = { ...errors };
    let isValid = true;
    
    // Birthday validation (YYYY-MM-DD format)
    if (formData.birthday && !/^\d{4}-\d{2}-\d{2}$/.test(formData.birthday)) {
      newErrors.birthday = 'Please use YYYY-MM-DD format';
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
        gender: formData.gender,
        birthday: formData.birthday,
        updatedAt: Date.now(),
      });
      
      Alert.alert('Success', 'Personal details updated successfully');
      // Navigate back to profile page
      router.replace('/tabs/profile' as any);
    } catch (error) {
      // @ts-ignore
      Alert.alert('Error', error.message || 'Failed to update personal details');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Edit Personal Details',
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
            <Text style={styles.sectionTitle}>Personal Details</Text>
            
            <Text style={styles.fieldLabel}>Gender</Text>
            <View style={styles.optionsContainer}>
              {genderOptions.map((gender) => (
                <TouchableOpacity
                  key={gender}
                  style={[
                    styles.optionButton,
                    formData.gender === gender && styles.selectedOption
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, gender }))}
                >
                  <Text
                    style={[
                      styles.optionText,
                      formData.gender === gender && styles.selectedOptionText
                    ]}
                  >
                    {gender}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <InputField
              label="Birthday"
              value={formData.birthday}
              onChangeText={(text) => handleChange('birthday', text)}
              placeholder="YYYY-MM-DD"
              error={errors.birthday}
              leftIcon={<Ionicons name="calendar-outline" size={20} color="#9ca3af" />}
            />
            
            <View style={styles.noteContainer}>
              <Ionicons name="information-circle" size={20} color="#6b7280" />
              <Text style={styles.noteText}>
                This information helps provide age-appropriate safety recommendations.
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
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  optionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginRight: 8,
    marginBottom: 8,
  },
  selectedOption: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  optionText: {
    color: '#4b5563',
    fontSize: 14,
  },
  selectedOptionText: {
    color: '#fff',
    fontWeight: '500',
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