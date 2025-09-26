import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Api } from '@/services/api';
import { CURRENT_USER } from '@/constants/user';

export default function PostDetail() {
  const { id } = useLocalSearchParams();
  const r = useRouter();

  const [data, setData] = useState<any>(null);
  const [comment, setComment] = useState('');

  const load = async () => {
    if (!id) return;
    const result = await Api.getPost(String(id));
    setData(result);
  };

  useEffect(() => {
    load();
  }, [id]);

  if (!data) return <ActivityIndicator style={{ marginTop: 20 }} />;

  const { post, comments } = data;

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Post card */}
      <View style={{ backgroundColor: '#fff', margin: 12, padding: 14, borderRadius: 16 }}>
        <Text style={{ fontWeight: '700', fontSize: 16 }}>{post.username}</Text>
        <Text style={{ color: '#64748b', marginVertical: 8 }}>{post.text}</Text>

        <View style={{ flexDirection: 'row', gap: 8 }}>
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
        </View>

        <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
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
        </View>
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
    </View>
  );
}
