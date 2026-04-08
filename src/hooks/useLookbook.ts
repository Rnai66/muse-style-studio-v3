/**
 * useLookbook
 * Saves generated AI results + outfit combos as "looks"
 * Stored in localStorage, shareable via URL (base64 encoded)
 */
import { useState, useCallback, useEffect } from 'react';

export interface Look {
  id: string;
  title: string;
  imageUrl: string;        // AI result URL or base64
  occasion: string;
  tags: string[];
  notes: string;
  createdAt: string;
  outfit?: {
    top?: string;
    bottom?: string;
    shoes?: string;
    bag?: string;
  };
}

const KEY = 'muse_lookbook';

function load(): Look[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function persist(looks: Look[]) {
  try { localStorage.setItem(KEY, JSON.stringify(looks)); } catch {}
}

export function useLookbook() {
  const [looks, setLooks] = useState<Look[]>(load);

  // persist on every change
  useEffect(() => { persist(looks); }, [looks]);

  const saveLook = useCallback((look: Omit<Look, 'id' | 'createdAt'>) => {
    const entry: Look = {
      ...look,
      id: `look_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setLooks(prev => [entry, ...prev]);
    return entry.id;
  }, []);

  const deleteLook = useCallback((id: string) => {
    setLooks(prev => prev.filter(l => l.id !== id));
  }, []);

  const updateLook = useCallback((id: string, patch: Partial<Look>) => {
    setLooks(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l));
  }, []);

  const getLook = useCallback((id: string) => {
    return looks.find(l => l.id === id) ?? null;
  }, [looks]);

  // Filter by occasion or tag
  const filterLooks = useCallback((occasion?: string, tag?: string) => {
    return looks.filter(l => {
      if (occasion && l.occasion !== occasion) return false;
      if (tag && !l.tags.includes(tag)) return false;
      return true;
    });
  }, [looks]);

  return { looks, saveLook, deleteLook, updateLook, getLook, filterLooks };
}
