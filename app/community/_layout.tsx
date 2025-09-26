import { Tabs } from 'expo-router';

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
        options={{ title: 'Community' }}
      />

      {/* Real-time chat */}
      <Tabs.Screen
        name="chat"
        options={{ title: 'Live Chat' }}
      />

      {/* Create new post */}
      <Tabs.Screen
        name="create"
        options={{ title: 'Post' }}
      />

      {/* Post detail (hidden from tabs, but accessible via navigation) */}
      <Tabs.Screen
        name="post/[id]"
        options={{ href: null }}
      />
    </Tabs>
  );
}
