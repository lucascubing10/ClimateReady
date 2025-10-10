export interface UserProfile {
  // Must-Have data (required for registration)
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string; // Optional during registration but important

  // Important for Onboarding (should be collected soon after registration)
  preferredLanguage?: string;
  householdType?: string; // e.g., apartment, house, mobile home
  
  // Nice-to-Have (can be filled later)
  gender?: string;
  birthday?: string; // stored as string in YYYY-MM-DD format
  
  // Sensitive Data (requires special handling and explicit permission)
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  emergencyContacts?: Array<{
    name: string;
    phoneNumber: string;
    relationship: string;
    email?: string;
  }>;
  medicalInfo?: {
    allergies?: string[];
    conditions?: string[];
    medications?: string[];
    bloodType?: string;
    notes?: string;
  };
  
  // System fields
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
  lastLoginAt?: number; // timestamp
  profileCompleteness?: number; // percentage of profile completion
  pushToken?: string; // Expo push token for remote notifications
  pushTokenUpdatedAt?: number; // timestamp when token last synced with backend
  
  // Flags for tracking completion of important sections
  hasCompletedOnboarding?: boolean;
  hasAddedEmergencyContact?: boolean;
  hasAddedMedicalInfo?: boolean;
}

// This helps track which fields the user has completed
export interface ProfileCompletionStatus {
  basicInfo: boolean; // First name, last name, email
  contactInfo: boolean; // Phone number
  preferences: boolean; // Language, household
  personalDetails: boolean; // Gender, birthday
  location: boolean; // Address
  emergencyContacts: boolean;
  medicalInfo: boolean;
}

// Categories for UI organization and prioritization
export const fieldCategories = {
  mustHave: ['firstName', 'lastName', 'email'],
  importantForOnboarding: ['phoneNumber', 'preferredLanguage', 'householdType'],
  niceToHave: ['gender', 'birthday'],
  sensitive: ['address', 'emergencyContacts', 'medicalInfo']
};

// For dropdown options
export const householdTypes = [
  'Apartment',
  'House',
  'Mobile home',
  'Shared accommodation',
  'Retirement community',
  'Other'
];

export const languageOptions = [
  'English',
  'Spanish',
  'French',
  'Chinese',
  'Arabic',
  'Russian',
  'Hindi',
  'Portuguese',
  'Other'
];

export const genderOptions = [
  'Male',
  'Female',
  'Prefer not to say'
];

// Helper function to calculate profile completeness percentage
export const calculateProfileCompleteness = (profile: UserProfile): number => {
  // If profile is undefined or null, return 0
  if (!profile) return 0;
  
  // Define weights for different sections (must total 100)
  const weights = {
    basicInfo: 20, // First name, last name, email
    contactInfo: 10, // Phone
    preferences: 10, // Language, household
    personalDetails: 10, // Gender, birthday
    location: 15, // Address
    emergencyContacts: 20,
    medicalInfo: 15
  };
  
  let completeness = 0;
  
  // Basic info (must have)
  if (profile.firstName && profile.lastName && profile.email) {
    completeness += weights.basicInfo;
  }
  
  // Contact info
  if (profile.phoneNumber) {
    completeness += weights.contactInfo;
  }
  
  // Preferences
  if (profile.preferredLanguage && profile.householdType) {
    completeness += weights.preferences;
  } else if (profile.preferredLanguage || profile.householdType) {
    completeness += weights.preferences / 2;
  }
  
  // Personal details
  if (profile.gender && profile.birthday) {
    completeness += weights.personalDetails;
  } else if (profile.gender || profile.birthday) {
    completeness += weights.personalDetails / 2;
  }
  
  // Location
  if (profile.address?.street && profile.address?.city && profile.address?.state && profile.address?.zip) {
    completeness += weights.location;
  } else if (profile.address) {
    const addressFields = ['street', 'city', 'state', 'zip', 'country'].filter(
      field => profile.address && profile.address[field as keyof typeof profile.address]
    ).length;
    
    if (addressFields > 0) {
      completeness += (weights.location * addressFields) / 5;
    }
  }
  
  // Emergency contacts
  if (profile.emergencyContacts && profile.emergencyContacts.length > 0) {
    completeness += weights.emergencyContacts;
  }
  
  // Medical info
  if (profile.medicalInfo) {
    const medicalFields = ['allergies', 'conditions', 'medications', 'bloodType'].filter(
      field => profile.medicalInfo && profile.medicalInfo[field as keyof typeof profile.medicalInfo]
    ).length;
    
    if (medicalFields > 0) {
      completeness += (weights.medicalInfo * medicalFields) / 4;
    }
  }
  
  return Math.min(Math.round(completeness), 100);
};

// Create a new empty user profile
export const createEmptyUserProfile = (email: string, firstName: string, lastName: string): UserProfile => {
  const timestamp = Date.now();
  
  return {
    firstName,
    lastName,
    email,
    createdAt: timestamp,
    updatedAt: timestamp,
    profileCompleteness: 20, // Basic profile is 20% complete with just name and email
    hasCompletedOnboarding: false,
    hasAddedEmergencyContact: false,
    hasAddedMedicalInfo: false,
    pushToken: undefined,
    pushTokenUpdatedAt: undefined
  };
};