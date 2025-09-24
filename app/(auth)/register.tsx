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
import { UserProfile } from '../../utils/userDataModel';

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
  
  const { register } = useAuth();
  
  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };
  
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
  
  const handleRegister = async () => {
    if (!validateInputs()) return;
    
    try {
      setIsLoading(true);
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
      
      if (errorMessage.includes('email-already-in-use')) {
        Alert.alert('Registration Failed', 'This email is already in use.');
        setErrors(prev => ({ ...prev, email: 'Email already in use' }));
      } else {
        Alert.alert('Registration Error', errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Create Account' }} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/images/ClimateReadyV4.png')} 
              style={styles.logo} 
              resizeMode="contain"
            />
          </View>
          
          <Text style={styles.title}>Create Your Account</Text>
          <Text style={styles.subtitle}>Start your climate safety journey</Text>
          
          <View style={styles.formContainer}>
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
            
            <InputField
              label="Phone Number (Optional)"
              value={formData.phoneNumber}
              onChangeText={(text) => handleChange('phoneNumber', text)}
              placeholder="Phone number"
              keyboardType="phone-pad"
              error={errors.phoneNumber}
              leftIcon={<Ionicons name="call-outline" size={20} color="#9ca3af" />}
            />
            
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
            
            <View style={styles.disclaimerContainer}>
              <Text style={styles.disclaimerText}>
                By registering, you agree to ClimateReady's{' '}
                <Text style={styles.textLink}>Terms of Service</Text> and{' '}
                <Text style={styles.textLink}>Privacy Policy</Text>.
              </Text>
            </View>
            
            <Button
              title="Create Account"
              onPress={handleRegister}
              loading={isLoading}
              style={styles.registerButton}
            />
            
            <View style={styles.loginLinkContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <Link href={'/login' as any} asChild>
                <Text style={styles.link}>Sign In</Text>
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
    padding: 24,
    paddingTop: 12,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: width * 0.5,
    height: 80,
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
    marginBottom: 24,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: -8, // To counteract the marginBottom in the InputField
  },
  nameInput: {
    width: '48%',
  },
  disclaimerContainer: {
    marginVertical: 16,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  textLink: {
    color: '#0284c7',
    fontWeight: '500',
  },
  registerButton: {
    marginTop: 8,
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  loginText: {
    fontSize: 14,
    color: '#374151',
  },
  link: {
    color: '#0284c7',
    fontWeight: '500',
    fontSize: 14,
  }
});