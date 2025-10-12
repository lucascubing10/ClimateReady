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
  ActivityIndicator,
  Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter, usePathname } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { UserProfile } from '../../utils/userDataModel';
import refreshProfile from '../../utils/profileRefresh';
import { LinearGradient } from 'expo-linear-gradient';
import type { ColorValue } from 'react-native';
import Animated, { 
  FadeInUp, 
  FadeInRight,
  ZoomIn
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

// Color palette - matching login screen
const PRIMARY = '#5ba24f';
const PRIMARY_GRADIENT: readonly [ColorValue, ColorValue] = ['#5ba24f', '#4a8c40'];
const YELLOW = '#fac609';
const YELLOW_GRADIENT = ['#fac609', '#e6b408'];
const ORANGE = '#e5793a';
const ORANGE_GRADIENT = ['#e5793a', '#d4692a'];
const BG = '#dcefdd';
const CARD_BG = '#ffffff';

// Progress bar component for profile completeness
const ProfileCompleteness = ({ percentage }: { percentage: number }) => (
  <View style={styles.completenessContainer}>
    <View style={styles.progressBarContainer}>
      <LinearGradient
        colors={getProgressGradient(percentage)}
        style={[
          styles.progressBar, 
          { width: `${percentage}%` }
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      />
    </View>
    <Text style={styles.completenessText}>
      Profile {percentage}% complete
    </Text>
  </View>
);

// Helper function to get gradient based on progress
const getProgressGradient = (percentage: number): readonly [ColorValue, ColorValue] => {
  if (percentage < 30) return ['#ef4444', '#dc2626'];
  if (percentage < 70) return ['#f59e0b', '#d97706'];
  return ['#10b981', '#059669'];
};

// Profile section component with animations
const ProfileSection = ({ 
  title, 
  items, 
  onPress,
  delay = 0
}: { 
  title: string; 
  items: Array<{ 
    label: string; 
    value: string | null | undefined; 
    icon: JSX.Element; 
    isComplete: boolean; 
  }>; 
  onPress: () => void;
  delay?: number;
}) => (
  <Animated.View 
    entering={FadeInUp.duration(600).delay(delay)}
    style={styles.section}
  >
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <TouchableOpacity onPress={onPress} style={styles.editButtonContainer}>
        <Text style={styles.editButton}>Edit</Text>
      </TouchableOpacity>
    </View>
    <View style={styles.sectionContent}>
      {items.map((item, index) => (
        <View key={index} style={styles.profileItem}>
          <View style={[
            styles.iconContainer,
            item.isComplete ? styles.iconComplete : styles.iconIncomplete
          ]}>
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
  </Animated.View>
);

// Screen: overview of the user's profile completeness plus quick entry points to edit sections.
export default function ProfileScreen() {
  const { userProfile, logout, isLoading, reloadUserProfile } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Set a timeout for loading
  useEffect(() => {
    if (!userProfile) {
      const timer = setTimeout(() => {
        setLoadingTimeout(true);
      }, 5000); // 5 seconds timeout
      
      return () => clearTimeout(timer);
    }
  }, [userProfile]);

  // Navigate to edit profile section
  const navigateToEditSection = (section: string) => {
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
        router.push({
          pathname: '/tabs/profile-edit/emergency-contacts',
          params: { returnTo: encodeURIComponent(typeof pathname === 'string' ? pathname : '/tabs/profile') },
        } as any);
        break;
      case 'medical info':
        router.push('/tabs/profile-edit/medical-info' as any);
        break;
      default:
        router.push('/tabs/profile' as any);
    }
  };

  // Handle when there's no user profile
  if (!userProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Profile' }} />
        {/* Background Elements */}
        <View style={styles.backgroundElements}>
          <View style={[styles.bgCircle, styles.bgCircle1]} />
          <View style={[styles.bgCircle, styles.bgCircle2]} />
          <View style={[styles.bgCircle, styles.bgCircle3]} />
        </View>
        
        <View style={styles.loadingContainer}>
          {loadingTimeout ? (
            <Animated.View entering={ZoomIn.duration(600)} style={styles.errorContainer}>
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
                <LinearGradient
                  colors={PRIMARY_GRADIENT}
                  style={styles.retryButtonGradient}
                >
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <Animated.View entering={ZoomIn.duration(600)} style={styles.loadingContent}>
              <ActivityIndicator size="large" color={PRIMARY} />
              <Text style={styles.loadingText}>Loading profile...</Text>
            </Animated.View>
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
      
      {/* Background Elements */}
      <View style={styles.backgroundElements}>
        <View style={[styles.bgCircle, styles.bgCircle1]} />
        <View style={[styles.bgCircle, styles.bgCircle2]} />
        <View style={[styles.bgCircle, styles.bgCircle3]} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <LinearGradient
          colors={PRIMARY_GRADIENT}
          style={styles.profileHeader}
        >
          {/* Header Buttons */}
          <View style={styles.headerButtonsContainer}>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => {
                console.log("Navigating to settings page");
                const current = typeof pathname === 'string' && pathname.length > 0 ? pathname : '/tabs/profile';
                router.push({
                  pathname: '/tabs/settings',
                  params: { returnTo: encodeURIComponent(current) },
                } as any);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="settings-outline" size={24} color="#fff" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.headerButton}
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
          </View>
          
          {/* Profile Info */}
          <Animated.View 
            entering={ZoomIn.duration(800)}
            style={styles.profileInfo}
          >
            <View style={styles.profileImageContainer}>
              <Text style={styles.profileInitials}>
                {userProfile.firstName?.[0] || ''}{userProfile.lastName?.[0] || ''}
              </Text>
            </View>
            <Text style={styles.profileName}>{userProfile.firstName} {userProfile.lastName}</Text>
            <Text style={styles.profileEmail}>{userProfile.email}</Text>
          </Animated.View>

          {/* Profile Completeness */}
          <Animated.View 
            entering={FadeInUp.duration(600).delay(200)}
            style={styles.completenessWrapper}
          >
            <ProfileCompleteness percentage={profileCompleteness} />
          </Animated.View>
        </LinearGradient>
        
        {/* Profile Sections */}
        <View style={styles.content}>
          <ProfileSection
            title="Basic Information"
            onPress={() => navigateToEditSection('basic info')}
            delay={400}
            items={[
              {
                label: 'Full Name',
                value: `${userProfile.firstName} ${userProfile.lastName}`,
                icon: <Ionicons name="person" size={20} color="#fff" />,
                isComplete: basicInfoComplete,
              },
              {
                label: 'Email',
                value: userProfile.email,
                icon: <Ionicons name="mail" size={20} color="#fff" />,
                isComplete: !!userProfile.email,
              },
              {
                label: 'Phone Number',
                value: userProfile.phoneNumber,
                icon: <Ionicons name="call" size={20} color="#fff" />,
                isComplete: contactInfoComplete,
              },
            ]}
          />
          
          <ProfileSection
            title="Preferences"
            onPress={() => navigateToEditSection('preferences')}
            delay={500}
            items={[
              {
                label: 'Preferred Language',
                value: userProfile.preferredLanguage,
                icon: <Ionicons name="language" size={20} color="#fff" />,
                isComplete: !!userProfile.preferredLanguage,
              },
              {
                label: 'Household Type',
                value: userProfile.householdType,
                icon: <Ionicons name="home" size={20} color="#fff" />,
                isComplete: !!userProfile.householdType,
              },
            ]}
          />
          
          <ProfileSection
            title="Personal Details"
            onPress={() => navigateToEditSection('personal details')}
            delay={600}
            items={[
              {
                label: 'Gender',
                value: userProfile.gender,
                icon: <MaterialCommunityIcons name="gender-male-female" size={20} color="#fff" />,
                isComplete: !!userProfile.gender,
              },
              {
                label: 'Birthday',
                value: userProfile.birthday,
                icon: <Ionicons name="calendar" size={20} color="#fff" />,
                isComplete: !!userProfile.birthday,
              },
            ]}
          />
          
          <ProfileSection
            title="Address"
            onPress={() => navigateToEditSection('address')}
            delay={700}
            items={[
              {
                label: 'Home Address',
                value: userProfile.address ? 
                  `${userProfile.address.street || ''}, ${userProfile.address.city || ''}, ${userProfile.address.state || ''} ${userProfile.address.zip || ''}` :
                  null,
                icon: <Ionicons name="location" size={20} color="#fff" />,
                isComplete: addressComplete,
              },
            ]}
          />
          
          <ProfileSection
            title="Emergency Contacts"
            onPress={() => navigateToEditSection('emergency contacts')}
            delay={800}
            items={[
              {
                label: 'Primary Emergency Contact',
                value: userProfile.emergencyContacts && 
                       Array.isArray(userProfile.emergencyContacts) && 
                       userProfile.emergencyContacts.length > 0 && 
                       userProfile.emergencyContacts[0] ? 
                  `${userProfile.emergencyContacts[0].name} (${userProfile.emergencyContacts[0].relationship})` : 
                  null,
                icon: <Ionicons name="people" size={20} color="#fff" />,
                isComplete: emergencyContactsComplete,
              },
            ]}
          />
          
          <ProfileSection
            title="Medical Information"
            onPress={() => navigateToEditSection('medical info')}
            delay={900}
            items={[
              {
                label: 'Medical Information',
                value: userProfile.medicalInfo ? 'Provided' : null,
                icon: <Ionicons name="medical" size={20} color="#fff" />,
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
    backgroundColor: BG,
  },
  scrollView: {
    flex: 1,
  },
  backgroundElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  bgCircle: {
    position: 'absolute',
    borderRadius: 500,
    opacity: 0.1,
  },
  bgCircle1: {
    width: 300,
    height: 300,
    backgroundColor: PRIMARY,
    top: -150,
    right: -100,
  },
  bgCircle2: {
    width: 200,
    height: 200,
    backgroundColor: YELLOW,
    bottom: -50,
    left: -50,
  },
  bgCircle3: {
    width: 150,
    height: 150,
    backgroundColor: ORANGE,
    top: '30%',
    right: '20%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  profileHeader: {
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerButtonsContainer: {
    position: 'absolute',
    top: 10,
    right: 15,
    flexDirection: 'row',
    zIndex: 10,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginLeft: 8,
  },
  profileInfo: {
    alignItems: 'center',
    marginTop: 20,
  },
  profileImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  profileInitials: {
    fontSize: 32,
    fontWeight: 'bold',
    color: PRIMARY,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 16,
  },
  completenessWrapper: {
    width: '100%',
    marginTop: 16,
  },
  completenessContainer: {
    width: '100%',
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  completenessText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  editButtonContainer: {
    padding: 4,
  },
  editButton: {
    color: PRIMARY,
    fontWeight: '600',
    fontSize: 14,
  },
  sectionContent: {
    padding: 16,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconComplete: {
    backgroundColor: PRIMARY,
  },
  iconIncomplete: {
    backgroundColor: '#9ca3af',
  },
  itemContent: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  itemValue: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '600',
    marginTop: 2,
  },
  itemMissing: {
    fontSize: 15,
    color: '#9ca3af',
    fontStyle: 'italic',
    marginTop: 2,
  },
  errorText: {
    marginTop: 16,
    color: '#dc2626',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  retryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  retryButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});