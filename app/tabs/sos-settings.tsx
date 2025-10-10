// Screen: Allows the user to configure what medical details are shared with emergency
// contacts when they trigger the SOS flow. The toggles write to local storage via
// `saveSOSSettings`, while the preview helps users understand exactly what will be sent.
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { SOSSettings, DEFAULT_SOS_SETTINGS, saveSOSSettings, getSOSSettings } from '../../utils/sos/sosService';

// Helper function to calculate age from birthday
const calculateAge = (birthday: string): number => {
  const birthdate = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birthdate.getFullYear();
  const monthDiff = today.getMonth() - birthdate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthdate.getDate())) {
    age--;
  }
  return age;
};

export default function SOSSettingsScreen() {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<SOSSettings>(DEFAULT_SOS_SETTINGS);

  const decodedReturnTo = useMemo(() => {
    if (typeof returnTo === 'string' && returnTo.length > 0) {
      try {
        const decoded = decodeURIComponent(returnTo);
        return decoded.startsWith('/') ? decoded : `/${decoded}`;
      } catch (error) {
        return returnTo.startsWith('/') ? returnTo : `/${returnTo}`;
      }
    }
    return undefined;
  }, [returnTo]);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    if (decodedReturnTo) {
      router.replace(decodedReturnTo as any);
      return;
    }

    router.replace('/tabs/settings');
  }, [router, decodedReturnTo]);

  // Load settings on mount
  // On mount we hydrate the screen with the most recent settings from
  // persistent storage. These settings live locally because they only
  // inform what the device shares during SOS.
  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      const savedSettings = await getSOSSettings();
      setSettings(savedSettings);
      setLoading(false);
    };
    
    loadSettings();
  }, []);

  // Toggle a setting
  // Generic toggle handler so each Switch can flip its respective field.
  const toggleSetting = (key: keyof SOSSettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Save settings
  // Persist the user choices and provide feedback before returning to SOS.
  const handleSaveSettings = async () => {
    setLoading(true);
    const success = await saveSOSSettings(settings);
    
    if (success) {
      Alert.alert('Success', 'SOS settings saved successfully.');
      handleBack();
    } else {
      Alert.alert('Error', 'Could not save settings. Please try again.');
    }
    
    setLoading(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen 
          options={{ 
            title: 'SOS Settings', 
            headerShown: true,
            headerLeft: () => (
              <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
                <Ionicons name="chevron-back" size={24} color="#1f2937" />
              </TouchableOpacity>
            ),
          }} 
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0284c7" />
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // We only show certain toggles when the profile has corresponding data.
  const hasMedicalInfo = !!userProfile?.medicalInfo;

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'SOS Settings', 
          headerShown: true,
          headerLeft: () => (
            <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
              <Ionicons name="chevron-back" size={24} color="#1f2937" />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Emergency Information Sharing</Text>
        <Text style={styles.description}>
          Configure what information is shared with your emergency contacts when you activate SOS.
          Your name and location will always be shared.
        </Text>
        
        <View style={styles.messagePreviewContainer}>
          <Text style={styles.previewTitle}>Emergency Message Preview</Text>
          <View style={styles.messagePreview}>
            <Text style={styles.messageText}>
              EMERGENCY SOS ALERT from {userProfile?.firstName} {userProfile?.lastName}. I need help. Track my live location: [Link]
              {'\n\n'}
              {settings.shareAge && userProfile?.birthday ? `Age: ${calculateAge(userProfile.birthday)}\n` : ''}
              {settings.shareBloodType && userProfile?.medicalInfo?.bloodType ? `Blood Type: ${userProfile.medicalInfo.bloodType}\n` : ''}
              {settings.shareMedicalConditions && userProfile?.medicalInfo?.conditions && userProfile.medicalInfo.conditions.length > 0 ? 
                `Medical Conditions: ${userProfile.medicalInfo.conditions.join(', ')}\n` : ''}
              {settings.shareAllergies && userProfile?.medicalInfo?.allergies && userProfile.medicalInfo.allergies.length > 0 ? 
                `Allergies: ${userProfile.medicalInfo.allergies.join(', ')}\n` : ''}
              {settings.shareMedications && userProfile?.medicalInfo?.medications && userProfile.medicalInfo.medications.length > 0 ? 
                `Medications: ${userProfile.medicalInfo.medications.join(', ')}\n` : ''}
              {settings.shareNotes && userProfile?.medicalInfo?.notes ? `Notes: ${userProfile.medicalInfo.notes}` : ''}
            </Text>
          </View>
        </View>
        
        <View style={styles.settingsContainer}>
          <View style={styles.settingRow}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>Share Blood Type</Text>
              <Text style={styles.settingDescription}>
                {userProfile?.medicalInfo?.bloodType || 'Not set'}
              </Text>
            </View>
            <Switch
              value={settings.shareBloodType}
              onValueChange={() => toggleSetting('shareBloodType')}
              disabled={!userProfile?.medicalInfo?.bloodType}
              trackColor={{ false: '#d1d5db', true: '#bae6fd' }}
              thumbColor={settings.shareBloodType ? '#0284c7' : '#f4f4f5'}
            />
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>Share Allergies</Text>
              <Text style={styles.settingDescription}>
                {userProfile?.medicalInfo?.allergies && userProfile.medicalInfo.allergies.length > 0 
                  ? `${userProfile.medicalInfo.allergies.length} allergy(s) set` 
                  : 'Not set'}
              </Text>
            </View>
            <Switch
              value={settings.shareAllergies}
              onValueChange={() => toggleSetting('shareAllergies')}
              disabled={!userProfile?.medicalInfo?.allergies || userProfile.medicalInfo.allergies.length === 0}
              trackColor={{ false: '#d1d5db', true: '#bae6fd' }}
              thumbColor={settings.shareAllergies ? '#0284c7' : '#f4f4f5'}
            />
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>Share Medical Conditions</Text>
              <Text style={styles.settingDescription}>
                {userProfile?.medicalInfo?.conditions && userProfile.medicalInfo.conditions.length > 0 
                  ? `${userProfile.medicalInfo.conditions.length} condition(s) set` 
                  : 'Not set'}
              </Text>
            </View>
            <Switch
              value={settings.shareMedicalConditions}
              onValueChange={() => toggleSetting('shareMedicalConditions')}
              disabled={!userProfile?.medicalInfo?.conditions || userProfile.medicalInfo.conditions.length === 0}
              trackColor={{ false: '#d1d5db', true: '#bae6fd' }}
              thumbColor={settings.shareMedicalConditions ? '#0284c7' : '#f4f4f5'}
            />
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>Share Medications</Text>
              <Text style={styles.settingDescription}>
                {userProfile?.medicalInfo?.medications && userProfile.medicalInfo.medications.length > 0 
                  ? `${userProfile.medicalInfo.medications.length} medication(s) set` 
                  : 'Not set'}
              </Text>
            </View>
            <Switch
              value={settings.shareMedications}
              onValueChange={() => toggleSetting('shareMedications')}
              disabled={!userProfile?.medicalInfo?.medications || userProfile.medicalInfo.medications.length === 0}
              trackColor={{ false: '#d1d5db', true: '#bae6fd' }}
              thumbColor={settings.shareMedications ? '#0284c7' : '#f4f4f5'}
            />
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>Share Medical Notes</Text>
              <Text style={styles.settingDescription}>
                {userProfile?.medicalInfo?.notes ? 'Notes set' : 'Not set'}
              </Text>
            </View>
            <Switch
              value={settings.shareNotes}
              onValueChange={() => toggleSetting('shareNotes')}
              disabled={!userProfile?.medicalInfo?.notes}
              trackColor={{ false: '#d1d5db', true: '#bae6fd' }}
              thumbColor={settings.shareNotes ? '#0284c7' : '#f4f4f5'}
            />
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>Share Age</Text>
              <Text style={styles.settingDescription}>
                {userProfile?.birthday ? `Age: ${calculateAge(userProfile.birthday)}` : 'Not set'}
              </Text>
            </View>
            <Switch
              value={settings.shareAge}
              onValueChange={() => toggleSetting('shareAge')}
              disabled={!userProfile?.birthday}
              trackColor={{ false: '#d1d5db', true: '#bae6fd' }}
              thumbColor={settings.shareAge ? '#0284c7' : '#f4f4f5'}
            />
          </View>
        </View>
        
        {!hasMedicalInfo && (
          <View style={styles.warningContainer}>
            <Ionicons name="alert-circle-outline" size={24} color="#dc2626" />
            <Text style={styles.warningText}>
              You haven't added any medical information to your profile yet.
              Adding this information can help emergency responders provide better care.
            </Text>
            <TouchableOpacity 
              style={styles.addInfoButton}
              onPress={() => router.push('/tabs/profile-edit/medical-info')}
            >
              <Text style={styles.addInfoButtonText}>Add Medical Info</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSaveSettings}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>Save Settings</Text>
        </TouchableOpacity>
        
        <View style={styles.infoContainer}>
          <Ionicons name="information-circle-outline" size={20} color="#6b7280" />
          <Text style={styles.infoText}>
            These settings control what information is included when you send an SOS alert.
            Your name and location are always shared with emergency contacts.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerButton: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    marginLeft: 12,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#4b5563',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#4b5563',
    marginBottom: 24,
  },
  settingsContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  settingTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  settingDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  warningContainer: {
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    flexDirection: 'column',
    alignItems: 'center',
  },
  warningText: {
    fontSize: 14,
    color: '#b91c1c',
    marginTop: 8,
    marginBottom: 16,
    textAlign: 'center',
  },
  addInfoButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addInfoButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#0284c7',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 30,
    paddingHorizontal: 4,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#6b7280',
    flex: 1,
  },
  messagePreviewContainer: {
    marginBottom: 24,
    width: '100%',
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  messagePreview: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  messageText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
});