import React, { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import ProfileCompletionReminder from '../../components/ProfileCompletionReminder';
import { checkActiveSOSSession } from '../../utils/sos/sosService';

export default function TabsLayout() {
  const router = useRouter();
  // Check if SOS is active
  const [isSOSActive, setIsSOSActive] = useState(false);
  
  useEffect(() => {
    const checkSOS = async () => {
      const activeSession = await checkActiveSOSSession();
      setIsSOSActive(!!activeSession);
    };
    
    checkSOS();
    // Check every 10 seconds for changes in SOS status
    const interval = setInterval(checkSOS, 10000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#0284c7',
          tabBarStyle: { borderTopLeftRadius: 18, borderTopRightRadius: 18, height: 62, paddingBottom: 8 },
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            headerShown: false,
            tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size ?? 24} />,
          }}
        />
        <Tabs.Screen
          name="sos"
          options={{
            title: 'SOS',
            tabBarButton: () => (
              <TouchableOpacity
                style={[
                  styles.sosButton,
                  isSOSActive ? styles.sosActive : {}
                ]}
                onPress={() => {
                  if (isSOSActive) {
                    router.push('/tabs/sos');
                  } else {
                    router.push('/tabs/sos');
                  }
                }}
              >
                <View style={styles.sosIconContainer}>
                  <Ionicons
                    name={isSOSActive ? "alert-circle" : "alert-circle-outline"}
                    size={30}
                    color={isSOSActive ? "#fff" : "#fff"}
                  />
                </View>
              </TouchableOpacity>
            ),
          }}
        />
        <Tabs.Screen
          name="toolKit"
          options={{
            title: 'Toolkit',
            headerShown: false,
            tabBarIcon: ({ color, size }) => <Ionicons name="construct" color={color} size={size ?? 24} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            headerShown: false,
            tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size ?? 24} />,
          }}
        />
        <Tabs.Screen
          name="edit-profile"
          options={{
            href: null, // Hide this tab from the bottom tab bar
          }}
        />
        <Tabs.Screen
          name="profile-edit"
          options={{
            href: null, // Hide this tab and its children from the bottom tab bar
          }}
        />
        <Tabs.Screen
          name="sos-settings"
          options={{
            href: null, // Hide this tab from the bottom tab bar
          }}
        />
      </Tabs>
      
      {/* Show profile completion reminder when needed */}
      <ProfileCompletionReminder />
    </>
  );
}

const styles = StyleSheet.create({
  sosButton: {
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#dc2626', // Red color for emergency
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sosActive: {
    transform: [{ scale: 1.1 }],
  },
});