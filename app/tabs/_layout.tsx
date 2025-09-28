import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import ProfileCompletionReminder from '../../components/ProfileCompletionReminder';

export default function TabsLayout() {
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
      </Tabs>
      
      {/* Show profile completion reminder when needed */}
      <ProfileCompletionReminder />
    </>
  );
}