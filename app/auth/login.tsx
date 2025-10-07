import React, { useEffect, useState, useCallback, JSX } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image
} from 'react-native';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import type { ColorValue } from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import Animated, { 
  FadeInUp, 
  FadeInRight,
  SlideInDown,
  ZoomIn
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { InputField } from '@/components/AuthComponents';
import { ActivityIndicator } from 'react-native';
import { useAuth } from '@/context/AuthContext'; // Add this import

const { width } = Dimensions.get('window');

// Color palette
const PRIMARY = '#5ba24f';
const PRIMARY_GRADIENT: readonly [ColorValue, ColorValue] = ['#5ba24f', '#4a8c40'];
const YELLOW = '#fac609';
const YELLOW_GRADIENT = ['#fac609', '#e6b408'];
const ORANGE = '#e5793a';
const ORANGE_GRADIENT = ['#e5793a', '#d4692a'];
const BG = '#dcefdd';
const CARD_BG = '#ffffff';

// Reusable Card Component
const Card = ({ children, style, gradient, onPress }: any) => {
  const content = (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );

  if (gradient) {
    return (
      <LinearGradient colors={gradient as [ColorValue, ColorValue, ...ColorValue[]]} style={[styles.card, style]}>
        {children}
      </LinearGradient>
    );
  }

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} style={[styles.card, style]}>
        {children}
      </TouchableOpacity>
    );
  }

  return content;
};

// Custom Button Component
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

const LoginScreen = () => {
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth(); // Add this line to get the login function

  // Input validation function
  const validateInputs = () => {
    let valid = true;
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = 'Email is required';
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Enter a valid email address';
      valid = false;
    }

    if (!password) {
      newErrors.password = 'Password is required';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  // Submit credentials to the AuthContext (Firebase under the hood) and translate
  // Firebase error codes into user-friendly messages when something goes wrong.
  const handleLogin = async () => {
    if (!validateInputs()) return;
    
    // Clear any previous auth errors
    setAuthError('');
    
    try {
      setIsLoading(true);
      await login(email, password);
      // Navigation will be handled by the auth state change in _layout.tsx
    } catch (error) {
      console.log('Login error details:', JSON.stringify(error));
      
      // Get the error code from Firebase error
      // @ts-ignore
      const errorCode = error.code || '';
      // @ts-ignore
      const errorMessage = error.message || 'Failed to log in';
      
      // Handle specific Firebase auth error codes
      if (errorCode === 'auth/user-not-found' || 
          errorCode === 'auth/wrong-password' || 
          errorCode === 'auth/invalid-credential' ||
          errorCode === 'auth/invalid-email' ||
          errorMessage.includes('user-not-found') || 
          errorMessage.includes('wrong-password') || 
          errorMessage.includes('invalid-credential')) {
        setAuthError('Invalid email or password. Please try again.');
      } else {
        setAuthError(errorMessage || 'An error occurred during login.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Clear errors when user starts typing
  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: undefined }));
    }
    if (authError) setAuthError('');
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: undefined }));
    }
    if (authError) setAuthError('');
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
            <Text style={styles.header}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue to ClimateReady</Text>
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
            {/* Email field with inline validation */}
            <InputField
              label="Email"
              value={email}
              onChangeText={handleEmailChange}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
              required
              leftIcon={<Ionicons name="mail-outline" size={20} color="#9ca3af" />}
            />
            
            {/* Password entry */}
            <InputField
              label="Password"
              value={password}
              onChangeText={handlePasswordChange}
              placeholder="Enter your password"
              secureTextEntry
              error={errors.password}
              required
              leftIcon={<Ionicons name="lock-closed-outline" size={20} color="#9ca3af" />}
            />
            
            {/* Forgot Password */}
            <Animated.View 
              entering={FadeInUp.duration(600).delay(600)}
              style={styles.forgotPasswordContainer}
            >
              <Link href="/auth/forgot-password" asChild>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </Link>
            </Animated.View>
            
            {/* Login Button */}
            <Animated.View 
              entering={FadeInUp.duration(600).delay(800)}
              style={styles.buttonContainer}
            >
              <CustomButton
                title="Sign In"
                onPress={handleLogin}
                isLoading={isLoading}
                accessibilityLabel="Sign in to your account"
                accessibilityHint="Navigates to the home screen after successful authentication"
              />
            </Animated.View>
            
            {/* Sign Up Link */}
            <Animated.View 
              entering={FadeInUp.duration(600).delay(1000)}
              style={styles.signupContainer}
            >
              <Text style={styles.signupText}>Don't have an account? </Text>
              <Link href={'auth/register' as any} asChild>
                <Text style={styles.signupLink}>Create Account</Text>
              </Link>
            </Animated.View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;

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
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 24,
    width: '100%',
  },
  forgotPasswordText: {
    color: PRIMARY,
    fontSize: 14,
    fontWeight: '600',
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
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    fontSize: 14,
    color: '#6b7280',
  },
  signupLink: {
    color: PRIMARY,
    fontWeight: '600',
    fontSize: 14,
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
});
