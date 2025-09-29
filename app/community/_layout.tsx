import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function CommunityLayout() {
  return (
    <Tabs
      screenOptions={{
        headerTitle: 'Community',
        tabBarActiveTintColor: '#0284c7',
      }}
    >
      {/* Forum list */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Community',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" color={color} size={size ?? 22} />
          ),
        }}
      />

      {/* Real-time chat */}
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Live Chat',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" color={color} size={size ?? 22} />
          ),
        }}
      />

      {/* Create new post */}
      <Tabs.Screen
        name="create"
        options={{
          title: 'Post',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="create" color={color} size={size ?? 22} />
          ),
        }}
      />

      {/* Post detail (hidden from tabs, but accessible via navigation) */}
      <Tabs.Screen
        name="post/[id]"
        options={{ href: null }}
      />
    </Tabs>
  );
}
