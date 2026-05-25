'use client';

import { useCallback, useEffect, useState } from 'react';

import type { WhiteboardProfile } from '@/features/whiteboard/types';
import { createBrowserId } from '@/features/whiteboard/utils/identity';

const STORAGE_KEY = 'ethara.whiteboard.profile';

type StoredProfile = Partial<WhiteboardProfile>;

function readStoredProfile(): WhiteboardProfile | null {
  if (typeof window === 'undefined') return null;

  try {
    const rawProfile = window.localStorage.getItem(STORAGE_KEY);
    if (!rawProfile) return null;

    const profile = JSON.parse(rawProfile) as StoredProfile;

    if (!profile.browserId || !profile.displayName) return null;

    return {
      browserId: profile.browserId,
      displayName: profile.displayName,
      email: profile.email || undefined,
    };
  } catch {
    return null;
  }
}

export function useBrowserProfile() {
  const [profile, setProfileState] = useState<WhiteboardProfile | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const savedProfile = readStoredProfile();

      if (savedProfile) {
        setProfileState(savedProfile);
      } else {
        setProfileState({ browserId: createBrowserId(), displayName: '' });
      }

      setIsReady(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const saveProfile = useCallback((nextProfile: Omit<WhiteboardProfile, 'browserId'> & { browserId?: string }) => {
    const normalizedProfile: WhiteboardProfile = {
      browserId: nextProfile.browserId || profile?.browserId || createBrowserId(),
      displayName: nextProfile.displayName.trim(),
      email: nextProfile.email?.trim() || undefined,
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedProfile));
    setProfileState(normalizedProfile);
    return normalizedProfile;
  }, [profile?.browserId]);

  return {
    isReady,
    profile,
    saveProfile,
  };
}
