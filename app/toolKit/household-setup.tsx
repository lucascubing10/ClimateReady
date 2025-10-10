// app/(tabs)/toolkit/household-setup.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator, 
  Modal,
  Dimensions 
} from 'react-native';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { Picker } from '@react-native-picker/picker';
import { UserProfile } from '../../utils/userDataModel';
import { getUserDocument } from '../../firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { saveAiRecommendation, saveCustomItems } from '../../utils/storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, ZoomIn } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

// Color palette matching your app
const PRIMARY = '#5ba24f';
const PRIMARY_GRADIENT = ['#5ba24f', '#4a8c40'] as const;
const YELLOW = '#fac609';
const ORANGE = '#e5793a';
const BG = '#dcefdd';
const CARD_BG = '#ffffff';

export default function HouseholdSetupScreen() {
  const [household, setHousehold] = useState({
    householdType: '',
    adults: 2,
    children: 0,
    elderly: 0,
    pets: 0,
    specialNeeds: [] as string[],
    region: '',
    riskProfile: [] as string[],
  });

  const { user } = useAuth ? useAuth() : { user: null };

  // Fetch householdType from Firestore on mount
  useEffect(() => {
    const fetchHouseholdType = async () => {
      if (!user?.uid) return;
      try {
        const docSnapshot = await getUserDocument(user.uid);
        if (docSnapshot.exists()) {
          const profile = docSnapshot.data() as UserProfile;
          if (profile.householdType) {
            setHousehold(prev => ({
              ...prev,
              householdType: profile.householdType ?? ''
            }));
          }
        }
      } catch (error) {
        console.warn('Failed to fetch household type:', error);
      }
    };
    fetchHouseholdType();
  }, [user?.uid]);

  const householdTypeOptions = [
    'House',
    'Apartment',
    'Mobile Home',
    'Shared Accommodation',
    'Retirement Community',
  ];

  const specialNeedsOptions = ['mobility', 'visual', 'hearing', 'cognitive', 'medical', 'dietary'];
  const riskProfileOptions = ['earthquake', 'flood', 'hurricane', 'tornado', 'wildfire'];
  const regionOptions = [
    'North America',
    'South America',
    'Europe',
    'Asia',
    'Africa',
    'Australia',
    'Antarctica',
  ];

  const toggleSpecialNeed = (need: string) => {
    setHousehold(prev => ({
      ...prev,
      specialNeeds: prev.specialNeeds.includes(need)
        ? prev.specialNeeds.filter(n => n !== need)
        : [...prev.specialNeeds, need]
    }));
  };

  const toggleRiskProfile = (risk: string) => {
    setHousehold(prev => ({
      ...prev,
      riskProfile: prev.riskProfile.includes(risk)
        ? prev.riskProfile.filter(r => r !== risk)
        : [...prev.riskProfile, risk]
    }));
  };

  const [profileSaved, setProfileSaved] = useState(false);
  const [regionPickerVisible, setRegionPickerVisible] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const GOOGLE_API_KEY = Constants.expoConfig?.extra?.GOOGLE_MAPS_API_KEY || '';

  const getRegionFromCoords = async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_API_KEY}`
      );
      const data = await response.json();
      if (data.status === 'OK' && data.results.length > 0) {
        const address = data.results[0].address_components;
        const regionObj = address.find((c: any) =>
          c.types.includes('administrative_area_level_1')
        );
        const countryObj = address.find((c: any) =>
          c.types.includes('country')
        );
        return regionObj?.long_name || countryObj?.long_name || '';
      }
    } catch (e) {
      console.warn('Failed to reverse geocode:', e);
    }
    return '';
  };

  const handleUseGPS = async () => {
    setLoadingLocation(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to detect your region.');
        setLoadingLocation(false);
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      const region = await getRegionFromCoords(location.coords.latitude, location.coords.longitude);
      if (region) {
        setHousehold(prev => ({ ...prev, region }));
      } else {
        Alert.alert('Location Error', 'Could not determine your region.');
      }
    } catch (error) {
      Alert.alert('Location Error', 'Failed to get location.');
    }
    setLoadingLocation(false);
  };

  const saveProfile = async () => {
    setProfileSaved(true);

    await AsyncStorage.setItem('householdProfile', JSON.stringify({ ...household, householdCompleted: true }));

    // Clear cached AI recommendation and custom toolkit so they will be refreshed
    await saveAiRecommendation('');
    await saveCustomItems([]);

    setTimeout(() => {
      setProfileSaved(false);
      router.replace('/tabs/toolKit');
    }, 2000);
  };

  const goBack = () => router.navigate('/tabs/toolKit');

  // Custom Button Component
  const CustomButton = ({ title, onPress, style, isLoading = false, variant = 'primary' }: any) => {
    if (variant === 'secondary') {
      return (
        <TouchableOpacity 
          style={[styles.secondaryButton, style]} 
          onPress={onPress}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={PRIMARY} />
          ) : (
            <Text style={styles.secondaryButtonText}>{title}</Text>
          )}
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity 
        style={[styles.primaryButton, style]} 
        onPress={onPress}
        disabled={isLoading}
      >
        <LinearGradient
          colors={PRIMARY_GRADIENT}
          style={styles.buttonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>{title}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <ScrollView style={styles.container}>
        {/* Background Elements */}
        <View style={styles.backgroundElements}>
          <View style={[styles.bgCircle, styles.bgCircle1]} />
          <View style={[styles.bgCircle, styles.bgCircle2]} />
          <View style={[styles.bgCircle, styles.bgCircle3]} />
        </View>

        {/* Header with Back Button */}
        <Animated.View 
          entering={FadeInUp.duration(600)}
          style={styles.header}
        >
          <TouchableOpacity onPress={goBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={PRIMARY} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>Household Profile</Text>
            <Text style={styles.subtitle}>Customize your preparedness plan</Text>
          </View>
        </Animated.View>

        {/* Household Type */}
        <Animated.View 
          entering={FadeInUp.duration(600).delay(200)}
          style={styles.card}
        >
          <Text style={styles.cardTitle}>Household Type</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={household.householdType}
              onValueChange={(itemValue) =>
                setHousehold(prev => ({ ...prev, householdType: itemValue }))
              }
              style={styles.picker}
              dropdownIconColor={PRIMARY}
            >
              <Picker.Item label="Select household type" value="" />
              {householdTypeOptions.map(type => (
                <Picker.Item key={type} label={type} value={type} />
              ))}
            </Picker>
          </View>
        </Animated.View>

        {/* Family Members */}
        <Animated.View 
          entering={FadeInUp.duration(600).delay(300)}
          style={styles.card}
        >
          <Text style={styles.cardTitle}>Family Members</Text>
          {['adults', 'children', 'elderly', 'pets'].map((type) => (
            <View key={type} style={styles.counterRow}>
              <Text style={styles.counterLabel}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
                {type === 'elderly' && ' (65+)'}
              </Text>
              <View style={styles.counter}>
                <TouchableOpacity 
                  style={styles.counterButton}
                  onPress={() => setHousehold(prev => ({ 
                    ...prev, 
                    [type]: Math.max(type === 'adults' ? 1 : 0, prev[type as keyof typeof prev] as number - 1)
                  }))}
                >
                  <Text style={styles.counterButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.counterValue}>{household[type as keyof typeof household]}</Text>
                <TouchableOpacity 
                  style={styles.counterButton}
                  onPress={() => setHousehold(prev => ({ 
                    ...prev, 
                    [type]: (prev[type as keyof typeof prev] as number) + 1
                  }))}
                >
                  <Text style={styles.counterButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </Animated.View>

        {/* Special Needs */}
        <Animated.View 
          entering={FadeInUp.duration(600).delay(400)}
          style={styles.card}
        >
          <Text style={styles.cardTitle}>Special Needs</Text>
          <Text style={styles.cardDescription}>Select any special needs in your household</Text>
          <View style={styles.chipContainer}>
            {specialNeedsOptions.map(need => (
              <TouchableOpacity
                key={need}
                style={[
                  styles.chip,
                  household.specialNeeds.includes(need) && styles.chipSelected
                ]}
                onPress={() => toggleSpecialNeed(need)}
              >
                <Text style={[
                  styles.chipText,
                  household.specialNeeds.includes(need) && styles.chipTextSelected
                ]}>
                  {need.charAt(0).toUpperCase() + need.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Location & Risks */}
        <Animated.View 
          entering={FadeInUp.duration(600).delay(500)}
          style={styles.card}
        >
          <Text style={styles.cardTitle}>Location & Risks</Text>
          
          <Text style={styles.label}>Your Region</Text>
          <View style={styles.regionContainer}>
            <TouchableOpacity
              style={styles.regionInput}
              onPress={() => setRegionPickerVisible(true)}
            >
              <Text style={styles.regionInputText}>
                {household.region || 'Select your region'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#9ca3af" />
            </TouchableOpacity>
            
            <CustomButton
              title="Use GPS"
              onPress={handleUseGPS}
              isLoading={loadingLocation}
              variant="secondary"
              style={styles.gpsButton}
            />
          </View>

          {regionPickerVisible && (
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={household.region}
                onValueChange={(itemValue) => {
                  setHousehold(prev => ({ ...prev, region: itemValue }));
                  setRegionPickerVisible(false);
                }}
                style={styles.picker}
                dropdownIconColor={PRIMARY}
              >
                <Picker.Item label="Select your region" value="" />
                {regionOptions.map(region => (
                  <Picker.Item key={region} label={region} value={region} />
                ))}
              </Picker>
            </View>
          )}

          <Text style={styles.label}>Potential Risks in Your Area</Text>
          <View style={styles.chipContainer}>
            {riskProfileOptions.map(risk => (
              <TouchableOpacity
                key={risk}
                style={[
                  styles.chip,
                  household.riskProfile.includes(risk) && styles.chipSelected
                ]}
                onPress={() => toggleRiskProfile(risk)}
              >
                <Text style={[
                  styles.chipText,
                  household.riskProfile.includes(risk) && styles.chipTextSelected
                ]}>
                  {risk.charAt(0).toUpperCase() + risk.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Save Button */}
        <Animated.View 
          entering={FadeInUp.duration(600).delay(600)}
          style={styles.saveButtonContainer}
        >
          <CustomButton
            title="Save Household Profile"
            onPress={saveProfile}
            style={styles.saveButton}
          />
        </Animated.View>
      </ScrollView>

      {/* Loading Modal */}
      <Modal visible={profileSaved} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View 
            entering={ZoomIn.duration(400)}
            style={styles.modalContent}
          >
            <ActivityIndicator size="large" color={PRIMARY} />
            <Text style={styles.modalTitle}>Personalizing your toolkit...</Text>
            <Text style={styles.modalSubtitle}>
              Our AI is preparing recommendations just for you!
            </Text>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    paddingHorizontal: 20,
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
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 60,
    marginBottom: 24,
  },
  backButton: {
    marginRight: 16,
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#e8f5e8',
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 22,
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f9fafb',
  },
  picker: {
    height: 50,
    color: '#1f2937',
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 4,
  },
  counterLabel: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  counterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e8f5e8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  counterButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: PRIMARY,
  },
  counterValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    minWidth: 24,
    textAlign: 'center',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  chipSelected: {
    backgroundColor: '#e8f5e8',
    borderColor: PRIMARY,
  },
  chipText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  chipTextSelected: {
    color: PRIMARY,
    fontWeight: '600',
  },
  label: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },
  regionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  regionInput: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
  },
  regionInputText: {
    fontSize: 16,
    color: '#1f2937',
  },
  gpsButton: {
    paddingHorizontal: 16,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#e8f5e8',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: PRIMARY,
  },
  secondaryButtonText: {
    color: PRIMARY,
    fontSize: 14,
    fontWeight: '600',
  },
  saveButtonContainer: {
    marginVertical: 24,
  },
  saveButton: {
    width: '100%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
    marginHorizontal: 20,
  },
  modalTitle: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: '700',
    color: PRIMARY,
    textAlign: 'center',
  },
  modalSubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#6366f1',
    textAlign: 'center',
    lineHeight: 20,
  },
});