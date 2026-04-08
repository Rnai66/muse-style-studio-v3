import { useState, useCallback, useRef } from 'react';
import type { EditorState, Layer, LayerCategory, Transform, CatalogItem } from '../types';
import { DEFAULT_TRANSFORM, LAYER_ORDER } from '../types';

const INITIAL: EditorState = {
  baseImage: null,
  baseImageSize: { w: 512, h: 680 },
  layers: [],
  selectedLayerId: null,
  canvasW: 512,
  canvasH: 680,
  zoom: 1,
  showGrid: false,
  showComparison: false,
  aiResultUrl: null,
};

export function useEditorStore() {
  const [state, setState] = useState<EditorState>(INITIAL);
  const historyRef = useRef<EditorState[]>([]);
  const redoRef    = useRef<EditorState[]>([]);

  const push = useCallback((next: EditorState) => {
    historyRef.current.push(state);
    if (historyRef.current.length > 30) historyRef.current.shift();
    redoRef.current = [];
    setState(next);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // ── Base image ──
  const setBaseImage = useCallback((dataUrl: string, w: number, h: number) => {
    push({
      ...state,
      baseImage: dataUrl,
      baseImageSize: { w, h },
      canvasW: w,
      canvasH: h,
      layers: [],
      aiResultUrl: null,
    });
  }, [push, state]);

  // ── Layers ──
  const addLayer = useCallback((item: CatalogItem, imageUrl: string) => {
    const newLayer: Layer = {
      id: `layer_${Date.now()}`,
      category: item.category,
      name: item.name,
      imageUrl,
      transform: { ...DEFAULT_TRANSFORM },
      visible: true,
      locked: false,
      aiProcessed: false,
    };
    // Replace layer in same category (except accessories that stack)
    const stackable: LayerCategory[] = ['jewelry', 'glasses', 'hat'];
    const filtered = stackable.includes(item.category)
      ? state.layers
      : state.layers.filter(l => l.category !== item.category);

    // Sort by LAYER_ORDER
    const all = [...filtered, newLayer].sort((a, b) => {
      return LAYER_ORDER.indexOf(a.category) - LAYER_ORDER.indexOf(b.category);
    });

    push({ ...state, layers: all, selectedLayerId: newLayer.id });
  }, [push, state]);

  const removeLayer = useCallback((id: string) => {
    push({
      ...state,
      layers: state.layers.filter(l => l.id !== id),
      selectedLayerId: state.selectedLayerId === id ? null : state.selectedLayerId,
    });
  }, [push, state]);

  const selectLayer = useCallback((id: string | null) => {
    setState(s => ({ ...s, selectedLayerId: id }));
  }, []);

  const updateTransform = useCallback((id: string, patch: Partial<Transform>) => {
    setState(s => ({
      ...s,
      layers: s.layers.map(l =>
        l.id === id ? { ...l, transform: { ...l.transform, ...patch } } : l
      ),
    }));
  }, []);

  const toggleVisible = useCallback((id: string) => {
    setState(s => ({
      ...s,
      layers: s.layers.map(l => l.id === id ? { ...l, visible: !l.visible } : l),
    }));
  }, []);

  const toggleLock = useCallback((id: string) => {
    setState(s => ({
      ...s,
      layers: s.layers.map(l => l.id === id ? { ...l, locked: !l.locked } : l),
    }));
  }, []);

  const markAIProcessed = useCallback((id: string, resultUrl: string) => {
    setState(s => ({
      ...s,
      layers: s.layers.map(l =>
        l.id === id ? { ...l, imageUrl: resultUrl, aiProcessed: true } : l
      ),
      aiResultUrl: resultUrl,
    }));
  }, []);

  const setAIResult = useCallback((url: string) => {
    setState(s => ({ ...s, aiResultUrl: url }));
  }, []);

  // ── Canvas controls ──
  const setZoom = useCallback((z: number) => {
    setState(s => ({ ...s, zoom: Math.max(0.3, Math.min(3, z)) }));
  }, []);

  const toggleGrid = useCallback(() => {
    setState(s => ({ ...s, showGrid: !s.showGrid }));
  }, []);

  const toggleComparison = useCallback(() => {
    setState(s => ({ ...s, showComparison: !s.showComparison }));
  }, []);

  // ── History ──
  const undo = useCallback(() => {
    const prev = historyRef.current.pop();
    if (!prev) return;
    redoRef.current.push(state);
    setState(prev);
  }, [state]);

  const redo = useCallback(() => {
    const next = redoRef.current.pop();
    if (!next) return;
    historyRef.current.push(state);
    setState(next);
  }, [state]);

  const reset = useCallback(() => {
    historyRef.current = [];
    redoRef.current = [];
    setState(INITIAL);
  }, []);

  const selectedLayer = state.layers.find(l => l.id === state.selectedLayerId) ?? null;
  const canUndo = historyRef.current.length > 0;
  const canRedo = redoRef.current.length > 0;

  return {
    state, selectedLayer, canUndo, canRedo,
    setBaseImage, addLayer, removeLayer, selectLayer,
    updateTransform, toggleVisible, toggleLock,
    markAIProcessed, setAIResult,
    setZoom, toggleGrid, toggleComparison,
    undo, redo, reset,
  };
}
