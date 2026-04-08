import { useState, useCallback } from 'react';
import type {
  UserProfile, SkinTone, HairColor, HairLength,
  HairStyle, FaceShape, BodyMeasurements,
} from '@/types/profile';
import { computeBodyType, computeBMI } from '@/types/profile';

const STORAGE_KEY = 'muse_user_profile';

function defaultMeasurements(): BodyMeasurements {
  return { height: 160, weight: 55, bust: 88, waist: 68, hips: 92, shoulder: 40 };
}

function createProfile(partial?: Partial<UserProfile>): UserProfile {
  const m = partial?.measurements ?? defaultMeasurements();
  return {
    id: Date.now().toString(),
    name: 'My Style',
    skinTone: 'medium' as SkinTone,
    hairColor: 'black' as HairColor,
    hairLength: 'shoulder' as HairLength,
    hairStyle: 'straight' as HairStyle,
    faceShape: 'oval' as FaceShape,
    measurements: m,
    bodyType: computeBodyType(m),
    bmi: computeBMI(m.weight, m.height),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...partial,
  };
}

function load(): UserProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

function save(p: UserProfile) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch {}
}

// ── Singleton-style hook (share state across components via module-level var) ──
// For a real app, replace with Zustand / Context.

let _profile: UserProfile = load() ?? createProfile();
const _listeners = new Set<() => void>();

function notify() { _listeners.forEach(fn => fn()); }

export function useProfileStore() {
  const [, forceRender] = useState(0);

  const subscribe = useCallback(() => {
    const fn = () => forceRender(n => n + 1);
    _listeners.add(fn);
    return () => _listeners.delete(fn);
  }, []);

  // call subscribe once on mount
  useState(subscribe);

  const update = useCallback((patch: Partial<UserProfile>) => {
    const m = patch.measurements ?? _profile.measurements;
    _profile = {
      ..._profile,
      ...patch,
      measurements: m,
      bodyType: computeBodyType(m),
      bmi: computeBMI(m.weight, m.height),
      updatedAt: new Date().toISOString(),
    };
    save(_profile);
    notify();
  }, []);

  const updateMeasure = useCallback((key: keyof BodyMeasurements, val: number) => {
    const m = { ..._profile.measurements, [key]: val };
    update({ measurements: m });
  }, [update]);

  const reset = useCallback(() => {
    _profile = createProfile();
    save(_profile);
    notify();
  }, []);

  return { profile: _profile, update, updateMeasure, reset };
}
