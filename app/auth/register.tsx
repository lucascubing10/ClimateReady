import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Dimensions,
  SafeAreaView,
  TouchableOpacity
} from 'react-native';
import { Stack, Link, useRouter } from 'expo-router';
import { InputField } from '../../components/AuthComponents';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ColorValue } from 'react-native';
import Animated, { 
  FadeInUp, 
  FadeInRight,
  ZoomIn
} from 'react-native-reanimated';
import { ActivityIndicator } from 'react-native';

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

// Custom Button Component (matching login)
const CustomButton = ({ title, onPress, style, isLoading = false }: any) => {
  return (
    <TouchableOpacity 
      style={[styles.button, style]} 
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
          <Text style={styles.buttonText}>{title}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

// Screen: creates a new ClimateReady user and captures baseline profile fields.
export default function RegisterScreen() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
  });
  
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  
  const { register } = useAuth();
  const router = useRouter();
  
  // Keep the form state and validation errors in sync as the user types.
  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (authError) setAuthError('');
  };
  
  // Apply lightweight client-side validation so we can give actionable
  // feedback before hitting Firebase and so we can highlight each field.
  const validateInputs = () => {
    const newErrors = { ...errors };
    let isValid = true;
    
    // Required fields
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
      isValid = false;
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
      isValid = false;
    }
    
    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
      isValid = false;
    }
    
    // Confirm password
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }
    
    // Phone number (optional)
    if (formData.phoneNumber && !/^\+?\d{10,15}$/.test(formData.phoneNumber.replace(/\s/g, ''))) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };
  
  // Delegate the actual account creation to AuthContext; Firebase will emit
  // the auth state change that reroutes the user into the main app shell.
  const handleRegister = async () => {
    if (!validateInputs()) return;
    
    try {
      setIsLoading(true);
      setAuthError('');
      await register(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName
      );
      
      // If the registration succeeds, the user will be automatically redirected
      // by the auth state change in AuthContext
      
    } catch (error) {
      // @ts-ignore
      const errorMessage = error.message || 'Failed to register';
      console.error('Registration error:', error);
      
      if (errorMessage.includes('email-already-in-use')) {
        setAuthError('This email is already in use. Please try logging in or use a different email.');
        setErrors(prev => ({ ...prev, email: 'Email already in use' }));
      } else if (errorMessage.includes('weak-password')) {
        setAuthError('Password is too weak. Please choose a stronger password.');
        setErrors(prev => ({ ...prev, password: 'Password is too weak' }));
      } else if (errorMessage.includes('invalid-email')) {
        setAuthError('Please enter a valid email address.');
        setErrors(prev => ({ ...prev, email: 'Invalid email format' }));
      } else {
        setAuthError(errorMessage || 'An unexpected error occurred during registration.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Background Elements */}
          <View style={styles.backgroundElements}>
            <View style={[styles.bgCircle, styles.bgCircle1]} />
            <View style={[styles.bgCircle, styles.bgCircle2]} />
            <View style={[styles.bgCircle, styles.bgCircle3]} />
          </View>

          {/* Logo with Animation */}
          <Animated.View 
            entering={ZoomIn.duration(800)}
            style={styles.logoContainer}
          >
            <Image 
              source={require('../../assets/images/ClimateReadyv2.png')} 
              style={styles.logo} 
            />
          </Animated.View>

          {/* Header with Animation */}
          <Animated.View 
            entering={FadeInUp.duration(600).delay(200)}
            style={styles.headerContainer}
          >
            <Text style={styles.header}>Create Account</Text>
            <Text style={styles.subtitle}>Start your climate safety journey</Text>
          </Animated.View>

          {/* Auth Error Banner */}
          {authError ? (
            <Animated.View 
              entering={FadeInUp.duration(400)}
              style={styles.authErrorContainer}
            >
              <Text style={styles.authErrorText}>{authError}</Text>
            </Animated.View>
          ) : null}

          {/* Form Container */}
          <Animated.View 
            entering={FadeInUp.duration(600).delay(400)}
            style={styles.formContainer}
          >
            {/* Name Row */}
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

            {/* Email */}
            <InputField
              label="Email"
              value={formData.email}
              onChangeText={(text) => handleChange('email', text)}
              placeholder="Email address"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
              required
              leftIcon={<Ionicons name="mail-outline" size={20} color="#9ca3af" />}
            />
            
            {/* Phone Number */}
            <InputField
              label="Phone Number (Optional)"
              value={formData.phoneNumber}
              onChangeText={(text) => handleChange('phoneNumber', text)}
              placeholder="Phone number"
              keyboardType="phone-pad"
              error={errors.phoneNumber}
              leftIcon={<Ionicons name="call-outline" size={20} color="#9ca3af" />}
            />
            
            {/* Password */}
            <InputField
              label="Password"
              value={formData.password}
              onChangeText={(text) => handleChange('password', text)}
              placeholder="Create a password"
              secureTextEntry
              error={errors.password}
              required
              leftIcon={<Ionicons name="lock-closed-outline" size={20} color="#9ca3af" />}
            />
            
            {/* Confirm Password */}
            <InputField
              label="Confirm Password"
              value={formData.confirmPassword}
              onChangeText={(text) => handleChange('confirmPassword', text)}
              placeholder="Confirm your password"
              secureTextEntry
              error={errors.confirmPassword}
              required
              leftIcon={<Ionicons name="lock-closed-outline" size={20} color="#9ca3af" />}
            />
            
            {/* Terms Disclaimer */}
            <Animated.View 
              entering={FadeInUp.duration(600).delay(600)}
              style={styles.disclaimerContainer}
            >
              <Text style={styles.disclaimerText}>
                By registering, you agree to ClimateReady's{' '}
                <Text style={styles.textLink}>Terms of Service</Text> and{' '}
                <Text style={styles.textLink}>Privacy Policy</Text>.
              </Text>
            </Animated.View>
            
            {/* Register Button */}
            <Animated.View 
              entering={FadeInUp.duration(600).delay(800)}
              style={styles.buttonContainer}
            >
              <CustomButton
                title="Create Account"
                onPress={handleRegister}
                isLoading={isLoading}
                accessibilityLabel="Create new account"
                accessibilityHint="Creates a new ClimateReady account and navigates to the home screen"
              />
            </Animated.View>
            
            {/* Sign In Link */}
            <Animated.View 
              entering={FadeInUp.duration(600).delay(1000)}
              style={styles.signinContainer}
            >
              <Text style={styles.signinText}>Already have an account? </Text>
              <Link href="/auth/login" asChild>
                <Text style={styles.signinLink}>Sign In</Text>
              </Link>
            </Animated.View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
    justifyContent: 'center',
    alignItems: 'stretch',
    minHeight: '100%',
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
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  logo: {
    width: 180,
    height: 80,
    resizeMode: 'contain',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  header: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  authErrorContainer: {
    backgroundColor: '#fee2e2',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  authErrorText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '500',
  },
  formContainer: {
    zIndex: 1,
    alignItems: 'center',
    width: '100%',
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  nameInput: {
    flex: 1,
  },
  disclaimerContainer: {
    marginVertical: 16,
    width: '100%',
  },
  disclaimerText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 16,
  },
  textLink: {
    color: PRIMARY,
    fontWeight: '500',
  },
  buttonContainer: {
    marginBottom: 24,
    width: '100%',
  },
  button: {
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
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 20,
  },
  signinContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signinText: {
    fontSize: 14,
    color: '#6b7280',
  },
  signinLink: {
    color: PRIMARY,
    fontWeight: '600',
    fontSize: 14,
  },
});