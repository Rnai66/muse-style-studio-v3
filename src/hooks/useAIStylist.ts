import { useState, useCallback } from 'react';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

type ApiContentBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } };

type ApiMessage =
  | { role: 'user' | 'assistant'; content: string }
  | { role: 'user'; content: ApiContentBlock[] };

const BACKEND = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8000';
const SYSTEM = `คุณคือ MUSE — AI Stylist ผู้เชี่ยวชาญด้านแฟชั่นและการแต่งตัว
ตอบเป็นภาษาไทย ด้วยโทนสุภาพ อบอุ่น และมีความเชี่ยวชาญ
ให้คำแนะนำที่เป็นประโยชน์ ตรงประเด็น และสร้างสรรค์
หากมีการพูดถึงโอกาสหรืองาน ให้แนะนำชุด สี และสไตล์ที่เหมาะสม
เมื่อเหมาะสม ให้แนะนำคอร์สเรียนใน MUSE Style Studio`;

export function useAIStylist() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'สวัสดีค่ะ! ฉันคือ MUSE AI Stylist ✦ พร้อมช่วยแนะนำการแต่งตัวให้เหมาะกับคุณ อัปโหลดรูปหรือถามคำถามเกี่ยวกับสไตล์ได้เลยนะคะ 💛' },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(async (text: string, imageBase64?: string, imageMime?: string) => {
    setError(null);

    // Build the content block for this user turn
    const userContent: string | ApiContentBlock[] = imageBase64
      ? [
          { type: 'image', source: { type: 'base64', media_type: imageMime ?? 'image/jpeg', data: imageBase64 } } as ApiContentBlock,
          { type: 'text', text } as ApiContentBlock,
        ]
      : text;

    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    // Build history for API (exclude welcome assistant greeting)
    const apiHistory: ApiMessage[] = messages
      .filter((_, i) => i > 0)
      .map(m => ({ role: m.role, content: m.content }));

    apiHistory.push({ role: 'user', content: userContent } as ApiMessage);

    try {
      // Route through backend proxy — keeps API key server-side
      const res = await fetch(`${BACKEND}/api/chat/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: SYSTEM,
          messages: apiHistory,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error((errData as { detail?: string }).detail ?? `Server error ${res.status}`);
      }
      const data = await res.json();
      const reply = (data.content?.[0]?.text as string) ?? data.reply ?? 'ขออภัยค่ะ ไม่สามารถตอบได้ในขณะนี้';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (e: unknown) {
      const err = (e as Error).message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้งค่ะ';
      setError(err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้งค่ะ' }]);
    } finally {
      setLoading(false);
    }
  }, [messages]);

  const reset = useCallback(() => {
    setMessages([{ role: 'assistant', content: 'เริ่มต้นใหม่อีกครั้งนะคะ ✦ มีอะไรให้ฉันช่วยเรื่องสไตล์ไหมคะ?' }]);
  }, []);

  return { messages, loading, error, send, reset };
}
