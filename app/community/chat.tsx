import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { io } from 'socket.io-client';

import { API_BASE } from '@/constants/env';
import { useActiveUser } from '@/utils/activeUser';
import { Api } from '@/services/api';

export default function Chat() {
  const { id: activeUserId, username: activeUsername } = useActiveUser();
  const [socket, setSocket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');

  // Load initial messages + connect socket
  useEffect(() => {
    Api.listMessages().then(setMessages);

    const s = io(API_BASE, { transports: ['websocket'] });
    s.on('connect', () => console.log('Connected to chat server'));
    s.on('chat:new', (m: any) => {
      setMessages((prev) => [...prev, m]);
    });
    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  const send = () => {
    if (!text.trim() || !socket) return;
    if (!activeUserId) return; // optionally show toast/alert
    socket.emit('chat:send', {
      userId: activeUserId,
      username: activeUsername,
      text,
    });
    setText('');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', android: undefined })}
      style={{ flex: 1, backgroundColor: '#f8fafc' }}
    >
      {/* Messages list */}
      <FlatList
        data={messages}
        keyExtractor={(m) => m._id || Math.random().toString()}
        renderItem={({ item }) => (
          <View style={{ backgroundColor: '#fff', margin: 12, padding: 12, borderRadius: 16 }}>
            <Text style={{ fontWeight: '700' }}>{item.username}</Text>
            <Text style={{ color: '#334155' }}>{item.text}</Text>
          </View>
        )}
      />

      {/* Input bar */}
      <View style={{ flexDirection: 'row', gap: 8, padding: 12, backgroundColor: '#fff' }}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Share emergency updates or ask for help..."
          style={{
            flex: 1,
            backgroundColor: '#f1f5f9',
            borderRadius: 24,
            paddingHorizontal: 16,
          }}
        />
        <Pressable
          onPress={send}
          style={{
            backgroundColor: '#0284c7',
            borderRadius: 24,
            paddingHorizontal: 16,
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>➤</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
