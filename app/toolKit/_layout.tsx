// app/(tabs)/toolkit/_layout.tsx
import { Stack } from 'expo-router';

export default function ToolkitLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Preparedness Toolkit',
          headerShown: true 
        }} 
      />
      <Stack.Screen 
        name="household-setup" 
        options={{ 
          title: 'Household Setup',
          headerShown: true 
        }} 
      />
      <Stack.Screen 
        name="education" 
        options={{ 
          title: 'Educational Resources',
          headerShown: true 
        }} 
      />
      <Stack.Screen 
        name="achievements" 
        options={{ 
          title: 'Achievements',
          headerShown: true 
        }} 
      />
      <Stack.Screen 
        name="simulations" 
        options={{ 
          title: 'Disaster Simulations',
          headerShown: true 
        }} 
      />
    </Stack>
  );
}