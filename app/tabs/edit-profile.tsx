import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { InputField, Button } from '../../components/AuthComponents';
import { useAuth } from '../../context/AuthContext';
import { UserProfile, householdTypes, languageOptions, genderOptions } from '../../utils/userDataModel';

export default function EditProfileScreen() {
  const { userProfile, updateUserProfile } = useAuth();
  const router = useRouter();
  const { section } = useLocalSearchParams<{ section: string }>();
  const [isLoading, setIsLoading] = useState(false);
  
  // Refs for each section to enable scrolling
  const scrollViewRef = useRef<ScrollView>(null);
  const basicInfoRef = useRef<View>(null);
  const preferencesRef = useRef<View>(null);
  const personalDetailsRef = useRef<View>(null);
  const addressRef = useRef<View>(null);
  const emergencyContactsRef = useRef<View>(null);
  const medicalInfoRef = useRef<View>(null);
  
  // Use current profile data as initial state
  const [formData, setFormData] = useState({
    firstName: userProfile?.firstName || '',
    lastName: userProfile?.lastName || '',
    phoneNumber: userProfile?.phoneNumber || '',
    preferredLanguage: userProfile?.preferredLanguage || '',
    householdType: userProfile?.householdType || '',
    gender: userProfile?.gender || '',
    birthday: userProfile?.birthday || '',
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
        ...formData,
        updatedAt: Date.now(),
      });
      
      Alert.alert('Success', 'Profile updated successfully');
      router.back();
    } catch (error) {
      // @ts-ignore
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Calculate profile completeness (this would normally be done in the backend or with a helper function)
  const calculateCompleteness = () => {
    let completed = 0;
    let total = 0;
    
    // Required fields (always count)
    if (formData.firstName) completed++;
    if (formData.lastName) completed++;
    total += 2;
    
    // Optional fields (only count if provided)
    const optionalFields = ['phoneNumber', 'preferredLanguage', 'householdType', 'gender', 'birthday'];
    optionalFields.forEach(field => {
      if (formData[field as keyof typeof formData]) {
        completed++;
      }
      total++;
    });
    
    return Math.round((completed / total) * 100);
  };
  
  const completenessPercentage = calculateCompleteness();
  
  // Scroll to the appropriate section when the component mounts
  useEffect(() => {
    if (section && scrollViewRef.current) {
      setTimeout(() => {
        let sectionRef;
        switch(section.toLowerCase()) {
          case 'basic info':
            sectionRef = basicInfoRef;
            break;
          case 'preferences':
            sectionRef = preferencesRef;
            break;
          case 'personal details':
            sectionRef = personalDetailsRef;
            break;
          case 'address':
            sectionRef = addressRef;
            break;
          case 'emergency contacts':
            sectionRef = emergencyContactsRef;
            break;
          case 'medical info':
            sectionRef = medicalInfoRef;
            break;
        }
        
        if (sectionRef?.current) {
          sectionRef.current.measure((fx, fy, width, height, px, py) => {
            scrollViewRef.current?.scrollTo({ y: py - 100, animated: true });
          });
        }
      }, 300);
    }
  }, [section]);
  
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Edit Profile',
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
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Completeness indicator */}
          <View style={styles.completenessContainer}>
            <View style={styles.progressBarBg}>
              <View 
                style={[
                  styles.progressBar, 
                  { width: `${completenessPercentage}%` },
                  completenessPercentage < 30 ? styles.progressLow :
                  completenessPercentage < 70 ? styles.progressMedium :
                  styles.progressHigh
                ]} 
              />
            </View>
            <Text style={styles.completenessText}>
              Profile {completenessPercentage}% complete
            </Text>
          </View>
          
          <View 
            style={styles.formContainer} 
            ref={basicInfoRef}
          >
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
            
            <View ref={preferencesRef}>
              <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
                Preferences
              </Text>
            </View>
            
            <Text style={styles.fieldLabel}>Preferred Language</Text>
            <View style={styles.optionsContainer}>
              {languageOptions.map((language) => (
                <TouchableOpacity
                  key={language}
                  style={[
                    styles.optionButton,
                    formData.preferredLanguage === language && styles.selectedOption
                  ]}
                  onPress={() => handleChange('preferredLanguage', language)}
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
                  onPress={() => handleChange('householdType', type)}
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
            
            <View ref={personalDetailsRef}>
              <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Personal Details</Text>
            </View>
            
            <Text style={styles.fieldLabel}>Gender</Text>
            <View style={styles.optionsContainer}>
              {genderOptions.map((gender) => (
                <TouchableOpacity
                  key={gender}
                  style={[
                    styles.optionButton,
                    formData.gender === gender && styles.selectedOption
                  ]}
                  onPress={() => handleChange('gender', gender)}
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
              leftIcon={<Ionicons name="calendar-outline" size={20} color="#9ca3af" />}
            />
            
            {/* Address Section */}
            <View ref={addressRef}>
              <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Address</Text>
            </View>
            <View style={styles.placeholderSection}>
              <Text style={styles.placeholderText}>
                Address editing will be available in a future update.
              </Text>
              <TouchableOpacity 
                style={styles.comingSoonButton}
                onPress={() => Alert.alert('Coming Soon', 'Address editing will be available in a future update.')}
              >
                <Text style={styles.comingSoonButtonText}>Coming Soon</Text>
              </TouchableOpacity>
            </View>
            
            {/* Emergency Contacts Section */}
            <View ref={emergencyContactsRef}>
              <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Emergency Contacts</Text>
            </View>
            <View style={styles.placeholderSection}>
              <Text style={styles.placeholderText}>
                Emergency contact management will be available in a future update.
              </Text>
              <TouchableOpacity 
                style={styles.comingSoonButton}
                onPress={() => Alert.alert('Coming Soon', 'Emergency contact management will be available in a future update.')}
              >
                <Text style={styles.comingSoonButtonText}>Coming Soon</Text>
              </TouchableOpacity>
            </View>
            
            {/* Medical Information Section */}
            <View ref={medicalInfoRef}>
              <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Medical Information</Text>
            </View>
            <View style={styles.placeholderSection}>
              <Text style={styles.placeholderText}>
                Medical information management will be available in a future update.
              </Text>
              <TouchableOpacity 
                style={styles.comingSoonButton}
                onPress={() => Alert.alert('Coming Soon', 'Medical information management will be available in a future update.')}
              >
                <Text style={styles.comingSoonButtonText}>Coming Soon</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.noteContainer}>
              <Ionicons name="information-circle" size={20} color="#6b7280" />
              <Text style={styles.noteText}>
                Complete your profile to get the most out of ClimateReady's safety features.
              </Text>
            </View>
            
            <Button
              title={isLoading ? 'Saving...' : 'Save Profile'}
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
  scrollContent: {
    padding: 20,
  },
  completenessContainer: {
    marginBottom: 24,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressLow: {
    backgroundColor: '#ef4444',
  },
  progressMedium: {
    backgroundColor: '#f59e0b',
  },
  progressHigh: {
    backgroundColor: '#10b981',
  },
  completenessText: {
    color: '#6b7280',
    fontSize: 14,
    textAlign: 'center',
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
  placeholderSection: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    alignItems: 'center',
  },
  placeholderText: {
    color: '#6b7280',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  comingSoonButton: {
    backgroundColor: '#e5e7eb',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  comingSoonButtonText: {
    color: '#4b5563',
    fontSize: 14,
    fontWeight: '500',
  },
});