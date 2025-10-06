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
import { Stack, Link } from 'expo-router';
import { InputField, Button } from '../../components/AuthComponents';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

// Screen: allows a user to request a password reset email for their account.
export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  
  const { resetPassword } = useAuth();
  
  // Basic client-side validation to prevent unnecessary backend calls
  // and give users immediate feedback on formatting mistakes.
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
  
  // Trigger Firebase Auth reset flow and switch the UI to the success state
  // even if the email does not exist to avoid leaking account existence.
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
      <Stack.Screen options={{ title: 'Forgot Password' }} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand header */}
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/images/ClimateReadyV4.png')} 
              style={{...styles.logo, resizeMode: 'contain'}} 
            />
          </View>
          
          {resetSent ? (
            // Confirmation state after the reset email was dispatched
            <View style={styles.successContainer}>
              <Ionicons name="checkmark-circle-outline" size={64} color="#5ba24f" />
              <Text style={styles.title}>Email Sent</Text>
              <Text style={styles.subtitle}>
                If an account exists for {email}, you'll receive a password reset link at this email address.
              </Text>
              {/* Keep the primary CTA for layout consistency, but steer users to Link below */}
              <Button
                title="Back to Login"
                onPress={() => {}} // Will use Link instead
                style={styles.button}
              />
              <Link href={'/login' as any} asChild>
                <TouchableOpacity style={styles.linkButton}>
                  <Text style={styles.linkText}>Back to Login</Text>
                </TouchableOpacity>
              </Link>
            </View>
          ) : (
            // Default form shown before the reset email is sent
            <View style={styles.formContainer}>
              <Text style={styles.title}>Forgot Password</Text>
              <Text style={styles.subtitle}>
                Enter the email address associated with your account, and we'll send you a link to reset your password.
              </Text>
              
              <InputField
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                error={error}
                required
                leftIcon={<Ionicons name="mail-outline" size={20} color="#9ca3af" />}
              />
              
              <Button
                title="Send Reset Link"
                onPress={handleResetPassword}
                loading={isLoading}
                style={styles.button}
              />
              
              <Link href={'/login' as any} asChild>
                <TouchableOpacity style={styles.backLink}>
                  <Ionicons name="arrow-back" size={16} color="#0284c7" />
                  <Text style={styles.backLinkText}>Back to Login</Text>
                </TouchableOpacity>
              </Link>
            </View>
          )}
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
    width: width * 0.5,
    height: 80,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    marginTop: 16,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  backLinkText: {
    color: '#0284c7',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 4,
  },
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  linkButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    padding: 8,
  },
  linkText: {
    color: '#0284c7',
    fontSize: 16,
    fontWeight: '500',
  }
});