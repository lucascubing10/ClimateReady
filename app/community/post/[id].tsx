import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert, Image, Modal, Platform, ScrollView, RefreshControl } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Api } from '@/services/api';
import { API_BASE } from '@/constants/env';
import { useActiveUser } from '@/utils/activeUser';
import { emitPostUpdated, emitPostDeleted } from '@/utils/eventBus';

export default function PostDetail() {
  const { id: activeUserId, username: activeUsername } = useActiveUser();
  const { id } = useLocalSearchParams();
  const r = useRouter();

  const [data, setData] = useState<any>(null);
  const [comment, setComment] = useState('');
  const [showFull, setShowFull] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [editCategory, setEditCategory] = useState<string>('general');
  const [newImage, setNewImage] = useState<any>(null);
  const [imgRatio, setImgRatio] = useState<number | null>(null); // width/height
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false); // editing save progress
  const [sendingComment, setSendingComment] = useState(false); // comment send progress
  const [refreshing, setRefreshing] = useState(false);
  const commentsPollRef = useRef<any>(null);
  const requestSeq = useRef(0); // guards against race conditions when rapidly switching posts

  const resetStateForNewPost = () => {
    setData(null);
    setComment('');
    setShowFull(false);
    setEditing(false);
    setEditText('');
    setEditCategory('general');
    setNewImage(null);
    setImgRatio(null);
    setDeleting(false);
  };

  const load = async () => {
    if (!id) return;
    const seq = ++requestSeq.current;
    try {
      const result = await Api.getPost(String(id));
      // If another request started after this one, ignore this response
      if (seq !== requestSeq.current) return;
      setData(result);
      if (result?.post) {
        setEditText(result.post.text);
        setEditCategory(result.post.category);
      }
      // If we navigated here from a notification there is a small chance the comment write
      // replicated after our first read (especially with Atlas clusters). Perform a single
      // quick refetch 600ms later if there are zero comments but the notification implied one.
      if (result?.post && Array.isArray(result?.comments) && result.comments.length === 0) {
        setTimeout(async () => {
          if (requestSeq.current !== seq) return; // user navigated away or another load triggered
          try {
            const again = await Api.getPost(String(id));
            if (requestSeq.current === seq && again?.comments?.length) {
              setData(again);
            }
          } catch { }
        }, 600);
      }
    } catch (e) {
      if (seq === requestSeq.current) {
        setData({ post: null, error: true });
      }
    }
  };

  useEffect(() => {
    // When the id changes we immediately clear old content so previous post doesn't flash
    resetStateForNewPost();
    load();
    // start polling comments every 10s (mobile only to mitigate multi-device sync lag)
    if (commentsPollRef.current) clearInterval(commentsPollRef.current);
    commentsPollRef.current = setInterval(async () => {
      if (!id) return;
      try {
        const currentPostId = String(id);
        const res = await Api.getPostComments(currentPostId);
        if (res?.comments && Array.isArray(res.comments)) {
          setData((d: any) => d && d.post ? { ...d, comments: res.comments } : d);
        }
      } catch { }
    }, 10000);
    return () => { if (commentsPollRef.current) clearInterval(commentsPollRef.current); };
  }, [id]);

  if (!data || !data.post) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
        <ActivityIndicator />
      </View>
    );
  }

  const { post, comments = [] } = data;

  const isOwner = !!activeUserId && String(post?.userId || '') === activeUserId;

  const pickReplacement = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7, base64: true });
    if (!res.canceled) {
      const a = res.assets[0];
      setNewImage({ uri: a.uri, name: a.fileName || 'replace.jpg', type: a.mimeType || 'image/jpeg', base64: a.base64 });
    }
  };

  const saveEdit = async () => {
    if (saving) return; // guard against double tap
    try {
      setSaving(true);
      if (!activeUserId) return Alert.alert('You must be logged in.');
      const result = await Api.updatePost(post._id, { userId: activeUserId, text: editText, category: editCategory }, newImage);
      if (result?.moderation) {
        Alert.alert('Moderation', result.moderation.reason || 'Reviewed');
      }
      setNewImage(null);
      if (result?.post) {
        setData((d: any) => {
          if (!d) return { post: result.post, comments: [] };
          return { ...d, post: result.post };
        });
        emitPostUpdated(result.post);
        setEditing(false);
      } else {
        // fallback refresh
        load();
        setEditing(false);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const performDelete = async () => {
    try {
      setDeleting(true);
      console.log('[UI] performDelete -> calling Api.deletePost');
      if (!activeUserId) return Alert.alert('Not authorized');
      const res = await Api.deletePost(post._id, activeUserId);
      console.log('[UI] delete result', res);
      if (res?.ok) {
        emitPostDeleted(post._id);
        if (Platform.OS === 'web') {
          alert('Post deleted');
        } else {
          Alert.alert('Post deleted');
        }
        r.back();
      } else {
        const msg = res?.error || 'Failed to delete';
        if (Platform.OS === 'web') alert(msg); else Alert.alert('Error', msg);
      }
    } catch (e: any) {
      console.warn('[UI] delete exception', e.message);
      if (Platform.OS === 'web') alert('Delete error: ' + e.message); else Alert.alert('Error', 'Delete error');
    } finally {
      setDeleting(false);
    }
  };

  const deletePost = () => {
    console.log('[UI] Delete button pressed (will confirm)');
    if (Platform.OS === 'web') {
      const ok = window.confirm('Delete this post permanently?');
      if (ok) performDelete();
      return;
    }
    Alert.alert(
      'Delete Post',
      'Are you sure you want to permanently delete this post? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: performDelete },
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc' }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      {/* Post card */}
      <View style={{ backgroundColor: '#fff', margin: 12, padding: 14, borderRadius: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontWeight: '700', fontSize: 16, flex: 1 }}>{post.username}</Text>
          {isOwner && !editing && (
            <Pressable onPress={() => setEditing(true)} style={{ paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ color: '#0284c7', fontWeight: '600' }}>Edit</Text>
            </Pressable>
          )}
          {isOwner && editing && (
            <Pressable onPress={() => { setEditing(false); setNewImage(null); setEditText(post.text); setEditCategory(post.category); }} style={{ paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ color: '#b91c1c', fontWeight: '600' }}>Cancel</Text>
            </Pressable>
          )}
        </View>

        {editing ? (
          <>
            <TextInput
              value={editText}
              onChangeText={setEditText}
              multiline
              style={{ backgroundColor: '#f1f5f9', borderRadius: 12, padding: 10, minHeight: 100, marginTop: 8 }}
            />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, marginBottom: 10 }}>
              {['general', 'flood', 'heatwave', 'earthquake'].map(c => {
                const active = editCategory === c;
                const label = c === 'heatwave' ? 'Heat Wave' : c.charAt(0).toUpperCase() + c.slice(1);
                return (
                  <Pressable
                    key={c}
                    onPress={() => setEditCategory(c)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 18,
                      backgroundColor: active ? '#0284c7' : '#e2e8f0',
                      marginRight: 8,
                      marginBottom: 8,
                    }}
                  >
                    <Text style={{ color: active ? '#fff' : '#334155', fontSize: 12, fontWeight: '600', letterSpacing: 0.3 }} allowFontScaling={false}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <Pressable
                onPress={pickReplacement}
                style={{
                  backgroundColor: newImage ? '#c7d2fe' : '#dbeafe',
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 24,
                  shadowColor: '#000',
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  shadowOffset: { width: 0, height: 1 },
                }}
              >
                <Text style={{ fontWeight: '600', color: '#0369a1' }}>{newImage ? 'Change Image' : 'Replace Image'}</Text>
              </Pressable>
              <Pressable onPress={saveEdit} disabled={saving} style={{ backgroundColor: '#0284c7', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 24, marginLeft: 'auto', opacity: saving ? 0.7 : 1 }}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>{saving ? 'Saving...' : 'Save'}</Text>
              </Pressable>
            </View>
            {newImage && (
              <View style={{ marginTop: 10, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, overflow: 'hidden' }}>
                <Image source={{ uri: newImage.uri }} style={{ width: '100%', height: 160 }} />
              </View>
            )}
          </>
        ) : (
          <Text style={{ color: '#64748b', marginVertical: 8 }}>{post.text}</Text>
        )}

        {post.imageUrl && (
          <Pressable onPress={() => setShowFull(true)}>
            <View
              style={{
                borderRadius: 14,
                overflow: 'hidden',
                backgroundColor: '#f1f5f9',
                marginBottom: 8,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Image
                source={{ uri: post.imageUrl.startsWith('http') ? post.imageUrl : `${API_BASE}${post.imageUrl}` }}
                style={
                  imgRatio
                    ? (Platform.OS === 'web'
                      ? { width: '100%', aspectRatio: imgRatio }
                      : { width: '100%', height: Math.min(400, Math.max(180, 300 * (1 / imgRatio))) })
                    : { width: '100%', height: 220 }
                }
                resizeMode={Platform.OS === 'web' ? 'contain' : 'cover'}
                onLoad={(e) => {
                  const { width, height } = (e.nativeEvent.source || {}) as any;
                  if (width && height) setImgRatio(width / height);
                }}
              />
              <View style={{ position: 'absolute', right: 8, bottom: 8, backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
                <Text style={{ color: '#fff', fontSize: 12 }}>Tap to view</Text>
              </View>
            </View>
          </Pressable>
        )}

        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          <View style={{ backgroundColor: '#e2e8f0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 14, alignSelf: 'flex-start' }}>
            <Text
              style={{ fontSize: 12, fontWeight: '600', color: '#0f172a', letterSpacing: 0.2, textTransform: 'capitalize' }}
              numberOfLines={1}
              allowFontScaling={false}
            >
              {post.category === 'heatwave' ? 'Heat Wave' : post.category}
            </Text>
          </View>

          {post.resolved && (
            <Text
              style={{
                fontSize: 12,
                backgroundColor: '#fee2e2',
                color: '#b91c1c',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 12,
              }}
            >
              RESOLVED
            </Text>
          )}
          {isOwner && post.blocked && (
            <View style={{ backgroundColor: '#fecaca', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 }}>
              <Text style={{ fontSize: 12, color: '#991b1b', fontWeight: '600', letterSpacing: 0.4 }} allowFontScaling={false} numberOfLines={1}>BLOCKED</Text>
            </View>
          )}
        </View>

        <View style={{ flexDirection: 'row', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
          <Pressable
            onPress={async () => {
              if (!activeUserId) return Alert.alert('Login required');
              // optimistic
              const liked = post.likedBy?.includes(activeUserId);
              setData((d: any) => d ? { ...d, post: { ...d.post, upvotes: d.post.upvotes + (liked ? -1 : 1), likedBy: liked ? d.post.likedBy.filter((u: string) => u !== activeUserId) : [...(d.post.likedBy || []), activeUserId] } } : d);
              const res = await Api.upvote(post._id, activeUserId);
              if (res?.post) setData((d: any) => ({ ...d, post: res.post }));
            }}
          >
            <Text>{activeUserId && post.likedBy?.includes(activeUserId) ? '💖' : '❤️'} {post.upvotes}</Text>
          </Pressable>

          {post.userId === activeUserId && !post.resolved && (
            <Pressable
              onPress={async () => {
                await Api.resolvePost(post._id);
                Alert.alert('Marked as resolved');
                r.back(); // go back to list
              }}
            >
              <Text style={{ color: '#16a34a', fontWeight: '700' }}>Mark Resolved</Text>
            </Pressable>
          )}
          {isOwner && !editing && (
            <Pressable onPress={deleting ? undefined : deletePost} style={{ opacity: deleting ? 0.5 : 1 }}>
              <Text style={{ color: '#b91c1c', fontWeight: '700' }}>{deleting ? 'Deleting...' : 'Delete'}</Text>
            </Pressable>
          )}
        </View>

        {isOwner && post.blocked && post.moderationReason && (
          <Text style={{ marginTop: 8, color: '#991b1b', fontSize: 12 }}>
            Reason: {post.moderationReason}
          </Text>
        )}
      </View>

      {/* Comments */}
      <View style={{ backgroundColor: '#fff', marginHorizontal: 12, padding: 14, borderRadius: 16, gap: 8, marginBottom: 24 }}>
        {comments.map((c: any) => (
          <View key={c._id} style={{ paddingVertical: 8, borderBottomWidth: 0.5, borderColor: '#e5e7eb' }}>
            <Text style={{ fontWeight: '700' }}>{c.username}</Text>
            <Text style={{ color: '#334155' }}>{c.text}</Text>
          </View>
        ))}

        {/* Comment box */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Add a comment"
            style={{ flex: 1, backgroundColor: '#f1f5f9', borderRadius: 12, paddingHorizontal: 12 }}
          />
          <Pressable
            onPress={async () => {
              if (sendingComment) return;
              if (!comment.trim()) return;
              if (!activeUserId) return Alert.alert('Login required');
              setSendingComment(true);
              try {
                await Api.addComment(post._id, {
                  userId: activeUserId,
                  username: activeUsername,
                  text: comment,
                });
                setComment('');
                load();
              } finally {
                setSendingComment(false);
              }
            }}
            style={{
              backgroundColor: '#0284c7',
              paddingHorizontal: 16,
              borderRadius: 12,
              justifyContent: 'center',
              opacity: sendingComment ? 0.7 : 1,
            }}
            disabled={sendingComment}
          >
            <Text style={{ color: '#fff', fontWeight: '700' }}>{sendingComment ? 'Sending...' : 'Send'}</Text>
          </Pressable>
        </View>
      </View>

      {/* Full-screen image modal */}
      {post?.imageUrl && (
        <Modal
          visible={showFull}
          transparent
          animationType="fade"
          onRequestClose={() => setShowFull(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.95)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Pressable
              style={{ position: 'absolute', top: 50, right: 24, padding: 12 }}
              onPress={() => setShowFull(false)}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>✕</Text>
            </Pressable>
            <Image
              source={{
                uri: post.imageUrl.startsWith('http')
                  ? post.imageUrl
                  : `${API_BASE}${post.imageUrl}`,
              }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="contain"
            />
            <Pressable
              style={{
                position: 'absolute',
                bottom: 40,
                backgroundColor: 'rgba(255,255,255,0.12)',
                paddingHorizontal: 18,
                paddingVertical: 10,
                borderRadius: 30,
              }}
              onPress={() => setShowFull(false)}
            >
              <Text style={{ color: '#fff', fontWeight: '600' }}>Close</Text>
            </Pressable>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
}
