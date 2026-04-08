// ── User Body Profile Types ──

export type SkinTone =
  | 'ivory'
  | 'fair'
  | 'light'
  | 'medium'
  | 'tan'
  | 'deep'
  | 'dark';

export type HairColor =
  | 'black'
  | 'darkbrown'
  | 'brown'
  | 'lightbrown'
  | 'blonde'
  | 'red'
  | 'gray'
  | 'white'
  | 'colored';

export type HairLength = 'bald' | 'short' | 'ear' | 'shoulder' | 'long' | 'verylong';

export type HairStyle =
  | 'straight'
  | 'wavy'
  | 'curly'
  | 'afro'
  | 'ponytail'
  | 'bun'
  | 'braids'
  | 'updo';

export type FaceShape =
  | 'oval'
  | 'round'
  | 'square'
  | 'heart'
  | 'diamond'
  | 'oblong';

export type BodyType =
  | 'hourglass'
  | 'pear'
  | 'apple'
  | 'rectangle'
  | 'inverted';

export interface BodyMeasurements {
  height: number;       // cm  (140–200)
  weight: number;       // kg  (40–150)
  bust: number;         // cm  (70–130)
  waist: number;        // cm  (55–120)
  hips: number;         // cm  (80–140)
  shoulder: number;     // cm  (35–55)
}

export interface UserProfile {
  id: string;
  name: string;
  // Appearance
  skinTone: SkinTone;
  hairColor: HairColor;
  hairLength: HairLength;
  hairStyle: HairStyle;
  faceShape: FaceShape;
  // Measurements
  measurements: BodyMeasurements;
  // Computed
  bodyType: BodyType;
  bmi: number;
  // AI-generated portrait
  avatarUrl?: string;
  // Meta
  createdAt: string;
  updatedAt: string;
}

// Skin tone hex values
export const SKIN_TONES: Record<SkinTone, { hex: string; shadow: string; label: string }> = {
  ivory:  { hex: '#FFECD9', shadow: '#E8C8A0', label: 'Ivory' },
  fair:   { hex: '#F5D5B5', shadow: '#D4A870', label: 'Fair' },
  light:  { hex: '#E8BE95', shadow: '#C49060', label: 'Light' },
  medium: { hex: '#C8955A', shadow: '#A06D38', label: 'Medium' },
  tan:    { hex: '#B07840', shadow: '#8A5820', label: 'Tan' },
  deep:   { hex: '#8B5A2B', shadow: '#6B3D15', label: 'Deep' },
  dark:   { hex: '#5C3318', shadow: '#3D1E08', label: 'Dark' },
};

export const HAIR_COLORS: Record<HairColor, { hex: string; label: string }> = {
  black:      { hex: '#1a1208', label: 'ดำ' },
  darkbrown:  { hex: '#3d2008', label: 'น้ำตาลเข้ม' },
  brown:      { hex: '#6b3d12', label: 'น้ำตาล' },
  lightbrown: { hex: '#a0622a', label: 'น้ำตาลอ่อน' },
  blonde:     { hex: '#d4aa55', label: 'บลอนด์' },
  red:        { hex: '#a03820', label: 'แดง' },
  gray:       { hex: '#9090a0', label: 'เทา' },
  white:      { hex: '#e8e8f0', label: 'ขาว' },
  colored:    { hex: '#6040c0', label: 'สีสัน' },
};

export const HAIR_STYLE_LABELS: Record<HairStyle, string> = {
  straight: 'ตรง', wavy: 'ลอน', curly: 'หยิก',
  afro: 'อาฟโร', ponytail: 'หางม้า', bun: 'มวยผม',
  braids: 'เปีย', updo: 'อัพดู',
};

export const HAIR_LENGTH_LABELS: Record<HairLength, string> = {
  bald: 'โกน', short: 'สั้น', ear: 'เหนือหู',
  shoulder: 'ระดับไหล่', long: 'ยาว', verylong: 'ยาวมาก',
};

export const FACE_SHAPE_LABELS: Record<FaceShape, string> = {
  oval: 'รูปไข่', round: 'กลม', square: 'เหลี่ยม',
  heart: 'หัวใจ', diamond: 'เพชร', oblong: 'ยาว',
};

// Helper: compute body type from measurements
export function computeBodyType(m: BodyMeasurements): BodyType {
  const { bust, waist, hips, shoulder } = m;
  const waistToBust = waist / bust;
  const waistToHip  = waist / hips;
  if (waistToBust < 0.75 && waistToHip < 0.75) return 'hourglass';
  if (hips > bust + 3.6 && waistToHip < 0.8)    return 'pear';
  if (bust > hips + 3.6 || shoulder > hips + 4)  return 'inverted';
  if (waistToBust > 0.8 && waistToHip > 0.85)    return 'apple';
  return 'rectangle';
}

export function computeBMI(weight: number, height: number): number {
  return Math.round((weight / Math.pow(height / 100, 2)) * 10) / 10;
}

export const BODY_TYPE_LABELS: Record<BodyType, { th: string; tip: string }> = {
  hourglass:  { th: 'นาฬิกาทราย',   tip: 'ไหล่และสะโพกกว้างพอๆกัน เอวเล็ก' },
  pear:       { th: 'ลูกแพร์',      tip: 'สะโพกกว้างกว่าไหล่ เน้นส่วนล่าง' },
  apple:      { th: 'แอปเปิ้ล',    tip: 'หน้าอกและเอวใหญ่ สะโพกเล็กกว่า' },
  rectangle:  { th: 'สี่เหลี่ยม',  tip: 'ไหล่ เอว สะโพก ใกล้เคียงกัน' },
  inverted:   { th: 'สามเหลี่ยมกลับ', tip: 'ไหล่กว้าง สะโพกแคบ' },
};
