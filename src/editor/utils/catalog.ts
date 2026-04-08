import type { CatalogItem } from '../types';

export const CATALOG: CatalogItem[] = [
  // ── TOPS ──
  { id:'t1', name:'ซิลค์บลาวส์', nameEn:'Silk Blouse', category:'top',
    previewUrl:'👚', color:'#e8d5b5', price:'฿1,490',
    tags:['formal','office','elegant'], aiPrompt:'elegant silk blouse', replicateCategory:'upper_body' },
  { id:'t2', name:'โอเวอร์ไซส์เบลเซอร์', nameEn:'Oversized Blazer', category:'top',
    previewUrl:'🧥', color:'#2a2828', price:'฿2,150',
    tags:['office','formal','chic'], aiPrompt:'black oversized blazer', replicateCategory:'upper_body' },
  { id:'t3', name:'ครอปท็อปผ้าลินิน', nameEn:'Linen Crop Top', category:'top',
    previewUrl:'👕', color:'#f0e8d8', price:'฿790',
    tags:['casual','summer'], aiPrompt:'white linen crop top', replicateCategory:'upper_body' },
  { id:'t4', name:'เสื้อนิตสีน้ำเงิน', nameEn:'Navy Knit Top', category:'top',
    previewUrl:'🧶', color:'#2a3a5a', price:'฿1,090',
    tags:['casual','cozy'], aiPrompt:'navy blue knit sweater top', replicateCategory:'upper_body' },
  { id:'t5', name:'คอร์เซตท็อป', nameEn:'Corset Top', category:'top',
    previewUrl:'👗', color:'#c9a96e', price:'฿1,290',
    tags:['evening','glam'], aiPrompt:'gold satin corset top', replicateCategory:'upper_body' },

  // ── BOTTOMS ──
  { id:'b1', name:'มิดิสเกิร์ตผ้าลินิน', nameEn:'Linen Midi Skirt', category:'bottom',
    previewUrl:'👗', color:'#c8a878', price:'฿1,290',
    tags:['casual','office'], aiPrompt:'beige linen midi skirt', replicateCategory:'lower_body' },
  { id:'b2', name:'ไวด์เลกแพนต์', nameEn:'Wide Leg Pants', category:'bottom',
    previewUrl:'👖', color:'#505870', price:'฿1,590',
    tags:['office','chic'], aiPrompt:'slate wide leg trousers', replicateCategory:'lower_body' },
  { id:'b3', name:'มินิสเกิร์ตหนัง', nameEn:'Leather Mini Skirt', category:'bottom',
    previewUrl:'🩱', color:'#1a1a1a', price:'฿1,890',
    tags:['evening','edgy'], aiPrompt:'black leather mini skirt', replicateCategory:'lower_body' },
  { id:'b4', name:'ผ้าซิ่นไทย', nameEn:'Thai Silk Sarong', category:'bottom',
    previewUrl:'🎎', color:'#8B4513', price:'฿2,500',
    tags:['formal','traditional'], aiPrompt:'thai silk sarong skirt', replicateCategory:'lower_body' },

  // ── DRESSES ──
  { id:'d1', name:'แรปเดรสผ้าลินิน', nameEn:'Linen Wrap Dress', category:'dress',
    previewUrl:'👗', color:'#7a9f78', price:'฿1,890',
    tags:['casual','feminine'], aiPrompt:'sage green linen wrap dress', replicateCategory:'dresses' },
  { id:'d2', name:'สลิปเดรสซาติน', nameEn:'Satin Slip Dress', category:'dress',
    previewUrl:'✨', color:'#c0a870', price:'฿2,290',
    tags:['evening','glam'], aiPrompt:'champagne satin slip dress', replicateCategory:'dresses' },
  { id:'d3', name:'แม็กซี่เดรสดอกไม้', nameEn:'Floral Maxi Dress', category:'dress',
    previewUrl:'🌸', color:'#e8a0b8', price:'฿1,690',
    tags:['casual','summer','romantic'], aiPrompt:'floral print maxi dress', replicateCategory:'dresses' },
  { id:'d4', name:'ชุดราตรีพลีท', nameEn:'Pleated Evening Gown', category:'dress',
    previewUrl:'👑', color:'#2a1a4a', price:'฿4,900',
    tags:['formal','gala','wedding'], aiPrompt:'navy pleated evening gown', replicateCategory:'dresses' },
  { id:'d5', name:'ชุดเดรสคอเต่า', nameEn:'Turtleneck Dress', category:'dress',
    previewUrl:'🖤', color:'#1a1a1a', price:'฿1,490',
    tags:['office','minimal'], aiPrompt:'black turtleneck midi dress', replicateCategory:'dresses' },

  // ── HAIR ──
  { id:'h1', name:'บ็อบสั้น', nameEn:'Bob Cut', category:'hair',
    previewUrl:'💇', color:'#1a1208', price:'Free',
    tags:['short','chic'], aiPrompt:'sleek bob haircut', replicateCategory:'hair' },
  { id:'h2', name:'ลอนยาว', nameEn:'Long Waves', category:'hair',
    previewUrl:'🌊', color:'#6b3d12', price:'Free',
    tags:['long','romantic'], aiPrompt:'long wavy hair', replicateCategory:'hair' },
  { id:'h3', name:'ตรงยาว', nameEn:'Straight Long', category:'hair',
    previewUrl:'📏', color:'#1a1208', price:'Free',
    tags:['long','classic'], aiPrompt:'straight long hair', replicateCategory:'hair' },
  { id:'h4', name:'พิกซี่คัต', nameEn:'Pixie Cut', category:'hair',
    previewUrl:'✂️', color:'#3d2008', price:'Free',
    tags:['short','bold'], aiPrompt:'pixie cut hairstyle', replicateCategory:'hair' },
  { id:'h5', name:'บลอนด์ลอน', nameEn:'Blonde Waves', category:'hair',
    previewUrl:'🔆', color:'#d4aa55', price:'Free',
    tags:['blonde','waves'], aiPrompt:'long blonde wavy hair', replicateCategory:'hair' },
  { id:'h6', name:'มวยผมสูง', nameEn:'High Bun', category:'hair',
    previewUrl:'🎀', color:'#1a1208', price:'Free',
    tags:['updo','elegant'], aiPrompt:'elegant high bun hairstyle', replicateCategory:'hair' },

  // ── SHOES ──
  { id:'s1', name:'บล็อคฮีล', nameEn:'Block Heels', category:'shoes',
    previewUrl:'👠', color:'#2a1a10', price:'฿1,890',
    tags:['office','formal'], aiPrompt:'brown leather block heels', replicateCategory:'shoes' },
  { id:'s2', name:'สนีกเกอร์ขาว', nameEn:'White Sneakers', category:'shoes',
    previewUrl:'👟', color:'#f0f0f0', price:'฿2,490',
    tags:['casual','sport'], aiPrompt:'white sneakers', replicateCategory:'shoes' },
  { id:'s3', name:'โลฟเฟอร์', nameEn:'Loafers', category:'shoes',
    previewUrl:'🥿', color:'#5a3820', price:'฿1,690',
    tags:['office','casual'], aiPrompt:'leather loafers', replicateCategory:'shoes' },
  { id:'s4', name:'แซนดัลส้น', nameEn:'Heeled Sandals', category:'shoes',
    previewUrl:'🩴', color:'#c8a060', price:'฿1,490',
    tags:['summer','casual'], aiPrompt:'gold heeled sandals', replicateCategory:'shoes' },

  // ── BAGS ──
  { id:'bg1', name:'มินิแบกหนัง', nameEn:'Mini Leather Bag', category:'bag',
    previewUrl:'👜', color:'#3a1a0a', price:'฿3,400',
    tags:['evening','luxury'], aiPrompt:'small leather handbag', replicateCategory:'bag' },
  { id:'bg2', name:'โท้ตแคนวาส', nameEn:'Canvas Tote', category:'bag',
    previewUrl:'🛍️', color:'#e8e0d0', price:'฿890',
    tags:['casual','everyday'], aiPrompt:'canvas tote bag', replicateCategory:'bag' },

  // ── OUTERWEAR ──
  { id:'o1', name:'เทรนช์โค้ต', nameEn:'Trench Coat', category:'outerwear',
    previewUrl:'🧥', color:'#c8a060', price:'฿3,900',
    tags:['formal','classic'], aiPrompt:'beige trench coat', replicateCategory:'upper_body' },
  { id:'o2', name:'เดนิมแจ็กเก็ต', nameEn:'Denim Jacket', category:'outerwear',
    previewUrl:'👕', color:'#4a6080', price:'฿1,890',
    tags:['casual','cool'], aiPrompt:'classic denim jacket', replicateCategory:'upper_body' },
];

export const CATALOG_BY_CATEGORY = CATALOG.reduce((acc, item) => {
  if (!acc[item.category]) acc[item.category] = [];
  acc[item.category].push(item);
  return acc;
}, {} as Record<string, CatalogItem[]>);
