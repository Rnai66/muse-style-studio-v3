/**
 * useAIPipeline
 * Connects frontend to the Python FastAPI backend via SSE streaming.
 * Each pipeline (tryon / hair / makeup) streams progress % + final image URL.
 * useStylePipeline chains all steps into one unified flow.
 */
import { useState, useCallback, useRef } from 'react';

const BACKEND = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8000';

export interface PipelineState {
  status: 'idle' | 'running' | 'done' | 'error';
  progress: number;      // 0-100
  message: string;
  resultUrl: string | null;
  error: string | null;
}

function usePipeline() {
  const [state, setState] = useState<PipelineState>({
    status: 'idle', progress: 0, message: '', resultUrl: null, error: null,
  });
  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(async (endpoint: string, body: object) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setState({ status: 'running', progress: 0, message: 'กำลังเชื่อมต่อ...', resultUrl: null, error: null });

    try {
      const res = await fetch(`${BACKEND}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });

      if (!res.ok) throw new Error(`Server error ${res.status}`);
      if (!res.body) throw new Error('No response body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        const lines = buf.split('\n\n');
        buf = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const json = line.slice(6);
          try {
            const evt = JSON.parse(json);
            if (evt.type === 'progress') {
              setState(s => ({ ...s, progress: evt.percent, message: evt.message }));
            } else if (evt.type === 'result') {
              setState({ status: 'done', progress: 100, message: 'เสร็จแล้ว', resultUrl: evt.url, error: null });
            } else if (evt.type === 'error') {
              setState({ status: 'error', progress: 0, message: '', resultUrl: null, error: evt.message });
            }
          } catch { /* ignore malformed event */ }
        }
      }
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') return;
      setState(s => ({ ...s, status: 'error', error: (err as Error).message }));
    }
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState({ status: 'idle', progress: 0, message: '', resultUrl: null, error: null });
  }, []);

  return { state, run, reset };
}

// ── Specialised hooks ──

export function useTryOnPipeline() {
  const { state, run, reset } = usePipeline();

  const tryOn = useCallback((personB64: string, garmentB64: string, category = 'upper_body') => {
    return run('/api/tryon/', { person_image: personB64, garment_image: garmentB64, category });
  }, [run]);

  return { state, tryOn, reset };
}

export function useHairPipeline() {
  const { state, run, reset } = usePipeline();

  const changeHair = useCallback((personB64: string, hairstyle: string, hairColor?: string, strength = 0.6) => {
    return run('/api/hair/', { person_image: personB64, hairstyle, hair_color: hairColor, strength });
  }, [run]);

  return { state, changeHair, reset };
}

export function useMakeupPipeline() {
  const { state, run, reset } = usePipeline();

  const applyMakeup = useCallback((personB64: string, style: string, intensity = 0.5) => {
    return run('/api/makeup/', { person_image: personB64, style, intensity });
  }, [run]);

  return { state, applyMakeup, reset };
}

export function useBodyAnalysis() {
  const [result, setResult] = useState<object | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (personB64: string) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${BACKEND}/api/analyze/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ person_image: personB64 }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      setResult(await res.json());
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { result, loading, error, analyze };
}

// ── Unified style pipeline (chains tryon → hair → makeup) ──

export interface StyleInput {
  personDataUrl: string;
  // Clothing items (use first item for tryon)
  items: { dataUrl: string; category: string }[];
  // Details
  hairstyle?: string;
  hairColor?: string;
  accessories?: string[];
  shoes?: string;
  makeup?: string;
  customText?: string;
}

export function useStylePipeline() {
  const [state, setState] = useState<PipelineState>({
    status: 'idle', progress: 0, message: '', resultUrl: null, error: null,
  });
  const abortRef = useRef<AbortController | null>(null);

  /** Run one SSE endpoint; resolves with final result URL or null */
  const runStep = useCallback(async (
    endpoint: string,
    body: object,
    progressBase: number,   // 0..100 start
    progressSpan: number,   // how many % points this step covers
    ctrl: AbortController,
    onProgress: (p: number, msg: string) => void,
  ): Promise<string> => {
    const res = await fetch(`${BACKEND}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`Server error ${res.status}`);
    if (!res.body) throw new Error('No response body');

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    let resultUrl: string | null = null;
    let serverError: string | null = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split('\n\n');
      buf = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        let evt: { type: string; message?: string; percent?: number; url?: string };
        try {
          evt = JSON.parse(line.slice(6));
        } catch {
          continue; // only skip truly malformed JSON
        }
        if (evt.type === 'progress') {
          const scaled = progressBase + Math.round((evt.percent ?? 0) * progressSpan / 100);
          onProgress(scaled, evt.message ?? '');
        } else if (evt.type === 'result') {
          resultUrl = evt.url ?? null;
        } else if (evt.type === 'error') {
          // Capture server error — do NOT swallow it
          serverError = evt.message ?? 'Unknown server error';
        }
      }
    }

    // Throw server error AFTER draining the stream
    if (serverError) throw new Error(serverError);
    if (!resultUrl) throw new Error('ไม่ได้รับผลลัพธ์จาก AI — กรุณาลองใหม่อีกครั้ง');
    return resultUrl;
  }, []);

  const generate = useCallback(async (input: StyleInput) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setState({ status: 'running', progress: 0, message: 'เริ่มต้น...', resultUrl: null, error: null });

    const onProgress = (p: number, msg: string) =>
      setState(s => ({ ...s, progress: p, message: msg }));

    try {
      let currentImageDataUrl = input.personDataUrl;
      let stepsDone = 0;
      const totalSteps =
        (input.items.length > 0 ? 1 : 0) +
        (input.hairstyle ? 1 : 0) +
        (input.makeup ? 1 : 0);

      if (totalSteps === 0) {
        setState(s => ({ ...s, status: 'error', error: 'กรุณาเลือกเสื้อผ้าหรือรายละเอียดอย่างน้อย 1 อย่างก่อนสร้างภาพ' }));
        return;
      }

      const span = Math.floor(90 / totalSteps);

      // ── Step 1: Virtual Try-On (first item) ──
      if (input.items.length > 0) {
        const item = input.items[0];
        setState(s => ({ ...s, message: 'กำลังลองชุด...' }));
        // BUG FIX: was `data:image/jpeg;base64,${item.base64}` — hardcoded jpeg
        // would corrupt PNG / WebP uploads. Use dataUrl which carries the correct prefix.
        const resultUrl = await runStep(
          '/api/tryon/',
          {
            person_image: currentImageDataUrl,
            garment_image: item.dataUrl,
            category: item.category,
          },
          stepsDone * span,
          span,
          ctrl,
          onProgress,
        );
        currentImageDataUrl = resultUrl;  // runStep now throws if null
        stepsDone++;
      }

      // ── Step 2: Hair ──
      if (input.hairstyle) {
        setState(s => ({ ...s, message: 'กำลังเปลี่ยนทรงผม...' }));
        const extras = [
          input.accessories?.length ? input.accessories.join(', ') : '',
          input.shoes ? `wearing ${input.shoes} shoes` : '',
          input.customText ?? '',
        ].filter(Boolean).join(', ');
        const hairPrompt = extras ? `${input.hairstyle}, ${extras}` : input.hairstyle;

        const resultUrl = await runStep(
          '/api/hair/',
          {
            person_image: currentImageDataUrl,
            hairstyle: hairPrompt,
            hair_color: input.hairColor,
          },
          stepsDone * span,
          span,
          ctrl,
          onProgress,
        );
        currentImageDataUrl = resultUrl;
        stepsDone++;
      }

      // ── Step 3: Makeup ──
      if (input.makeup) {
        setState(s => ({ ...s, message: '💄 กำลังแต่งหน้า...' }));
        const resultUrl = await runStep(
          '/api/makeup/',
          {
            person_image: currentImageDataUrl,
            style: input.makeup,
            intensity: 0.6,
          },
          stepsDone * span,
          span,
          ctrl,
          onProgress,
        );
        currentImageDataUrl = resultUrl;
      }

      setState({
        status: 'done',
        progress: 100,
        message: 'เสร็จแล้ว',
        resultUrl: currentImageDataUrl,
        error: null,
      });
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') return;
      setState(s => ({ ...s, status: 'error', error: (err as Error).message }));
    }
  }, [runStep]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState({ status: 'idle', progress: 0, message: '', resultUrl: null, error: null });
  }, []);

  return { state, generate, reset };
}
