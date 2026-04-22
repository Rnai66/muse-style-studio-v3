// ── MUSE Image Editor — Core Types ──

import type { AppIconName } from '@/components/AppIcon';

export type LayerCategory =
  | 'base'         // original person photo
  | 'top'          // เสื้อ
  | 'bottom'       // กางเกง / กระโปรง
  | 'dress'        // ชุดเดรส (replaces top+bottom)
  | 'hair'         // ทรงผม
  | 'shoes'        // รองเท้า
  | 'bag'          // กระเป๋า
  | 'hat'          // หมวก
  | 'glasses'      // แว่นตา
  | 'jewelry'      // เครื่องประดับ
  | 'outerwear';   // เสื้อคลุม

export interface Transform {
  x: number;        // position
  y: number;
  scale: number;    // 1.0 = original size (uniform)
  scaleX: number;   // width multiplier: <1 = ผอม, >1 = อ้วน
  scaleY: number;   // height multiplier: <1 = ต่ำ, >1 = สูง
  rotation: number; // degrees
  opacity: number;  // 0-1
  flipX: boolean;
}

export interface Layer {
  id: string;
  category: LayerCategory;
  name: string;
  imageUrl: string;      // URL or base64
  transform: Transform;
  visible: boolean;
  locked: boolean;
  aiProcessed: boolean;  // true = already run through AI pipeline
}

export interface EditorState {
  baseImage: string | null;      // original person photo (base64)
  baseImageSize: { w: number; h: number };
  layers: Layer[];
  selectedLayerId: string | null;
  canvasW: number;
  canvasH: number;
  zoom: number;
  showGrid: boolean;
  showComparison: boolean;
  aiResultUrl: string | null;    // final AI-generated image
}

export interface CatalogItem {
  id: string;
  name: string;
  nameEn: string;
  category: LayerCategory;
  previewUrl: string;     // image URL or icon token
  previewIcon?: AppIconName;
  color: string;          // hex for swatch
  price: string;
  tags: string[];
  aiPrompt: string;       // prompt to send to Replicate
  replicateCategory: string; // 'upper_body' | 'lower_body' | 'dresses'
}

export const DEFAULT_TRANSFORM: Transform = {
  x: 0, y: 0, scale: 1, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1, flipX: false,
};

export const CATEGORY_META: Record<LayerCategory, { label: string; icon: AppIconName; aiSupported: boolean }> = {
  base:      { label: 'รูปต้นฉบับ',   icon: 'avatar', aiSupported: false },
  top:       { label: 'เสื้อ',         icon: 'top', aiSupported: true  },
  bottom:    { label: 'กางเกง/กระโปรง', icon: 'bottom', aiSupported: true  },
  dress:     { label: 'ชุดเดรส',       icon: 'dress', aiSupported: true  },
  hair:      { label: 'ทรงผม',         icon: 'hair', aiSupported: true  },
  shoes:     { label: 'รองเท้า',       icon: 'shoes', aiSupported: true  },
  bag:       { label: 'กระเป๋า',       icon: 'bag', aiSupported: false },
  hat:       { label: 'หมวก',          icon: 'hat', aiSupported: false },
  glasses:   { label: 'แว่นตา',        icon: 'glasses', aiSupported: false },
  jewelry:   { label: 'เครื่องประดับ', icon: 'jewelry', aiSupported: false },
  outerwear: { label: 'เสื้อคลุม',    icon: 'outerwear', aiSupported: true  },
};

export const LAYER_ORDER: LayerCategory[] = [
  'base', 'hair', 'top', 'bottom', 'dress', 'outerwear',
  'shoes', 'bag', 'hat', 'glasses', 'jewelry',
];
