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
import { Link } from 'expo-router';
import { InputField, Button } from '../../components/AuthComponents';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

// Screen: handles credential-based login for ClimateReady responders/citizens.
export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  
  // Validate both fields before attempting Firebase auth so we can
  // surface friendly inline errors instead of backend error codes.
  const validateInputs = () => {
    let isValid = true;
    const newErrors = { email: '', password: '' };
    
    if (!email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
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
  
  // Using Link component instead
  
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
          {/* Logo and hero copy */}
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/images/ClimateReadyV4.png')} 
              style={{...styles.logo, resizeMode: 'contain'}} 
            />
          </View>
          
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue to ClimateReady</Text>
          
          {authError ? (
            // Global auth error banner for invalid credentials / service issues
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{authError}</Text>
            </View>
          ) : null}
          
          <View style={styles.formContainer}>
            {/* Email field with inline validation */}
            <InputField
              label="Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (authError) setAuthError('');
              }}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
              required
              leftIcon={<Ionicons name="mail-outline" size={20} color="#9ca3af" />}
            />
            
            {/* Password entry; we intentionally keep the field simple */}
            <InputField
              label="Password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (authError) setAuthError('');
              }}
              placeholder="Enter your password"
              secureTextEntry
              error={errors.password}
              required
              leftIcon={<Ionicons name="lock-closed-outline" size={20} color="#9ca3af" />}
            />
            
            <TouchableOpacity style={styles.forgotPassword}>
              <Link href={'auth/forgot-password' as any} asChild>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </Link>
            </TouchableOpacity>
            
            {/* Primary auth CTA */}
            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={isLoading}
              style={styles.loginButton}
            />
            
            {/* Secondary navigation to registration */}
            <View style={{flexDirection: 'row', justifyContent: 'center', marginTop: 16}}>
              <Text style={styles.noAccountText}>Don't have an account? </Text>
              <Link href={'auth/register' as any} asChild>
                <Text style={{color: '#0284c7', fontWeight: '500', fontSize: 14}}>Create Account</Text>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: width * 0.6,
    height: 100,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#6b7280',
    marginBottom: 32,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  forgotPasswordText: {
    color: '#0284c7',
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    marginTop: 8,
  },
  noAccountText: {
    textAlign: 'center',
    marginTop: 8,
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    width: '100%',
    maxWidth: 400,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});