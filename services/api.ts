import { API_BASE } from '@/constants/env';

export type Category = 'all'|'general'|'flood'|'heatwave'|'earthquake';

export const Api = {
  listPosts: async (category: Category, mine=false, userId?: string) => {
    const p = new URLSearchParams();
    if (category) p.set('category', category);
    if (mine) p.set('mine','1');
    if (userId) p.set('userId', userId);
    const res = await fetch(`${API_BASE}/api/posts?${p}`);
    return res.json();
  },
  getPost: async (id: string) => (await fetch(`${API_BASE}/api/posts/${id}`)).json(),
  createPost: async (payload: any, image?: any) => {
    const form = new FormData();
    form.append('payload', JSON.stringify(payload));
    if (image) form.append('image', image as any);
    const res = await fetch(`${API_BASE}/api/posts`, { method: 'POST', body: form });
    return res.json();
  },
  addComment: async (id: string, body: any) =>
    (await fetch(`${API_BASE}/api/posts/${id}/comments`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    })).json(),
  resolvePost: async (id: string) =>
    (await fetch(`${API_BASE}/api/posts/${id}/resolve`, { method: 'PATCH' })).json(),
  upvote: async (id: string) =>
    (await fetch(`${API_BASE}/api/posts/${id}/upvote`, { method: 'POST' })).json(),
  listMessages: async () => (await fetch(`${API_BASE}/api/messages`)).json(),
};
