import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, Pressable, FlatList, ActivityIndicator, Image } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

import { Api, Category } from '@/services/api';
import CommunityNotificationsBell from '@/components/community/CommunityNotificationsBell';
import { API_BASE } from '@/constants/env';
import { useActiveUser } from '@/utils/activeUser';
import { onPostCreated, onPostDeleted, onPostUpdated } from '@/utils/eventBus';
import { useLocalization } from '@/context/LocalizationContext';

type ChipProps = { label: string; active?: boolean; onPress?: () => void; activeColor?: string };
const FilterChip = ({ label, active, onPress, activeColor }: ChipProps) => (
  <Pressable
    onPress={onPress}
    style={{
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 24,
      backgroundColor: active ? (activeColor || '#0284c7') : '#e2e8f0',
      marginRight: 8,
      marginBottom: 8,
      minHeight: 36,
      justifyContent: 'center',
    }}
    hitSlop={6}
  >
    <Text
      style={{
        color: active ? '#fff' : '#334155',
        fontWeight: '600',
        fontSize: 13,
        letterSpacing: 0.2,
      }}
      // Avoid platform font autoscaling distorting short words (e.g. "General" clipped)
      allowFontScaling={false}
      numberOfLines={1}
    >
      {label}
    </Text>
  </Pressable>
);

export default function CommunityList() {
  const { id: activeUserId } = useActiveUser();
  const [items, setItems] = useState<any[]>([]);
  const [cat, setCat] = useState<Category>('all');
  const [mine, setMine] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const r = useRouter();
  const { t } = useLocalization();

  const filterOptions: { label: string; value: Category }[] = useMemo(
    () => [
      { label: t('community.filters.all'), value: 'all' },
      { label: t('community.filters.general'), value: 'general' },
      { label: t('community.filters.flood'), value: 'flood' },
      { label: t('community.filters.heatwave'), value: 'heatwave' },
      { label: t('community.filters.earthquake'), value: 'earthquake' },
    ],
    [t]
  );

  const categoryLabels = useMemo(
    () => ({
      general: t('community.filters.general'),
      flood: t('community.filters.flood'),
      heatwave: t('community.filters.heatwave'),
      earthquake: t('community.filters.earthquake'),
    }),
    [t]
  );

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
            maxHeight: 200,
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

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = !!opts?.silent;
    if (!silent) setLoading(true);
    setError(null);
    const data = await Api.listPosts(cat, mine, activeUserId || '');
    if (Array.isArray(data)) {
      setItems(data);
    } else {
      setError((data as any).error || t('community.errors.generic'));
    }
    if (!silent) setLoading(false);
  }, [activeUserId, cat, mine, t]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load({ silent: true });
    setRefreshing(false);
  };

  useEffect(() => {
    load();
  }, [load]);

  // Reload when coming back to this screen (focus) to reflect deletes/edits from detail
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // Optimistic create/update/delete sync using cross-platform event bus
  useEffect(() => {
    const unsubCreate = onPostCreated(newPost => {
      if (mine && activeUserId && String(newPost.userId) !== activeUserId) return;
      if (cat !== 'all' && newPost.category !== cat) return;
      setItems(prev => prev.find(p => p._id === newPost._id) ? prev : [newPost, ...prev]);
    });
    const unsubDelete = onPostDeleted(id => {
      setItems(prev => prev.filter(p => p._id !== id));
    });
    const unsubUpdate = onPostUpdated(updated => {
      setItems(prev => prev.map(p => p._id === updated._id ? { ...p, ...updated } : p));
    });
    return () => {
      unsubCreate();
      unsubDelete();
      unsubUpdate();
    };
  }, [activeUserId, cat, mine]);

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Filters */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', padding: 12, alignItems: 'center' }}>
        {filterOptions.map(f => (
          <FilterChip
            key={f.value}
            label={f.label}
            active={cat === f.value}
            onPress={() => setCat(f.value)}
          />
        ))}
        <FilterChip
          label={mine ? t('community.mineLabelActive') : t('community.mineLabel')}
          active={mine}
          onPress={() => setMine(!mine)}
          activeColor="#16a34a"
        />
        <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Pressable
            onPress={() => r.push('/community/create' as any)}
            style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, backgroundColor: '#0284c7' }}
            hitSlop={8}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }} allowFontScaling={false}>{t('community.createButton')}</Text>
          </Pressable>
          <CommunityNotificationsBell />
        </View>
      </View>

      {loading && (
        <ActivityIndicator style={{ marginTop: 20 }} />
      )}
      {!loading && error && (
        <View style={{ padding: 24, alignItems: 'center', gap: 12 }}>
          <Text style={{ color: '#b91c1c', fontWeight: '600' }}>{t('community.errors.title')}</Text>
          <Text style={{ color: '#64748b', fontSize: 12 }}>{error}</Text>
          <Pressable onPress={() => load()} style={{ backgroundColor: '#0284c7', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 }}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>{t('community.errors.retry')}</Text>
          </Pressable>
        </View>
      )}
      {!loading && !error && (
        <FlatList
          data={items}
          keyExtractor={(it) => it._id}
          contentContainerStyle={{ padding: 12, gap: 12 }}
          refreshing={refreshing}
          onRefresh={onRefresh}
          renderItem={({ item }) => (
            <View
              style={{
                backgroundColor: '#fff',
                borderRadius: 16,
                padding: 14,
                gap: 6,
                shadowColor: '#000',
                shadowOpacity: 0.08,
                shadowOffset: { width: 0, height: 4 },
                shadowRadius: 6,
                elevation: 2,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a', textTransform: 'uppercase', textAlign: 'center', width: '100%', lineHeight: 36 }}>
                      {item.username?.[0] || ''}
                    </Text>
                  </View>
                  <Text style={{ fontWeight: '700', color: '#0f172a', flexShrink: 1 }} numberOfLines={1}>
                    {item.username}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text style={{ color: '#64748b', fontSize: 12 }} allowFontScaling={false}>
                    {dayjs(item.createdAt).fromNow?.() || ''}
                  </Text>
                  <View style={{ backgroundColor: '#e2e8f0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 14, minWidth: 74, alignItems: 'center', marginTop: 1 }}>
                    <Text
                      style={{ fontSize: 12, fontWeight: '600', color: '#0f172a', textTransform: 'capitalize', letterSpacing: 0.2 }}
                      numberOfLines={1}
                      allowFontScaling={false}
                    >
                      {categoryLabels[item.category as keyof typeof categoryLabels] || item.category}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                {item.resolved && (
                  <Text style={{ fontSize: 12, backgroundColor: '#fee2e2', color: '#b91c1c', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                    {t('community.statuses.resolved')}
                  </Text>
                )}
                {mine && item.blocked && (
                  <View style={{ backgroundColor: '#fecaca', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, flexDirection: 'row', alignItems: 'center' }}>
                    <Text
                      style={{ fontSize: 12, color: '#991b1b', fontWeight: '600', letterSpacing: 0.4 }}
                      allowFontScaling={false}
                      numberOfLines={1}
                    >
                      {t('community.statuses.blocked')}
                    </Text>
                  </View>
                )}

                {item.status === 'pending' && (
                  <Text style={{ fontSize: 12, backgroundColor: '#fff7ed', color: '#c2410c', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                    {t('community.statuses.pending')}
                  </Text>
                )}
              </View>

              <Pressable onPress={() => r.push({ pathname: '/community/post/[id]', params: { id: String(item._id) } } as any)}>
                <Text style={{ color: '#334155' }}>{item.text}</Text>
              </Pressable>

              {item.imageUrl && (
                <PostImage uri={item.imageUrl.startsWith('http') ? item.imageUrl : `${API_BASE}${item.imageUrl}`} />
              )}

              <View style={{ flexDirection: 'row', gap: 24, marginTop: 8, alignItems: 'center' }}>
                <Pressable
                  disabled={!activeUserId}
                  onPress={async () => {
                    if (!activeUserId) return;
                    // optimistic toggle
                    setItems(prev => prev.map(p => {
                      if (p._id !== item._id) return p;
                      const liked = p.likedBy?.includes(activeUserId);
                      return {
                        ...p,
                        upvotes: (p.upvotes || 0) + (liked ? -1 : 1),
                        likedBy: liked ? p.likedBy.filter((u: string) => u !== activeUserId) : [...(p.likedBy || []), activeUserId]
                      };
                    }));
                    const res = await Api.upvote(item._id, activeUserId);
                    if (res?.post) {
                      setItems(prev => prev.map(p => p._id === item._id ? res.post : p));
                    }
                  }}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                >
                  <Text style={{ fontSize: 16 }}>
                    {activeUserId && item.likedBy?.includes(activeUserId) ? '💖' : '❤️'}
                  </Text>
                  <Text>{item.upvotes}</Text>
                </Pressable>
                <Pressable onPress={() => r.push({ pathname: '/community/post/[id]', params: { id: String(item._id) } } as any)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text>💬</Text>
                  <Text>{item.commentsCount}</Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}
