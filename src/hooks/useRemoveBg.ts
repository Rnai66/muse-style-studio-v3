/**
 * useRemoveBg
 * Calls the backend /api/rembg/ endpoint which uses the local rembg library.
 * Returns a transparent PNG as a base64 data URL.
 */
import { useState, useCallback } from 'react';

const BACKEND = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8000';

export function useRemoveBg() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const removeBg = useCallback(async (imageDataUrl: string): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND}/api/rembg/`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ image: imageDataUrl }),
      });
      if (!res.ok) {
        const msg = await res.text().catch(() => `HTTP ${res.status}`);
        throw new Error(msg);
      }
      const data = await res.json();
      return data.image as string;   // transparent PNG data URL
    } catch (e: unknown) {
      setError((e as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { removeBg, loading, error };
}
