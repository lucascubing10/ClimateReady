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
import { Stack, useRouter } from 'expo-router';
import { InputField } from '../../components/AuthComponents';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  FadeInUp, 
  ZoomIn 
} from 'react-native-reanimated';
import { ActivityIndicator } from 'react-native';

const { width } = Dimensions.get('window');

// Color palette matching the login page
const PRIMARY = '#5ba24f';
import type { ColorValue } from 'react-native';

const PRIMARY_GRADIENT: readonly [ColorValue, ColorValue] = ['#5ba24f', '#4a8c40'];
const YELLOW = '#fac609';
const ORANGE = '#e5793a';
const BG = '#dcefdd';
const CARD_BG = '#ffffff';

// Custom Button Component matching login page
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

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const router = useRouter();
  
  const { resetPassword } = useAuth();

  const handleCancel = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/auth/login');
  };
  
  const validateEmail = () => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    setError('');
    return true;
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (error) setError('');
  };
  
  const handleResetPassword = async () => {
    if (!validateEmail()) return;
    
    try {
      setIsLoading(true);
      await resetPassword(email);
      setResetSent(true);
    } catch (error) {
      // @ts-ignore
      const errorMessage = error.message || 'Failed to send reset email';
      
      if (errorMessage.includes('user-not-found')) {
        // For security reasons, don't tell the user that the email doesn't exist
        // Just show the success message anyway
        setResetSent(true);
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Forgot Password',
          headerLeft: () => (
            <TouchableOpacity style={styles.headerCancel} onPress={handleCancel}>
              <Ionicons name="close" size={20} color={PRIMARY} />
              <Text style={styles.headerCancelText}>Cancel</Text>
            </TouchableOpacity>
          ),
        }}
      />
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

          {resetSent ? (
            // Success state after reset email is sent
            <Animated.View 
              entering={FadeInUp.duration(600)}
              style={styles.formContainer}
            >
              <View style={styles.successContainer}>
                <Ionicons name="checkmark-circle-outline" size={64} color={PRIMARY} />
                <Text style={styles.header}>Email Sent</Text>
                <Text style={[styles.subtitle, { marginBottom: 32 }]}>
                  If an account exists for {email}, you'll receive a password reset link at this email address.
                </Text>
                <CustomButton
                  title="Back to Login"
                  onPress={() => router.push('/auth/login')}
                  style={styles.button}
                />
              </View>
            </Animated.View>
          ) : (
            // Default form state
            <Animated.View 
              entering={FadeInUp.duration(600).delay(200)}
              style={styles.formContainer}
            >
              {/* Header */}
              <Animated.View 
                entering={FadeInUp.duration(600).delay(400)}
                style={styles.headerContainer}
              >
                <Text style={styles.header}>Reset Password</Text>
                <Text style={styles.subtitle}>
                  Enter the email address associated with your account, and we'll send you a link to reset your password.
                </Text>
              </Animated.View>
              
              {/* Email Input */}
              <Animated.View 
                entering={FadeInUp.duration(600).delay(600)}
                style={styles.inputContainer}
              >
                <InputField
                  label="Email"
                  value={email}
                  onChangeText={handleEmailChange}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={error}
                  required
                  leftIcon={<Ionicons name="mail-outline" size={20} color="#9ca3af" />}
                />
              </Animated.View>
              
              {/* Reset Button */}
              <Animated.View 
                entering={FadeInUp.duration(600).delay(800)}
                style={styles.buttonContainer}
              >
                <CustomButton
                  title="Send Reset Link"
                  onPress={handleResetPassword}
                  isLoading={isLoading}
                  accessibilityLabel="Send password reset email"
                  accessibilityHint="Sends a password reset link to your email address"
                />
              </Animated.View>
              
              {/* Back to Login Link */}
              <Animated.View 
                entering={FadeInUp.duration(600).delay(1000)}
                style={styles.backLinkContainer}
              >
                <TouchableOpacity style={styles.backLink} onPress={handleCancel}>
                  <Ionicons name="close" size={16} color={PRIMARY} />
                  <Text style={styles.backLinkText}>Cancel</Text>
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>
          )}
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
  formContainer: {
    zIndex: 1,
    alignItems: 'center',
    width: '100%',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
    width: '100%',
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
    lineHeight: 22,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 24,
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
  backLinkContainer: {
    alignItems: 'center',
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  backLinkText: {
    color: PRIMARY,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 4,
  },
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    width: '100%',
  },
  linkButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    padding: 8,
  },
  linkText: {
    color: PRIMARY,
    fontSize: 16,
    fontWeight: '500',
  },
  headerCancel: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  headerCancelText: {
    marginLeft: 6,
    color: PRIMARY,
    fontSize: 16,
    fontWeight: '600',
  },
});