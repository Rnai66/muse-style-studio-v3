/**
 * useRemoveBg
 * Calls the RNAI API /api/v1/remove-background endpoint.
 * Returns a transparent PNG as a base64 data URL.
 */
import { useState, useCallback } from 'react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8000';
const PROXY_URL = `${BACKEND_URL}/api/rnai/remove-background`;

export function useRemoveBg() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const removeBg = useCallback(async (imageDataUrl: string): Promise<string | null> => {
    /* API Key check removed - handled by backend */
    
    setLoading(true);
    setError(null);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000); // Increased to 3m for Render cold starts

      try {
        const res = await fetch(PROXY_URL, {
          method:  'POST',
          headers: { 
            'Content-Type': 'application/json',
          },
          body:    JSON.stringify({ image: imageDataUrl }),
          signal:  controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          let msg = `RNAI Error (${res.status})`;
          try {
            const data = await res.json();
            if (data.error) msg = data.error;
            else if (data.message) msg = data.message;
          } catch {
            msg = await res.text().catch(() => msg);
          }
          throw new Error(msg);
        }
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        if (!data.image && data.message) throw new Error(data.message);
        if (!data.image) throw new Error('ไม่ได้รับรูปภาพจาก RNAI — กรุณาลองใหม่อีกครั้ง');
        
        return data.image as string;   // transparent PNG data URL (or whatever the API returns)
      } catch (e: unknown) {
        clearTimeout(timeoutId);
        if ((e as DOMException)?.name === 'AbortError') {
          throw new Error('การเชื่อมต่อกับ RNAI ล้มเหลว (Timeout) - กรุณาลองใหม่อีกครั้ง');
        }
        throw e;
      }
    } catch (e: unknown) {
      const errorMsg = (e as Error).message;
      setError(errorMsg);
      console.error('RemoveBg RNAI error:', errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { removeBg, loading, error };
}
