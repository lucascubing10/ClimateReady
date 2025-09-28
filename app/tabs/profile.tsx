import React, { useState, useEffect, JSX } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Image,
  ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { UserProfile } from '../../utils/userDataModel';
import refreshProfile from '../../utils/profileRefresh';

// Progress bar component for profile completeness
const ProfileCompleteness = ({ percentage }: { percentage: number }) => (
  <View style={styles.completenessContainer}>
    <View style={styles.progressBarContainer}>
      <View 
        style={[
          styles.progressBar, 
          { width: `${percentage}%`, backgroundColor: getProgressColor(percentage) }
        ]} 
      />
    </View>
    <Text style={styles.completenessText}>
      Profile {percentage}% complete
    </Text>
  </View>
);

// Helper function to get color based on progress
const getProgressColor = (percentage: number) => {
  if (percentage < 30) return '#ef4444'; // red
  if (percentage < 70) return '#f59e0b'; // amber
  return '#10b981'; // emerald
};

// Profile section component
const ProfileSection = ({ 
  title, 
  items, 
  onPress 
}: { 
  title: string; 
  items: Array<{ 
    label: string; 
    value: string | null | undefined; 
    icon: JSX.Element; 
    isComplete: boolean; 
  }>; 
  onPress: () => void; 
}) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <TouchableOpacity onPress={onPress}>
        <Text style={styles.editButton}>Edit</Text>
      </TouchableOpacity>
    </View>
    <View style={styles.sectionContent}>
      {items.map((item, index) => (
        <View key={index} style={styles.profileItem}>
          <View style={styles.iconContainer}>
            {item.icon}
          </View>
          <View style={styles.itemContent}>
            <Text style={styles.itemLabel}>{item.label}</Text>
            {item.value ? (
              <Text style={styles.itemValue}>{item.value}</Text>
            ) : (
              <Text style={styles.itemMissing}>Not provided</Text>
            )}
          </View>
          {item.isComplete ? (
            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
          ) : (
            <Ionicons name="alert-circle-outline" size={20} color="#f59e0b" />
          )}
        </View>
      ))}
    </View>
  </View>
);

export default function ProfileScreen() {
  const { userProfile, logout, isLoading, reloadUserProfile } = useAuth();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  

  

  
  // Navigate to edit profile section
  const navigateToEditSection = (section: string) => {
    // Navigate to the appropriate edit screen based on section
    switch(section.toLowerCase()) {
      case 'basic info':
        router.push('/tabs/profile-edit/basic-info' as any);
        break;
      case 'preferences':
        router.push('/tabs/profile-edit/preferences' as any);
        break;
      case 'personal details':
        router.push('/tabs/profile-edit/personal-details' as any);
        break;
      case 'address':
        router.push('/tabs/profile-edit/address' as any);
        break;
      case 'emergency contacts':
        router.push('/tabs/profile-edit/emergency-contacts' as any);
        break;
      case 'medical info':
        router.push('/tabs/profile-edit/medical-info' as any);
        break;
      default:
        // Fallback to the profile screen if section is not recognized
        router.push('/tabs/profile' as any);
    }
  };
  
  // State for tracking loading timeouts
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Set a timeout for loading
  useEffect(() => {
    if (!userProfile) {
      // Set a timeout to show an error message if profile takes too long to load
      const timer = setTimeout(() => {
        setLoadingTimeout(true);
      }, 5000); // 5 seconds timeout
      
      return () => clearTimeout(timer);
    }
  }, [userProfile]);

  // Handle when there's no user profile
  if (!userProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Profile' }} />
        <View style={styles.loadingContainer}>
          {loadingTimeout ? (
            <>
              <Ionicons name="warning" size={40} color="#f59e0b" />
              <Text style={styles.errorText}>Failed to load profile</Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={async () => {
                  setLoadingTimeout(false);
                  setIsRefreshing(true);
                  try {
                    await reloadUserProfile();
                  } catch (error) {
                    console.error('Failed to reload profile:', error);
                  } finally {
                    setIsRefreshing(false);
                  }
                }}
              >
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <ActivityIndicator size="large" color="#0284c7" />
              <Text style={styles.loadingText}>Loading profile...</Text>
            </>
          )}
        </View>
      </SafeAreaView>
    );
  }
  
  // Calculate completed items
  const basicInfoComplete = !!userProfile.firstName && !!userProfile.lastName && !!userProfile.email;
  const contactInfoComplete = !!userProfile.phoneNumber;
  const preferencesComplete = !!userProfile.preferredLanguage && !!userProfile.householdType;
  const personalDetailsComplete = !!userProfile.gender && !!userProfile.birthday;
  const addressComplete = !!userProfile.address?.street && !!userProfile.address?.city && 
                          !!userProfile.address?.state && !!userProfile.address?.zip;
  const emergencyContactsComplete = !!userProfile.emergencyContacts && 
                              Array.isArray(userProfile.emergencyContacts) && 
                              userProfile.emergencyContacts.length > 0 && 
                              !!userProfile.emergencyContacts[0];
  const medicalInfoComplete = !!userProfile.medicalInfo;
  
  // Profile completeness percentage
  const profileCompleteness = userProfile.profileCompleteness || 0;
  
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <ScrollView>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          {/* Logout Button in Header */}
          <TouchableOpacity 
            style={styles.headerLogoutButton}
            onPress={() => {
              setIsLoggingOut(true);
              try {
                logout()
                  .then(() => {
                    router.replace('/auth/login');
                  })
                  .catch(e => {
                    Alert.alert('Error', 'Failed to log out. Please try again.');
                  })
                  .finally(() => {
                    setIsLoggingOut(false);
                  });
              } catch (error) {
                setIsLoggingOut(false);
              }
            }}
            disabled={isLoggingOut}
            activeOpacity={0.7}
          >
            {isLoggingOut ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="log-out-outline" size={24} color="#fff" />
            )}
          </TouchableOpacity>
          
          <View style={styles.profileImageContainer}>
            <Text style={styles.profileInitials}>
              {userProfile.firstName?.[0] || ''}{userProfile.lastName?.[0] || ''}
            </Text>
          </View>
          <Text style={styles.profileName}>{userProfile.firstName} {userProfile.lastName}</Text>
          <Text style={styles.profileEmail}>{userProfile.email}</Text>
          
          <ProfileCompleteness percentage={profileCompleteness} />
        </View>
        
        {/* Profile Sections */}
        <View style={styles.content}>
          <ProfileSection
            title="Basic Information"
            onPress={() => navigateToEditSection('basic info')}
            items={[
              {
                label: 'Full Name',
                value: `${userProfile.firstName} ${userProfile.lastName}`,
                icon: <Ionicons name="person" size={20} color="#0284c7" />,
                isComplete: basicInfoComplete,
              },
              {
                label: 'Email',
                value: userProfile.email,
                icon: <Ionicons name="mail" size={20} color="#0284c7" />,
                isComplete: !!userProfile.email,
              },
              {
                label: 'Phone Number',
                value: userProfile.phoneNumber,
                icon: <Ionicons name="call" size={20} color="#0284c7" />,
                isComplete: contactInfoComplete,
              },
            ]}
          />
          
          <ProfileSection
            title="Preferences"
            onPress={() => navigateToEditSection('preferences')}
            items={[
              {
                label: 'Preferred Language',
                value: userProfile.preferredLanguage,
                icon: <Ionicons name="language" size={20} color="#0284c7" />,
                isComplete: !!userProfile.preferredLanguage,
              },
              {
                label: 'Household Type',
                value: userProfile.householdType,
                icon: <Ionicons name="home" size={20} color="#0284c7" />,
                isComplete: !!userProfile.householdType,
              },
            ]}
          />
          
          <ProfileSection
            title="Personal Details"
            onPress={() => navigateToEditSection('personal details')}
            items={[
              {
                label: 'Gender',
                value: userProfile.gender,
                icon: <MaterialCommunityIcons name="gender-male-female" size={20} color="#0284c7" />,
                isComplete: !!userProfile.gender,
              },
              {
                label: 'Birthday',
                value: userProfile.birthday,
                icon: <Ionicons name="calendar" size={20} color="#0284c7" />,
                isComplete: !!userProfile.birthday,
              },
            ]}
          />
          
          <ProfileSection
            title="Address"
            onPress={() => navigateToEditSection('address')}
            items={[
              {
                label: 'Home Address',
                value: userProfile.address ? 
                  `${userProfile.address.street || ''}, ${userProfile.address.city || ''}, ${userProfile.address.state || ''} ${userProfile.address.zip || ''}` :
                  null,
                icon: <Ionicons name="location" size={20} color="#0284c7" />,
                isComplete: addressComplete,
              },
            ]}
          />
          
          <ProfileSection
            title="Emergency Contacts"
            onPress={() => navigateToEditSection('emergency contacts')}
            items={[
              {
                label: 'Primary Emergency Contact',
                value: userProfile.emergencyContacts && 
                       Array.isArray(userProfile.emergencyContacts) && 
                       userProfile.emergencyContacts.length > 0 && 
                       userProfile.emergencyContacts[0] ? 
                  `${userProfile.emergencyContacts[0].name} (${userProfile.emergencyContacts[0].relationship})` : 
                  null,
                icon: <Ionicons name="people" size={20} color="#0284c7" />,
                isComplete: emergencyContactsComplete,
              },
            ]}
          />
          
          <ProfileSection
            title="Medical Information"
            onPress={() => navigateToEditSection('medical info')}
            items={[
              {
                label: 'Medical Information',
                value: userProfile.medicalInfo ? 'Provided' : null,
                icon: <Ionicons name="medical" size={20} color="#0284c7" />,
                isComplete: medicalInfoComplete,
              },
            ]}
          />

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#6b7280',
    fontSize: 16,
  },
  profileHeader: {
    backgroundColor: '#0284c7',
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  profileImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileInitials: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0284c7',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 16,
  },
  completenessContainer: {
    width: '100%',
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    marginBottom: 4,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  completenessText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
  content: {
    padding: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  editButton: {
    color: '#0284c7',
    fontWeight: '500',
    fontSize: 14,
  },
  sectionContent: {
    padding: 12,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  itemValue: {
    fontSize: 15,
    color: '#1f2937',
    fontWeight: '500',
  },
  itemMissing: {
    fontSize: 15,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  logoutText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  headerLogoutButton: {
    position: 'absolute',
    top: 10,
    right: 15,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    zIndex: 10,
  },
  errorText: {
    marginTop: 16,
    color: '#dc2626',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});