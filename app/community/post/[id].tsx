import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert, Image, Modal, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Api } from '@/services/api';
import { API_BASE } from '@/constants/env';
import { CURRENT_USER } from '@/constants/user';
import { emitPostUpdated, emitPostDeleted } from '@/utils/eventBus';

export default function PostDetail() {
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

  const load = async () => {
    if (!id) return;
    const result = await Api.getPost(String(id));
    setData(result);
    if (result?.post) {
      setEditText(result.post.text);
      setEditCategory(result.post.category);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  if (!data || !data.post) {
    return <ActivityIndicator style={{ marginTop: 20 }} />;
  }

  const { post, comments = [] } = data;

  const isOwner = String(post?.userId || '') === CURRENT_USER.id;

  const pickReplacement = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7, base64: true });
    if (!res.canceled) {
      const a = res.assets[0];
      setNewImage({ uri: a.uri, name: a.fileName || 'replace.jpg', type: a.mimeType || 'image/jpeg', base64: a.base64 });
    }
  };

  const saveEdit = async () => {
    try {
      const result = await Api.updatePost(post._id, { userId: CURRENT_USER.id, text: editText, category: editCategory }, newImage);
      if (result.moderation) {
        Alert.alert('Moderation', result.moderation.reason || 'Reviewed');
      }
      setNewImage(null);
      setEditing(false);
      if (result?.post) {
        setData((d: any) => {
          if (!d) return { post: result.post, comments: [] };
            return { ...d, post: result.post };
        });
        emitPostUpdated(result.post);
      } else {
        load();
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to update');
    }
  };

  const performDelete = async () => {
    try {
      setDeleting(true);
      console.log('[UI] performDelete -> calling Api.deletePost');
      const res = await Api.deletePost(post._id, CURRENT_USER.id);
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

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
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
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {['general','flood','heatwave','earthquake'].map(c => (
                <Pressable key={c} onPress={() => setEditCategory(c)} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, backgroundColor: editCategory === c ? '#0284c7' : '#e2e8f0' }}>
                  <Text style={{ color: editCategory === c ? '#fff' : '#334155', fontSize: 12 }}>{c}</Text>
                </Pressable>
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 10 }}>
              <Pressable onPress={pickReplacement} style={{ backgroundColor: '#e2e8f0', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 }}>
                <Text style={{ fontWeight: '600' }}>{newImage ? 'Change Image' : 'Replace Image'}</Text>
              </Pressable>
              <Pressable onPress={saveEdit} style={{ backgroundColor: '#0284c7', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, marginLeft: 'auto' }}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Save</Text>
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
              }}
            >
              <Image
                source={{ uri: post.imageUrl.startsWith('http') ? post.imageUrl : `${API_BASE}${post.imageUrl}` }}
                style={{
                  width: '100%',
                  // dynamic height based on aspect ratio once loaded; fallback 220
                  height: imgRatio ? Math.min(400, Math.max(180, 300 * (1 / imgRatio))) : 220,
                }}
                resizeMode="cover"
                onLoad={(e) => {
                  const { width, height } = e.nativeEvent.source || {} as any;
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
          <Text
            style={{
              fontSize: 12,
              backgroundColor: '#e2e8f0',
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 12,
              textTransform: 'capitalize',
            }}
          >
            {post.category}
          </Text>

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
            <Text
              style={{
                fontSize: 12,
                backgroundColor: '#fecaca',
                color: '#991b1b',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 12,
              }}
            >
              BLOCKED
            </Text>
          )}
        </View>

        <View style={{ flexDirection: 'row', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
          <Pressable
            onPress={async () => {
              await Api.upvote(post._id);
              load();
            }}
          >
            <Text>❤️ {post.upvotes}</Text>
          </Pressable>

          {post.userId === CURRENT_USER.id && !post.resolved && (
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
      <View style={{ backgroundColor: '#fff', marginHorizontal: 12, padding: 14, borderRadius: 16, gap: 8 }}>
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
              if (!comment.trim()) return;
              await Api.addComment(post._id, {
                userId: CURRENT_USER.id,
                username: CURRENT_USER.username,
                text: comment,
              });
              setComment('');
              load();
            }}
            style={{
              backgroundColor: '#0284c7',
              paddingHorizontal: 16,
              borderRadius: 12,
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '700' }}>Send</Text>
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
    </View>
  );
}
