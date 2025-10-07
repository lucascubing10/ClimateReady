// app/(tabs)/toolkit/_layout.tsx
import { Stack } from 'expo-router';

export default function ToolkitLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Preparedness Toolkit',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="household-setup" 
        options={{ 
          title: 'Household Setup',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="education" 
        options={{ 
          title: 'Educational Resources',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="achievements" 
        options={{ 
          title: 'Achievements',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="simulations" 
        options={{ 
          title: 'Disaster Simulations',
          headerShown: false 
        }} 
      />
    </Stack>
  );
}