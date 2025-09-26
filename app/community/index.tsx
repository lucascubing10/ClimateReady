import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

import { Api, Category } from '@/services/api';
import { CURRENT_USER } from '@/constants/user';

const filters: { label: string; value: Category }[] = [
  { label: 'All', value: 'all' },
  { label: 'General', value: 'general' },
  { label: 'Flood', value: 'flood' },
  { label: 'Heat Wave', value: 'heatwave' },
  { label: 'Earthquake', value: 'earthquake' },
];

export default function CommunityList() {
  const [items, setItems] = useState<any[]>([]);
  const [cat, setCat] = useState<Category>('all');
  const [mine, setMine] = useState(false);
  const [loading, setLoading] = useState(true);
  const r = useRouter();

  const load = async () => {
    setLoading(true);
    const data = await Api.listPosts(cat, mine, CURRENT_USER.id);
    setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [cat, mine]);

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Filters */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 12 }}>
        {filters.map((f) => (
          <Pressable
            key={f.value}
            onPress={() => setCat(f.value)}
            style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: cat === f.value ? '#0284c7' : '#e2e8f0' }}
          >
            <Text style={{ color: cat === f.value ? '#fff' : '#334155', fontWeight: '600' }}>{f.label}</Text>
          </Pressable>
        ))}

        <Pressable
          onPress={() => setMine(!mine)}
          style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: mine ? '#16a34a' : '#e2e8f0' }}
        >
          <Text style={{ color: mine ? '#fff' : '#334155', fontWeight: '600' }}>My Posts</Text>
        </Pressable>

        <Pressable
          onPress={() => r.push('/community/create' as any)}
          style={{ marginLeft: 'auto', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#0284c7' }}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>+ Post</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => it._id}
          contentContainerStyle={{ padding: 12, gap: 12 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => r.push({ pathname: '/community/post/[id]', params: { id: String(item._id) } } as any)}
              style={{ backgroundColor: '#fff', borderRadius: 16, padding: 14, gap: 6 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' }}>
                  <Text>{item.username?.[0]}</Text>
                </View>
                <Text style={{ fontWeight: '700', color: '#0f172a' }}>{item.username}</Text>
                <Text style={{ color: '#64748b' }}>• {dayjs(item.createdAt).fromNow?.() || ''}</Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Text style={{ fontSize: 12, backgroundColor: '#e2e8f0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, textTransform: 'capitalize' }}>
                  {item.category}
                </Text>

                {item.resolved && (
                  <Text style={{ fontSize: 12, backgroundColor: '#fee2e2', color: '#b91c1c', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                    RESOLVED
                  </Text>
                )}

                {item.status === 'pending' && (
                  <Text style={{ fontSize: 12, backgroundColor: '#fff7ed', color: '#c2410c', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                    PENDING REVIEW
                  </Text>
                )}
              </View>

              <Text style={{ color: '#334155' }}>{item.text}</Text>

              {item.imageUrl && (
                <View style={{ height: 160, backgroundColor: '#f1f5f9', borderRadius: 12, overflow: 'hidden', marginTop: 6 }}>
                  <Text style={{ position: 'absolute', right: 10, top: 10, fontSize: 12, backgroundColor: '#0ea5e9', color: '#fff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 }}>
                    photo
                  </Text>
                </View>
              )}

              <View style={{ flexDirection: 'row', gap: 16, marginTop: 8 }}>
                <Text>❤️ {item.upvotes}</Text>
                <Text>💬 {item.commentsCount}</Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}
