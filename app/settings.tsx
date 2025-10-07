import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { SOSSettings, DEFAULT_SOS_SETTINGS, saveSOSSettings, getSOSSettings } from '../utils/sos/sosService';

const PRIMARY = '#5ba24f';
const SECONDARY = '#0284c7';
const DANGER = '#dc2626';
const CARD_BG = '#ffffff';

// Settings Section Component
const SettingsSection = ({ 
  title, 
  icon, 
  color = PRIMARY, 
  children 
}: { 
  title: string;
  icon: string;
  color?: string;
  children: React.ReactNode;
}) => {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={[styles.iconContainer, { backgroundColor: color }]}>
          <Ionicons name={icon as any} color="#fff" size={20} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );
};

// Settings Item Component
const SettingsItem = ({ 
  label, 
  value, 
  onPress, 
  icon, 
  showArrow = true,
  switchValue,
  onToggle
}: { 
  label: string;
  value?: string;
  onPress?: () => void;
  icon?: string;
  showArrow?: boolean;
  switchValue?: boolean;
  onToggle?: (value: boolean) => void;
}) => {
  return (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={onPress}
      disabled={!onPress && !onToggle}
    >
      <View style={styles.settingContent}>
        {icon && <Ionicons name={icon as any} size={20} color="#555" style={styles.settingIcon} />}
        <View style={{ flex: 1 }}>
          <Text style={styles.settingLabel}>{label}</Text>
          {value && <Text style={styles.settingValue}>{value}</Text>}
        </View>
        {onToggle !== undefined && (
          <Switch
            value={switchValue}
            onValueChange={onToggle}
            trackColor={{ false: '#d1d5db', true: '#bae6fd' }}
            thumbColor={switchValue ? SECONDARY : '#f4f4f5'}
          />
        )}
        {showArrow && !onToggle && <Ionicons name="chevron-forward" size={20} color="#aaa" />}
      </View>
    </TouchableOpacity>
  );
};

export default function SettingsScreen() {
  const router = useRouter();
  const { userProfile, logout } = useAuth();
  const [sosSettings, setSOSSettings] = useState<SOSSettings>(DEFAULT_SOS_SETTINGS);
  
  // Load SOS settings when the screen loads
  useEffect(() => {
    const loadSettings = async () => {
      const settings = await getSOSSettings();
      setSOSSettings(settings);
    };
    
    loadSettings();
  }, []);

  // Toggle a SOS setting
  const toggleSOSSetting = async (key: keyof SOSSettings) => {
    const newSettings = {
      ...sosSettings,
      [key]: !sosSettings[key]
    };
    
    setSOSSettings(newSettings);
    await saveSOSSettings(newSettings);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ 
        title: 'Settings',
        headerShown: true,
      }} />
      
      <ScrollView style={styles.content}>
        {/* Account Settings */}
        <SettingsSection title="Account" icon="person" color={PRIMARY}>
          <SettingsItem 
            label="View & Edit Profile"
            icon="person-circle"
            onPress={() => router.push('/tabs/profile' as any)}
          />
          <SettingsItem
            label="Change Password"
            icon="key"
            onPress={() => router.push('/auth/forgot-password' as any)}
          />
        </SettingsSection>
        
        {/* SOS Emergency Settings */}
        <SettingsSection title="SOS Emergency" icon="alert-circle" color={DANGER}>
          <SettingsItem 
            label="Emergency Contacts"
            value={`${userProfile?.emergencyContacts?.length || 0} contacts added`}
            onPress={() => router.push('/tabs/profile-edit/emergency-contacts' as any)}
          />
          <SettingsItem 
            label="SOS Settings"
            onPress={() => router.push('/tabs/sos-settings' as any)}
          />
          <SettingsItem 
            label="SOS History" 
            onPress={() => router.push('/tabs/sos-history' as any)}
          />
          <SettingsItem 
            label="Share Blood Type" 
            switchValue={sosSettings.shareBloodType}
            onToggle={() => toggleSOSSetting('shareBloodType')}
          />
          <SettingsItem 
            label="Share Medical Conditions" 
            switchValue={sosSettings.shareMedicalConditions}
            onToggle={() => toggleSOSSetting('shareMedicalConditions')}
          />
          <SettingsItem 
            label="Share Medications" 
            switchValue={sosSettings.shareMedications}
            onToggle={() => toggleSOSSetting('shareMedications')}
          />
        </SettingsSection>
        
        {/* App Settings */}
        <SettingsSection title="App Settings" icon="settings" color={SECONDARY}>
          <SettingsItem 
            label="Notifications" 
            onPress={() => {}}
          />
          <SettingsItem 
            label="Dark Mode" 
            switchValue={false}
            onToggle={() => {}}
          />
          <SettingsItem 
            label="Location Services" 
            onPress={() => {}}
          />
          <SettingsItem 
            label="Language" 
            value="English"
            onPress={() => {}}
          />
        </SettingsSection>
        
        {/* About & Support */}
        <SettingsSection title="About & Support" icon="information-circle" color="#6b7280">
          <SettingsItem 
            label="Privacy Policy" 
            onPress={() => {}}
          />
          <SettingsItem 
            label="Terms of Service" 
            onPress={() => {}}
          />
          <SettingsItem 
            label="Help & Support" 
            onPress={() => {}}
          />
          <SettingsItem 
            label="About ClimateReady" 
            value="Version 1.0.0"
            onPress={() => {}}
          />
        </SettingsSection>
        
        {/* Sign Out */}
        <TouchableOpacity 
          style={styles.signOutButton}
          onPress={() => {
            logout();
            router.replace('/auth/login' as any);
          }}
        >
          <Ionicons name="log-out" size={18} color={DANGER} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#dcefdd', // match BG from home
  },
  content: {
    flex: 1,
    padding: 24,
  },
  section: {
    backgroundColor: CARD_BG,
    borderRadius: 24,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginLeft: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionContent: {},
  settingItem: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
  },
  settingValue: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CARD_BG,
    padding: 20,
    borderRadius: 16,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  signOutText: {
    color: DANGER,
    fontWeight: '700',
    fontSize: 18,
    marginLeft: 12,
  },
});