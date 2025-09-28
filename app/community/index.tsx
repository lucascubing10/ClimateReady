import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Pressable, FlatList, ActivityIndicator, Image } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

import { Api, Category } from '@/services/api';
import { API_BASE } from '@/constants/env';
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
  const [error, setError] = useState<string | null>(null);
  const r = useRouter();
// Component that displays a smaller, fully visible image without aggressive cropping
function PostImage({ uri }: { uri: string }) {
  const [ratio, setRatio] = useState<number | null>(null); // width/height
  return (
    <View
      style={{
        backgroundColor: '#f1f5f9',
        borderRadius: 12,
        marginTop: 6,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 4,
      }}
    >
      <Image
        source={{ uri }}
        style={{
          width: '100%',
          aspectRatio: ratio || 1.6, // placeholder aspect ratio until real one loads
          maxHeight: 160,
        }}
        resizeMode="contain"
        onLoad={(e) => {
          const meta: any = e.nativeEvent?.source;
          if (meta?.width && meta?.height) {
            const r = meta.width / meta.height;
            // Clamp ratio to avoid extreme tall images stretching layout
            if (r > 0) setRatio(Math.min(Math.max(r, 0.6), 2.5));
          }
        }}
      />
    </View>
  );
}

  const load = async () => {
    setLoading(true);
    setError(null);
    const data = await Api.listPosts(cat, mine, CURRENT_USER.id);
    if (Array.isArray(data)) {
      setItems(data);
    } else {
      setError(data.error || 'Failed to load');
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [cat, mine]);

  // Reload when coming back to this screen (focus) to reflect deletes/edits from detail
  useFocusEffect(
    useCallback(() => {
      load();
    }, [cat, mine])
  );

  // Optimistic create/update/delete sync via custom events
  useEffect(() => {
    const onDeleted = (e: any) => {
      const deletedId = e?.detail?.id; if (!deletedId) return;
      setItems(prev => prev.filter(p => p._id !== deletedId));
    };
    const onCreated = (e: any) => {
      const newPost = e?.detail?.post; if (!newPost) return;
      if (mine && String(newPost.userId) !== CURRENT_USER.id) return;
      if (cat !== 'all' && newPost.category !== cat) return;
      setItems(prev => prev.find(p => p._id === newPost._id) ? prev : [newPost, ...prev]);
    };
    const onUpdated = (e: any) => {
      const updated = e?.detail?.post; if (!updated) return;
      setItems(prev => prev.map(p => p._id === updated._id ? { ...p, ...updated } : p));
    };
    window.addEventListener('cr_post_deleted', onDeleted as any);
    window.addEventListener('cr_post_created', onCreated as any);
    window.addEventListener('cr_post_updated', onUpdated as any);
    return () => {
      window.removeEventListener('cr_post_deleted', onDeleted as any);
      window.removeEventListener('cr_post_created', onCreated as any);
      window.removeEventListener('cr_post_updated', onUpdated as any);
    };
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

      {loading && (
        <ActivityIndicator style={{ marginTop: 20 }} />
      )}
      {!loading && error && (
        <View style={{ padding: 24, alignItems: 'center', gap: 12 }}>
          <Text style={{ color: '#b91c1c', fontWeight: '600' }}>Failed to fetch posts</Text>
          <Text style={{ color: '#64748b', fontSize: 12 }}>{error}</Text>
          <Pressable onPress={load} style={{ backgroundColor: '#0284c7', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 }}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>Retry</Text>
          </Pressable>
        </View>
      )}
      {!loading && !error && (
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
                {mine && item.blocked && (
                  <Text style={{ fontSize: 12, backgroundColor: '#fecaca', color: '#991b1b', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                    BLOCKED
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
                  <PostImage uri={item.imageUrl.startsWith('http') ? item.imageUrl : `${API_BASE}${item.imageUrl}`} />
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
