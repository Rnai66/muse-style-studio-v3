/**
 * useRnaiPipeline
 * Connects to the RNAI API (rnai-io.vercel.app).
 * Supports text-to-image generation and image editing.
 */
import { useState, useCallback } from 'react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8000';
const PROXY_BASE = `${BACKEND_URL}/api/rnai`;

export interface RnaiState {
  status: 'idle' | 'running' | 'done' | 'error';
  resultUrl: string | null;
  error: string | null;
}

export function useRnai() {
  const [state, setState] = useState<RnaiState>({
    status: 'idle', resultUrl: null, error: null,
  });

  const generate = useCallback(async (prompt: string) => {
    /* API Key check removed - handled by backend */

    setState({ status: 'running', resultUrl: null, error: null });
    try {
      const res = await fetch(`${PROXY_BASE}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) throw new Error(`RNAI Error (${res.status})`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (!data.image) throw new Error('ไม่ได้รับรูปภาพจาก RNAI');
      
      setState({ status: 'done', resultUrl: data.image, error: null });
    } catch (err: unknown) {
      setState({ status: 'error', resultUrl: null, error: (err as Error).message });
    }
  }, []);

  const edit = useCallback(async (image: string, prompt: string, mask?: string) => {
    /* API Key check removed - handled by backend */

    setState({ status: 'running', resultUrl: null, error: null });
    try {
      const body: any = { image, prompt };
      if (mask) body.mask = mask;

      const res = await fetch(`${PROXY_BASE}/edit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`RNAI Error (${res.status})`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (!data.image) throw new Error('ไม่ได้รับรูปภาพจาก RNAI');

      setState({ status: 'done', resultUrl: data.image, error: null });
    } catch (err: unknown) {
      setState({ status: 'error', resultUrl: null, error: (err as Error).message });
    }
  }, []);

  const reset = useCallback(() => {
    setState({ status: 'idle', resultUrl: null, error: null });
  }, []);

  return { state, generate, edit, reset };
}
