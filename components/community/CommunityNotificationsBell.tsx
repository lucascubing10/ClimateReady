import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Api } from '@/services/api';
import { useActiveUser } from '@/utils/activeUser';
import { useRouter } from 'expo-router';

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
        <Pressable onPress={closeModal} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', padding: 24, justifyContent: 'center' }}>
          <Pressable style={{ backgroundColor: '#fff', borderRadius: 20, maxHeight: '70%', paddingVertical: 12, paddingHorizontal: 14 }} onPress={() => {}}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', flex: 1 }}>Community Notifications</Text>
              {items.length > 0 && unread > 0 && (
                <Pressable onPress={markAll} style={{ paddingHorizontal: 10, paddingVertical: 4, backgroundColor: '#e2e8f0', borderRadius: 14 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600' }}>Mark all read</Text>
                </Pressable>
              )}
            </View>
            <View style={{ height: 1, backgroundColor: '#e2e8f0', marginBottom: 8 }} />
            {loading && <Text style={{ padding: 8 }}>Loading...</Text>}
            {!loading && items.length === 0 && (
              <Text style={{ padding: 12, color: '#64748b' }}>No notifications yet.</Text>
            )}
            <FlatList
              data={items}
              keyExtractor={(i) => i._id}
              renderItem={({ item }) => (
                <Pressable onPress={() => onPressItem(item)} style={{ paddingVertical: 10, borderBottomWidth: 1, borderColor: '#f1f5f9', flexDirection: 'row', gap: 8 }}>
                  <View style={{ width: 8, marginTop: 6 }}>
                    {!item.read && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#0284c7' }} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13 }}>
                      <Text style={{ fontWeight: '700' }}>{item.actorName || 'Someone'}</Text>
                      <Text> commented on your post</Text>
                    </Text>
                    {item.commentSnippet && (
                      <Text style={{ color: '#475569', fontSize: 12 }} numberOfLines={1}>{item.commentSnippet}</Text>
                    )}
                    {item.postSnippet && (
                      <Text style={{ color: '#94a3b8', fontSize: 11 }} numberOfLines={1}>Post: {item.postSnippet}</Text>
                    )}
                  </View>
                </Pressable>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
