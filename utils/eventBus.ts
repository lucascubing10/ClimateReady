// utils/eventBus.ts
// Lightweight cross-platform event bus (no Node EventEmitter dependency).
// Fixes web error: _events.EventEmitter is not a constructor.
import type { AlertPreferenceMap } from './alertPreferences';

type Handler = (payload: any) => void;
const listeners: Record<string, Set<Handler>> = {};

function emit(event: string, payload: any) {
  const set = listeners[event];
  if (!set || set.size === 0) return;
  // Copy to array to avoid mutation during iteration
  [...set].forEach(fn => {
    try { fn(payload); } catch (e) { console.warn('[eventBus] handler error', e); }
  });
}

function on(event: string, handler: Handler) {
  if (!listeners[event]) listeners[event] = new Set();
  listeners[event].add(handler);
  return () => {
    listeners[event]?.delete(handler);
    if (listeners[event] && listeners[event].size === 0) delete listeners[event];
  };
}

// Emit helpers
export function emitPostCreated(post: any) { emit('post_created', { post }); }
export function emitPostDeleted(id: string) { emit('post_deleted', { id }); }
export function emitPostUpdated(post: any) { emit('post_updated', { post }); }
export function emitAlertPreferencesUpdated(preferences: AlertPreferenceMap) {
  emit('alert_preferences_updated', { preferences: { ...preferences } });
}
export function emitAlertTextToSpeechUpdated(enabled: boolean) {
  emit('alert_tts_updated', { enabled });
}

// Subscribe helpers - returns unsubscribe functions
export function onPostCreated(cb: (post: any) => void) { return on('post_created', e => cb(e.post)); }
export function onPostDeleted(cb: (id: string) => void) { return on('post_deleted', e => cb(e.id)); }
export function onPostUpdated(cb: (post: any) => void) { return on('post_updated', e => cb(e.post)); }
export function onAlertPreferencesUpdated(cb: (preferences: AlertPreferenceMap) => void) {
  return on('alert_preferences_updated', e => cb(e.preferences));
}
export function onAlertTextToSpeechUpdated(cb: (enabled: boolean) => void) {
  return on('alert_tts_updated', e => cb(e.enabled));
}

// For debugging (optional): expose a way to inspect listeners in dev
if (__DEV__) {
  (globalThis as any).__CR_EVENT_BUS_DEBUG__ = {
    list: () => Object.fromEntries(Object.entries(listeners).map(([k,v]) => [k, v.size]))
  };
}
