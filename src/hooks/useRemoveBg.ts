/**
 * useRemoveBg
 * Calls the RNAI API /api/v1/remove-background endpoint.
 * Returns a transparent PNG as a base64 data URL.
 */
import { useState, useCallback, useRef } from 'react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8000';
const PROXY_URL = `${BACKEND_URL}/api/rnai/remove-background`;
const LOCAL_REMBG_URL = `${BACKEND_URL}/api/rembg/`;
const RETRYABLE_STATUS = new Set([429, 502, 503, 504]);
const MAX_PROXY_ATTEMPTS = 3;

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function getFriendlyError(rawMessage: string, diagnostics: string[] = []): string {
  const corpus = `${rawMessage}\n${diagnostics.join('\n')}`.toLowerCase();

  if (corpus.includes('payment method')) {
    return 'บัญชี AI หมดเครดิตหรือยังไม่ผูกบัตรชำระเงิน กรุณาตรวจสอบค่าใช้งานของผู้ให้บริการ AI';
  }
  if (corpus.includes('rate limit') || corpus.includes('too many requests')) {
    return 'ระบบ AI ถูกใช้งานหนาแน่นชั่วคราว กรุณารอสักครู่แล้วลองใหม่';
  }
  if (corpus.includes('busy') || corpus.includes('service unavailable') || corpus.includes('503')) {
    return 'บริการ AI ต้นทางไม่พร้อมใช้งานชั่วคราว ระบบจะลองวิธีสำรองให้อัตโนมัติ';
  }
  return rawMessage;
}

async function parseErrorResponse(res: Response): Promise<{ message: string; diagnostics: string[] }> {
  let message = `RNAI Error (${res.status})`;
  let diagnostics: string[] = [];

  try {
    const data = await res.json();
    const detail = data.detail;
    if (typeof detail === 'string') {
      message = detail;
    } else if (detail && detail.message) {
      message = detail.message;
      if (Array.isArray(detail.diagnostics)) {
        diagnostics = detail.diagnostics.map((d: unknown) => String(d));
        console.warn('AI Diagnostics:', diagnostics);
      }
    } else if (data.error) {
      message = data.error;
    } else if (data.message) {
      message = data.message;
    }
  } catch {
    message = await res.text().catch(() => message);
  }

  return {
    message: getFriendlyError(message, diagnostics),
    diagnostics,
  };
}

export function useRemoveBg() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const removeBg = useCallback(async (imageDataUrl: string): Promise<string | null> => {
    /* API Key check removed - handled by backend */
    
    setLoading(true);
    setError(null);
    setProgress(0);
    
    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    const controller = abortControllerRef.current;
    
    try {
      const timeoutId = setTimeout(() => controller.abort(), 180000); // 3m for Render cold starts
      setProgress(10); // Show we started

      try {
        let lastProxyError: string | null = null;
        let usedRetry = false;

        for (let attempt = 1; attempt <= MAX_PROXY_ATTEMPTS; attempt += 1) {
          const res = await fetch(PROXY_URL, {
            method:  'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body:    JSON.stringify({ image: imageDataUrl }),
            signal:  controller.signal,
          });

          if (res.ok) {
            clearTimeout(timeoutId);
            setProgress(75);
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            if (!data.image && data.message) throw new Error(data.message);
            if (!data.image) throw new Error('ไม่ได้รับรูปภาพจาก AI — กรุณาลองใหม่อีกครั้ง');

            setProgress(100);
            return data.image as string;
          }

          const parsedError = await parseErrorResponse(res);
          lastProxyError = parsedError.message;
          const shouldRetry = RETRYABLE_STATUS.has(res.status) && attempt < MAX_PROXY_ATTEMPTS;

          if (!shouldRetry) {
            break;
          }

          usedRetry = true;
          setProgress(Math.min(60, 20 + attempt * 15));
          await wait(900 * attempt); // progressive backoff
        }

        // Last fallback from frontend side: call local rembg endpoint directly.
        setProgress(70);
        const fallbackRes = await fetch(LOCAL_REMBG_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ image: imageDataUrl }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!fallbackRes.ok) {
          const parsedError = await parseErrorResponse(fallbackRes);
          const prefix = usedRetry ? 'ลองหลายรอบแล้วยังไม่สำเร็จ' : 'ลบพื้นหลังไม่สำเร็จ';
          throw new Error(`${prefix}: ${parsedError.message}`);
        }

        const fallbackData = await fallbackRes.json();
        if (!fallbackData.image) {
          throw new Error(lastProxyError || 'ไม่ได้รับรูปภาพจากระบบลบพื้นหลัง');
        }

        setProgress(100);
        return fallbackData.image as string;
      } catch (e: unknown) {
        clearTimeout(timeoutId);
        if ((e as DOMException)?.name === 'AbortError') {
          throw new Error('ยกเลิกการประมวลผล หรือ เชื่อมต่อล้มเหลว - กรุณาลองใหม่อีกครั้ง');
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
      setProgress(0);
      abortControllerRef.current = null;
    }
  }, []);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  return { removeBg, loading, error, progress, cancel };
}
