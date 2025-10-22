import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Modal, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Api } from '@/services/api';
import { useActiveUser } from '@/utils/activeUser';
import { useRouter } from 'expo-router';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

interface CommunityNotification {
  _id: string;
  userId: string;
  actorId: string;
  actorName?: string;
  postId: string;
  commentId: string;
  postSnippet?: string;
  commentSnippet?: string;
  read: boolean;
  createdAt: string;
}

export default function CommunityNotificationsBell() {
  const { id: userId } = useActiveUser();
  const [items, setItems] = useState<CommunityNotification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const r = useRouter();

  const load = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await Api.listCommunityNotifications(userId, false);
      if (Array.isArray(data)) setItems(data);
    } finally {
      setLoading(false);
    }
  };

  // Poll every 30s while bell closed
  useEffect(() => {
    load();
    const id = setInterval(() => { if (!open) load(); }, 30000);
    return () => clearInterval(id);
  }, [userId, open]);

  const unread = items.filter(i => !i.read).length;

  const openModal = () => { setOpen(true); };
  const closeModal = () => { setOpen(false); };

  const markAll = async () => {
    if (!userId) return;
    await Api.markAllCommunityNotificationsRead(userId);
    setItems(prev => prev.map(p => ({ ...p, read: true })));
  };

  const onPressItem = async (n: CommunityNotification) => {
    setItems(prev => prev.map(p => p._id === n._id ? { ...p, read: true } : p));
    Api.markCommunityNotificationRead(n._id); // fire & forget
    closeModal();
    // Navigate to the post
    r.push(`/community/post/${n.postId}` as any);
  };

  return (
    <>
      <Pressable
        onPress={openModal}
        style={{
          padding: 8,
          marginRight: 8,
          backgroundColor: '#e0f2fe',
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="notifications" size={22} color="#0284c7" />
        {unread > 0 && (
          <View style={{ position: 'absolute', top: 2, right: 2, backgroundColor: '#dc2626', minWidth: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 }}>
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{unread}</Text>
          </View>
        )}
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={closeModal}>
        <Pressable onPress={closeModal} style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', padding: 24, justifyContent: 'center' }}>
          <Pressable
            style={{
              backgroundColor: '#fff',
              borderRadius: 24,
              paddingVertical: 16,
              paddingHorizontal: 18,
              maxHeight: '72%',
              width: '100%',
              maxWidth: 420,
              alignSelf: 'center',
              shadowColor: '#0f172a',
              shadowOpacity: 0.15,
              shadowOffset: { width: 0, height: 12 },
              shadowRadius: 24,
              elevation: 12,
            }}
            onPress={() => null}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 }}>
              <View style={{ backgroundColor: '#e0f2fe', padding: 10, borderRadius: 18 }}>
                <Ionicons name="notifications" size={20} color="#0284c7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#0f172a' }}>Community Notifications</Text>
                <Text style={{ fontSize: 12, color: '#64748b' }}>{unread > 0 ? `${unread} new update${unread > 1 ? 's' : ''}` : 'Stay informed about your community posts.'}</Text>
              </View>
              <Pressable onPress={closeModal} style={{ padding: 6 }} hitSlop={8}>
                <Ionicons name="close" size={20} color="#475569" />
              </Pressable>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: '#e2e8f0' }} />
              {items.length > 0 && unread > 0 && (
                <Pressable
                  onPress={markAll}
                  style={{ marginLeft: 12, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#0284c7', borderRadius: 16 }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#fff' }}>Mark all read</Text>
                </Pressable>
              )}
            </View>

            {loading && (
              <View style={{ paddingVertical: 20, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color="#0284c7" />
                <Text style={{ marginTop: 8, fontSize: 12, color: '#64748b' }}>Fetching updates…</Text>
              </View>
            )}

            {!loading && items.length === 0 && (
              <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 32, gap: 8 }}>
                <View style={{ backgroundColor: '#f1f5f9', borderRadius: 32, padding: 16 }}>
                  <Ionicons name="notifications-off" size={28} color="#94a3b8" />
                </View>
                <Text style={{ fontWeight: '600', color: '#0f172a' }}>You are all caught up</Text>
                <Text style={{ fontSize: 12, color: '#64748b', textAlign: 'center', paddingHorizontal: 16 }}>
                  New replies to your posts will appear here.
                </Text>
              </View>
            )}

            {!loading && items.length > 0 && (
              <FlatList
                data={items}
                keyExtractor={(i) => i._id}
                contentContainerStyle={{ paddingVertical: 4, gap: 8 }}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                  const timestamp = dayjs(item.createdAt).fromNow?.() || dayjs(item.createdAt).format('MMM D, HH:mm');
                  const unreadHighlight = !item.read;
                  return (
                    <Pressable
                      onPress={() => onPressItem(item)}
                      style={{
                        flexDirection: 'row',
                        gap: 12,
                        padding: 12,
                        borderRadius: 18,
                        backgroundColor: unreadHighlight ? '#e0f2fe' : '#f8fafc',
                        borderWidth: 1,
                        borderColor: unreadHighlight ? '#bae6fd' : '#e2e8f0',
                      }}
                    >
                      <View style={{ width: 8, alignItems: 'center', paddingTop: 4 }}>
                        {unreadHighlight && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#0284c7' }} />}
                      </View>
                      <View style={{ flex: 1, gap: 4 }}>
                        <Text style={{ fontSize: 13, color: '#0f172a' }}>
                          <Text style={{ fontWeight: '700' }}>{item.actorName || 'Someone'}</Text>
                          <Text>{' commented on your post'}</Text>
                        </Text>
                        {item.commentSnippet && (
                          <Text style={{ color: '#475569', fontSize: 12 }} numberOfLines={2}>
                            “{item.commentSnippet}”
                          </Text>
                        )}
                        {item.postSnippet && (
                          <Text style={{ color: '#94a3b8', fontSize: 11 }} numberOfLines={1}>
                            Post: {item.postSnippet}
                          </Text>
                        )}
                        <Text style={{ fontSize: 11, color: '#94a3b8' }}>{timestamp}</Text>
                      </View>
                    </Pressable>
                  );
                }}
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
