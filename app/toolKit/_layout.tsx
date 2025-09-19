import { Stack } from 'expo-router';

export default function ToolkitLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{
          title: 'Preparedness Toolkit',
          headerShown: false,
        }} 
      />
    </Stack>
  );
}