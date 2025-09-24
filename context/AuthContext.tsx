import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  signOut,
  User,
  updateProfile
} from 'firebase/auth';
import { auth, createUserDocument, getUserDocument, updateUserDocument } from '../firebaseConfig';
import { UserProfile, createEmptyUserProfile } from '../utils/userDataModel';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  reloadUserProfile: () => Promise<boolean>;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Handle auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setIsLoggedIn(!!firebaseUser);

      if (firebaseUser) {
        try {
          // Get user profile from Firestore
          const docSnapshot = await getUserDocument(firebaseUser.uid);
          if (docSnapshot.exists()) {
            setUserProfile(docSnapshot.data() as UserProfile);
          } else {
            // If the user exists in authentication but not in Firestore,
            // create a minimal profile to prevent indefinite loading
            console.warn('User exists in Auth but not in Firestore. Creating minimal profile.');
            const minimalProfile = createEmptyUserProfile(
              firebaseUser.email || '', 
              firebaseUser.displayName?.split(' ')[0] || 'User', 
              firebaseUser.displayName?.split(' ').slice(1).join(' ') || ''
            );
            await createUserDocument(firebaseUser.uid, minimalProfile);
            setUserProfile(minimalProfile);
          }
          
          // Store authentication state in AsyncStorage
          await AsyncStorage.setItem('user_authenticated', 'true');
        } catch (error) {
          console.error('Error fetching user profile:', error);
          // Set a minimal profile to prevent indefinite loading
          const fallbackProfile = createEmptyUserProfile(
            firebaseUser.email || '', 
            firebaseUser.displayName?.split(' ')[0] || 'User', 
            firebaseUser.displayName?.split(' ').slice(1).join(' ') || ''
          );
          setUserProfile(fallbackProfile);
        }
      } else {
        // Clear user profile when logged out
        setUserProfile(null);
        await AsyncStorage.removeItem('user_authenticated');
      }

      setIsLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  // Register a new user
  const register = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      setIsLoading(true);
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Set display name in Firebase Auth
      await updateProfile(firebaseUser, {
        displayName: `${firstName} ${lastName}`
      });

      // Create user profile in Firestore
      const userProfile = createEmptyUserProfile(email, firstName, lastName);
      await createUserDocument(firebaseUser.uid, userProfile);
      
      // Set the user profile in the context state
      setUserProfile(userProfile);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Login user
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Get user profile from Firestore
      const docSnapshot = await getUserDocument(userCredential.user.uid);
      if (docSnapshot.exists()) {
        setUserProfile(docSnapshot.data() as UserProfile);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Format Firebase error with code and message for better handling
      const formattedError = {
        code: error.code || 'unknown-error',
        message: error.message || 'An unknown error occurred during login',
        originalError: error
      };
      
      throw formattedError;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout user
  const logout = async () => {
    try {
      setIsLoading(true);
      await signOut(auth);
      setUserProfile(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Send password reset email
  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  };

  // Update user profile
  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!user) throw new Error('No authenticated user');
    try {
      setIsLoading(true);
      
      // Update Firestore
      const userDocRef = getUserDocument(user.uid);
      await updateUserDocument(user.uid, {
        ...data,
        updatedAt: Date.now()
      });
      
      // Update local state
      setUserProfile(prevProfile => 
        prevProfile ? { ...prevProfile, ...data, updatedAt: Date.now() } : null
      );
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Method to reload the user profile from Firestore
  const reloadUserProfile = async () => {
    if (!user) throw new Error('No authenticated user');
    try {
      setIsLoading(true);
      
      // Get fresh user profile from Firestore
      const docSnapshot = await getUserDocument(user.uid);
      if (docSnapshot.exists()) {
        setUserProfile(docSnapshot.data() as UserProfile);
      } else {
        // If the profile doesn't exist in Firestore, create a minimal one
        const minimalProfile = createEmptyUserProfile(
          user.email || '', 
          user.displayName?.split(' ')[0] || 'User', 
          user.displayName?.split(' ').slice(1).join(' ') || ''
        );
        await createUserDocument(user.uid, minimalProfile);
        setUserProfile(minimalProfile);
      }
      
      return true;
    } catch (error) {
      console.error('Error reloading user profile:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    userProfile,
    isLoading,
    login,
    register,
    logout,
    resetPassword,
    updateUserProfile,
    reloadUserProfile,
    isLoggedIn,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}