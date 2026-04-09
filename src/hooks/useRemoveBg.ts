/**
 * useRemoveBg
 * Calls the backend /api/rembg/ endpoint which uses the local rembg library.
 * Returns a transparent PNG as a base64 data URL.
 * 
 * Note: First run may take 30-45s to load ONNX models, then ~15-20s per image.
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
      // Increase timeout to 180 seconds for rembg processing (includes ONNX model loading)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000);

      try {
        const res = await fetch(`${BACKEND}/api/rembg/`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ image: imageDataUrl }),
          signal:  controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          let msg = `เกิดข้อผิดพลาด (${res.status})`;
          try {
            const data = await res.json();
            if (data.detail) msg = data.detail;
          } catch {
            msg = await res.text().catch(() => msg);
          }
          throw new Error(msg);
        }
        const data = await res.json();
        return data.image as string;   // transparent PNG data URL
      } catch (e: unknown) {
        clearTimeout(timeoutId);
        if ((e as DOMException)?.name === 'AbortError') {
          throw new Error('ลบพื้นหลังใช้เวลานาน (>180 วินาที) - ลองใหม่หรือเลือกรูปที่เล็กกว่า');
        }
        throw e;
      }
    } catch (e: unknown) {
      const errorMsg = (e as Error).message;
      setError(errorMsg);
      console.error('RemoveBg error:', errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { removeBg, loading, error };
}
