import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function TabsLayout() {

  return (
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
    </Tabs>
  );
}




// import { Ionicons } from '@expo/vector-icons';
// import { Tabs } from 'expo-router';

// export default function RootLayout() {
//   return (
//     <Tabs
//       screenOptions={{
//         tabBarActiveTintColor: '#0284c7',
//         tabBarStyle: { borderTopLeftRadius: 18, borderTopRightRadius: 18, height: 62, paddingBottom: 8 },
//         headerShown: false,
//       }}
//     >
//       <Tabs.Screen
//         name="index"
//         options={{
//           title: 'Home',
//           tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size ?? 24} />,
//         }}
//       />
//       <Tabs.Screen
//         name="toolKit"
//         options={{
//           title: 'Toolkit',
//           tabBarIcon: ({ color, size }) => <Ionicons name="construct" color={color} size={size ?? 24} />,
//         }}
//       />
//     </Tabs>
//   );
// }
