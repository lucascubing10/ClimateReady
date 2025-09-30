import { useAuth } from '@/context/AuthContext';

// Returns a simplified shape used by community components.
// id: Firebase auth uid
// username: derived from profile first/last name or displayName/email fallback
export function useActiveUser() {
  const { user, userProfile } = useAuth();
  const id = user?.uid || null;
  const username = (userProfile && ([userProfile.firstName, userProfile.lastName].filter(Boolean).join(' ').trim() || userProfile.email))
    || user?.displayName
    || user?.email
    || 'User';
  return { id, username };
}

// Non-hook safe accessor (for modules needing lazy evaluation) can be added later if needed.