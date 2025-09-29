import { API_BASE } from '@/constants/env';

export type Category = 'all' | 'general' | 'flood' | 'heatwave' | 'earthquake';

export const Api = {
  // List posts
  async listPosts(category: Category, mine: boolean, userId: string) {
    try {
      const url = new URL(`${API_BASE}/api/posts`);
      url.searchParams.append('category', category);
      if (mine) {
        url.searchParams.append('mine', 'true');
        url.searchParams.append('userId', userId);
      }
      const res = await fetch(url.toString(), { cache: 'no-store' });
      if (!res.ok) {
        return { error: `HTTP ${res.status}`, status: res.status };
      }
      const data = await res.json();
      if (!Array.isArray(data)) {
        return { error: 'Invalid response shape', payload: data };
      }
      return data;
    } catch (e: any) {
      return { error: 'Network error', message: e.message };
    }
  },

  // Create a post with optional image
  async createPost(payload: any, image: any) {
    const form = new FormData();
    form.append('userId', payload.userId);
    form.append('username', payload.username);
    form.append('category', payload.category);
    form.append('text', payload.text);

    // Prefer binary file; if not possible, send base64 field
    if (image && image.uri && image.uri.startsWith('file:')) {
      form.append('image', {
        uri: image.uri,
        name: image.name || 'photo.jpg',
        type: image.type || 'image/jpeg',
      } as any);
    } else if (image?.base64) {
      form.append('imageBase64', `data:${image.type || 'image/jpeg'};base64,${image.base64}`);
    }

    const res = await fetch(`${API_BASE}/api/posts`, { method: 'POST', body: form });
    return await res.json();
  },

  // Get a single post
  async getPost(id: string) {
    const res = await fetch(`${API_BASE}/api/posts/${id}?t=${Date.now()}` , { cache: 'no-store' });
    return await res.json();
  },

  // Update a post (partial + optional image replacement)
  async updatePost(id: string, payload: any, image?: any) {
    const form = new FormData();
    // userId required for auth check
    form.append('userId', payload.userId);
    if (payload.text) form.append('text', payload.text);
    if (payload.category) form.append('category', payload.category);

    if (image && image.uri && image.uri.startsWith('file:')) {
      form.append('image', {
        uri: image.uri,
        name: image.name || 'photo.jpg',
        type: image.type || 'image/jpeg',
      } as any);
    } else if (image?.base64) {
      form.append('imageBase64', `data:${image.type || 'image/jpeg'};base64,${image.base64}`);
    }

    const res = await fetch(`${API_BASE}/api/posts/${id}`, { method: 'PATCH', body: form });
    return await res.json();
  },

  // Delete a post
  async deletePost(id: string, userId: string) {
    const url = `${API_BASE}/api/posts/${id}?userId=${encodeURIComponent(userId)}`;
    console.log('[Api.deletePost] attempt DELETE', url);
    try {
      const res = await fetch(url, { method: 'DELETE' });
      console.log('[Api.deletePost] DELETE status', res.status);
      if (res.ok) return await res.json();
      const fbUrl = `${API_BASE}/api/posts/${id}/delete`;
      console.log('[Api.deletePost] fallback POST', fbUrl);
      const res2 = await fetch(fbUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      console.log('[Api.deletePost] fallback status', res2.status);
      return await res2.json();
    } catch (e: any) {
      console.warn('[Api.deletePost] network error', e.message);
      return { error: 'Network error deleting post' };
    }
  },

  // Upvote post
  async upvote(id: string, userId: string) {
    const res = await fetch(`${API_BASE}/api/posts/${id}/upvote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    return await res.json();
  },

  // Resolve post
  async resolvePost(id: string) {
    const res = await fetch(`${API_BASE}/api/posts/${id}/resolve`, { method: 'POST' });
    return await res.json();
  },

  // Comments
  async addComment(postId: string, data: any) {
    const res = await fetch(`${API_BASE}/api/posts/${postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await res.json();
  },
  async getPostComments(postId: string) {
    const res = await fetch(`${API_BASE}/api/posts/${postId}/comments?t=${Date.now()}`, { cache: 'no-store' });
    return await res.json();
  },

  // List messages for chat
  async listMessages() {
    const res = await fetch(`${API_BASE}/api/messages`);
    return await res.json();
  },

  // -------- Community Notifications (scoped) --------
  async listCommunityNotifications(userId: string, unreadOnly = false) {
    if (!userId) return [];
    const url = new URL(`${API_BASE}/api/community-notifications`);
    url.searchParams.append('userId', userId);
    if (unreadOnly) url.searchParams.append('unread', '1');
    const res = await fetch(url.toString(), { cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  },
  async markCommunityNotificationRead(id: string) {
    const res = await fetch(`${API_BASE}/api/community-notifications/${id}/read`, { method: 'POST' });
    return await res.json();
  },
  async markAllCommunityNotificationsRead(userId: string) {
    const res = await fetch(`${API_BASE}/api/community-notifications/read-all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    return await res.json();
  }
};
