/**
 * useAvatarGen
 * Calls /api/avatar/generate/ to produce a photorealistic portrait via FLUX.
 */
import { useState, useCallback } from 'react';
import type { UserProfile } from '@/types/profile';

const BACKEND = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8000';

interface AvatarResult {
  url: string;
  prompt: string;
}

export function useAvatarGen() {
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [result, setResult]     = useState<AvatarResult | null>(null);

  const generate = useCallback(async (profile: UserProfile): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND}/api/avatar/generate/`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skin_tone:   profile.skinTone,
          hair_color:  profile.hairColor,
          hair_length: profile.hairLength,
          hair_style:  profile.hairStyle,
          face_shape:  profile.faceShape,
          body_type:   profile.bodyType,
          name:        profile.name,
        }),
      });
      if (!res.ok) {
        const msg = await res.text().catch(() => `HTTP ${res.status}`);
        throw new Error(msg);
      }
      const data: AvatarResult = await res.json();
      setResult(data);
      return data.url;
    } catch (e: unknown) {
      setError((e as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { generate, loading, error, result, reset };
}
