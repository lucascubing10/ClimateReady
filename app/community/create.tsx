import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';

import { Api, Category } from '@/services/api';
import { CURRENT_USER } from '@/constants/user';
import { emitPostCreated } from '@/utils/eventBus';

const categories: Category[] = ['general', 'flood', 'heatwave', 'earthquake'];
const CategoryChip = ({ value, active, onPress }: { value: Category; active: boolean; onPress: () => void }) => (
  <Pressable
    onPress={onPress}
    style={{
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 22,
      backgroundColor: active ? '#0284c7' : '#e2e8f0',
      marginRight: 8,
      marginBottom: 8,
      minWidth: 78,
      alignItems: 'center'
    }}
    hitSlop={6}
  >
    <Text
      style={{ color: active ? '#fff' : '#334155', fontWeight: '600', fontSize: 13, textTransform: 'capitalize', letterSpacing: 0.2 }}
      numberOfLines={1}
      allowFontScaling={false}
    >
      {value === 'heatwave' ? 'Heat Wave' : value}
    </Text>
  </Pressable>
);

export default function CreatePost() {
  const [category, setCategory] = useState<Category>('general');
  const [text, setText] = useState('');
  const [image, setImage] = useState<any>(null);
  const r = useRouter();

  const pick = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      base64: true,
    });
    if (!res.canceled) {
      const a = res.assets[0];
      setImage({
        uri: a.uri,
        name: a.fileName || 'photo.jpg',
        type: a.mimeType || 'image/jpeg',
        base64: a.base64, // may be undefined on some platforms
      });
    }
  };

  const submit = async () => {
    if (!text.trim()) return Alert.alert('Say something about your issue');

    const payload = {
      userId: CURRENT_USER.id,
      username: CURRENT_USER.username,
      category: category === 'all' ? 'general' : category,
      text,
      // If we fall back to base64 (e.g., web where file object may fail) add it
      imageBase64: image?.base64 ? `data:${image.type};base64,${image.base64}` : undefined,
    };

    try {
      const result = await Api.createPost(payload, image);
      if (result?.moderation) {
        Alert.alert('Moderation', `${result.moderation.reason}`);
      }
      if (result?.post) emitPostCreated(result.post);
      r.replace('/community' as any);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to create post');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff', padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: '700' }}>Create Post</Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {categories.map(c => (
          <CategoryChip key={c} value={c} active={category === c} onPress={() => setCategory(c)} />
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
