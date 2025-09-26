import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';

import { Api, Category } from '@/services/api';
import { CURRENT_USER } from '@/constants/user';

export default function CreatePost() {
  const [category, setCategory] = useState<Category>('general');
  const [text, setText] = useState('');
  const [image, setImage] = useState<any>(null);
  const r = useRouter();

  const pick = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!res.canceled) {
      const a = res.assets[0];
      setImage({ uri: a.uri, name: 'photo.jpg', type: a.mimeType || 'image/jpeg' });
    }
  };

  const submit = async () => {
    if (!text.trim()) return Alert.alert('Say something about your issue');

    const payload = {
      userId: CURRENT_USER.id,
      username: CURRENT_USER.username,
      category: category === 'all' ? 'general' : category,
      text,
    };

    const result = await Api.createPost(payload, image);
    if (result?.moderation) {
      Alert.alert('Moderation', `${result.moderation.reason}`);
    }

    r.replace('/community' as any);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff', padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: '700' }}>Create Post</Text>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        {(['general', 'flood', 'heatwave', 'earthquake'] as Category[]).map((c) => (
          <Pressable
            key={c}
            onPress={() => setCategory(c)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 16,
              backgroundColor: category === c ? '#0284c7' : '#e2e8f0',
            }}
          >
            <Text style={{ color: category === c ? '#fff' : '#334155', textTransform: 'capitalize' }}>
              {c}
            </Text>
          </Pressable>
        ))}
      </View>

      <TextInput
        placeholder="Describe the issue, location, help needed..."
        multiline
        value={text}
        onChangeText={setText}
        style={{ minHeight: 120, backgroundColor: '#f1f5f9', borderRadius: 12, padding: 12 }}
      />

      {image && <Image source={{ uri: image.uri }} style={{ height: 160, borderRadius: 12 }} />}

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Pressable
          onPress={pick}
          style={{ backgroundColor: '#e2e8f0', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12 }}
        >
          <Text>📷 Add Photo</Text>
        </Pressable>

        <Pressable
          onPress={submit}
          style={{
            backgroundColor: '#0284c7',
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 12,
            marginLeft: 'auto',
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>Post</Text>
        </Pressable>
      </View>
    </View>
  );
}
