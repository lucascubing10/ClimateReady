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
import { Button } from '../../../components/AuthComponents';
import { useAuth } from '../../../context/AuthContext';
import { householdTypes, languageOptions } from '../../../utils/userDataModel';

export default function EditPreferencesScreen() {
  const { userProfile, updateUserProfile } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // Use current profile data as initial state
  const [formData, setFormData] = useState({
    preferredLanguage: userProfile?.preferredLanguage || '',
    householdType: userProfile?.householdType || '',
  });
  
  const handleSave = async () => {
    try {
      setIsLoading(true);
      
      await updateUserProfile({
        preferredLanguage: formData.preferredLanguage,
        householdType: formData.householdType,
        updatedAt: Date.now(),
      });
      
      Alert.alert('Success', 'Preferences updated successfully');
      // Navigate back to profile page
      router.replace('/(tabs)/profile' as any);
    } catch (error) {
      // @ts-ignore
      Alert.alert('Error', error.message || 'Failed to update preferences');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Edit Preferences',
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
            <Text style={styles.sectionTitle}>Preferences</Text>
            
            <Text style={styles.fieldLabel}>Preferred Language</Text>
            <View style={styles.optionsContainer}>
              {languageOptions.map((language) => (
                <TouchableOpacity
                  key={language}
                  style={[
                    styles.optionButton,
                    formData.preferredLanguage === language && styles.selectedOption
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, preferredLanguage: language }))}
                >
                  <Text
                    style={[
                      styles.optionText,
                      formData.preferredLanguage === language && styles.selectedOptionText
                    ]}
                  >
                    {language}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={styles.fieldLabel}>Household Type</Text>
            <View style={styles.optionsContainer}>
              {householdTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.optionButton,
                    formData.householdType === type && styles.selectedOption
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, householdType: type }))}
                >
                  <Text
                    style={[
                      styles.optionText,
                      formData.householdType === type && styles.selectedOptionText
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.noteContainer}>
              <Ionicons name="information-circle" size={20} color="#6b7280" />
              <Text style={styles.noteText}>
                Your preferences help us provide more relevant safety recommendations based on your living situation.
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