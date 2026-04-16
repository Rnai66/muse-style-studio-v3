import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CameraSource } from '@capacitor/camera';
import { useCamera } from '@/hooks/useCamera';
import { useStylePipeline, type StyleInput } from '@/hooks/useAIPipeline';
import AIProcessingPanel from '@/components/AIProcessingPanel';
import './GenAIStudioScreen.css';

// ── Types ──────────────────────────────────────────────────────────────────────

type ActiveTab = 'clothes' | 'details';

interface ClothingItem {
  id: string;
  dataUrl: string;
  base64: string;
  category: string;
}

const CLOTHING_CATEGORIES = [
  { value: 'upper_body',  label: 'เสื้อบน' },
  { value: 'lower_body',  label: 'กางเกง/กระโปรง' },
  { value: 'dresses',     label: 'ชุดเดรส' },
  { value: 'outerwear',   label: 'แจ็คเก็ต/โค้ท' },
  { value: 'accessories', label: 'เครื่องประดับ' },
  { value: 'shoes',       label: 'รองเท้า' },
];

const HAIRSTYLES = [
  { label: 'บ็อบสั้น',  prompt: 'bob cut',          icon: '✂️' },
  { label: 'พิกซี่',    prompt: 'pixie cut',         icon: '💇' },
  { label: 'ลอนยาว',   prompt: 'long wavy hair',    icon: '🌊' },
  { label: 'ตรงยาว',   prompt: 'straight long hair', icon: '📏' },
  { label: 'เลเยอร์',  prompt: 'layered shag cut',  icon: '✨' },
  { label: 'เปีย',     prompt: 'braids',             icon: '🎀' },
];

const HAIR_COLORS = [
  { label: 'ดำ',      value: 'black',            hex: '#1a1208' },
  { label: 'น้ำตาล', value: 'dark brown',        hex: '#6b3d12' },
  { label: 'บลอนด์', value: 'platinum blonde',   hex: '#e8d080' },
  { label: 'แดง',    value: 'auburn red',        hex: '#a03820' },
  { label: 'เทา',    value: 'silver gray',       hex: '#9090a0' },
  { label: 'ชมพู',   value: 'pastel pink',       hex: '#e080b0' },
];

const ACCESSORIES = [
  { label: 'สร้อย',         value: 'necklace',       icon: '📿' },
  { label: 'ต่างหู',       value: 'earrings',        icon: '💎' },
  { label: 'แว่นตา',      value: 'sunglasses',      icon: '🕶️' },
  { label: 'กำไล',         value: 'bracelet',        icon: '⌚' },
  { label: 'หมวก',         value: 'hat',             icon: '🧢' },
  { label: 'กระเป๋า',     value: 'handbag',         icon: '👜' },
];

const SHOES = [
  { label: 'ส้นสูง',       value: 'high heels',     icon: '👠' },
  { label: 'แฟลต',         value: 'flat shoes',     icon: '🥿' },
  { label: 'สนีกเกอร์',   value: 'sneakers',        icon: '👟' },
  { label: 'บูท',          value: 'boots',           icon: '👢' },
  { label: 'แตะ',          value: 'sandals',         icon: '🩴' },
  { label: 'ล็อฟเฟอร์',   value: 'loafers',         icon: '🥾' },
];

const MAKEUPS = [
  { label: 'Natural',    key: 'natural',    icon: '🌿' },
  { label: 'Office',     key: 'office',     icon: '💼' },
  { label: 'Glam',       key: 'glam',       icon: '✨' },
  { label: 'Smoky Eye',  key: 'smoky',      icon: '🌙' },
  { label: 'Bold Lip',   key: 'bold_lip',   icon: '💄' },
  { label: 'K-Beauty',   key: 'korean',     icon: '🌸' },
];

// ── Component ──────────────────────────────────────────────────────────────────

export default function GenAIStudioScreen() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ActiveTab>('clothes');
  const { image, takePhoto, clear } = useCamera();

  // Step 2 — Clothing items
  const [items, setItems] = useState<ClothingItem[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  // Step 3 — Details
  const [selHair, setSelHair]           = useState<string | null>(null);
  const [selHairColor, setSelHairColor] = useState<string | null>(null);
  const [selAccessories, setSelAccessories] = useState<string[]>([]);
  const [selShoes, setSelShoes]         = useState<string | null>(null);
  const [selMakeup, setSelMakeup]       = useState<string | null>(null);
  const [customText, setCustomText]     = useState('');

  // Pipeline
  const pipeline = useStylePipeline();

  // ── Handlers ──

  const handleAddItem = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || items.length >= 6) return;
    const r = new FileReader();
    r.onload = ev => {
      const dataUrl = ev.target?.result as string;
      const base64  = dataUrl.split(',')[1];
      setItems(prev => [...prev, {
        id: `item-${Date.now()}`,
        dataUrl,
        base64,
        category: 'upper_body',
      }]);
    };
    r.readAsDataURL(f);
    e.target.value = ''; // reset so same file can be re-added
  };

  const updateCategory = (id: string, category: string) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, category } : it));
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(it => it.id !== id));
  };

  const toggleAccessory = (val: string) => {
    setSelAccessories(prev =>
      prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
    );
  };

  const hasAnyDetail = selHair || selHairColor || selAccessories.length > 0 || selShoes || selMakeup || customText;
  const canGenerate  = !!image && (items.length > 0 || !!hasAnyDetail);

  const handleGenerate = () => {
    if (!image) return;
    const input: StyleInput = {
      personDataUrl: image.dataUrl,
      items,
      hairstyle:    selHair ?? undefined,
      hairColor:    selHairColor ?? undefined,
      accessories:  selAccessories.length > 0 ? selAccessories : undefined,
      shoes:        selShoes ?? undefined,
      makeup:       selMakeup ?? undefined,
      customText:   customText || undefined,
    };
    pipeline.generate(input);
  };

  return (
    <div className="gen-root">

      {/* ── HEADER ── */}
      <header className="gen-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="gen-title serif">Generative <em>AI Studio</em></h1>
          <span className="gen-badge">Powered by Replicate</span>
        </div>
        <button className="home-notif" style={{background:'transparent', border:'none', color:'var(--text1)', fontSize:'1.2rem', padding: 0}} onClick={() => navigate('/profile')}>◎</button>
      </header>

      <div className="gen-body">

        {/* ── STEP 1: รูปตัวเอง ── */}
        <div className="step-block">
          <div className="step-label">
            <span className="step-num">①</span> รูปของคุณ
            <span className="step-required">* บังคับ</span>
          </div>

          {image ? (
            <div className="photo-preview">
              <img src={image.dataUrl} alt="person" className="photo-img" />
              <div className="photo-overlay">
                <button onClick={() => takePhoto(CameraSource.Photos)} className="photo-btn">เปลี่ยน</button>
                <button onClick={clear} className="photo-btn danger">ลบ</button>
              </div>
            </div>
          ) : (
            <div className="photo-empty" onClick={() => takePhoto(CameraSource.Photos)}>
              <span className="photo-empty-icon">📷</span>
              <span className="photo-empty-text">แตะเพื่ออัปโหลดรูปตัวเอง</span>
              <span className="photo-empty-hint">รองรับ JPG, PNG, HEIC</span>
            </div>
          )}
        </div>

        {/* ── TABS ── */}
        <div className="tab-bar">
          <button
            className={`tab-btn ${activeTab === 'clothes' ? 'active' : ''}`}
            onClick={() => setActiveTab('clothes')}
          >
            <span className="tab-icon">👗</span>
            <span>เสื้อผ้า / ไอเทม</span>
            {items.length > 0 && <span className="tab-badge">{items.length}</span>}
          </button>
          <button
            className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            <span className="tab-icon">✦</span>
            <span>รายละเอียด</span>
            {hasAnyDetail && <span className="tab-badge tab-badge--gold">✓</span>}
          </button>
        </div>

        {/* ── TAB: เสื้อผ้า ── */}
        {activeTab === 'clothes' && (
          <div className="tab-panel">
            <div className="step-label">
              <span className="step-num">②</span> เพิ่มเสื้อผ้า / ไอเทม
              <span className="step-hint">สูงสุด 6 ชิ้น</span>
            </div>

            <div className="item-grid">
              {items.map(item => (
                <div key={item.id} className="item-card">
                  <button className="item-delete" onClick={() => removeItem(item.id)}>✕</button>
                  <img src={item.dataUrl} alt="item" className="item-thumb" />
                  <select
                    className="item-select"
                    value={item.category}
                    onChange={e => updateCategory(item.id, e.target.value)}
                  >
                    {CLOTHING_CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              ))}

              {items.length < 6 && (
                <div className="item-add-btn" onClick={() => fileRef.current?.click()}>
                  <span className="item-add-icon">+</span>
                  <span className="item-add-text">เพิ่มไอเทม</span>
                </div>
              )}
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAddItem}
            />

            {items.length === 0 && (
              <p className="empty-hint">ยังไม่มีไอเทม — แตะ + เพื่อเพิ่มเสื้อผ้าหรือเครื่องประดับ</p>
            )}
          </div>
        )}

        {/* ── TAB: รายละเอียด ── */}
        {activeTab === 'details' && (
          <div className="tab-panel">
            <div className="step-label">
              <span className="step-num">③</span> รายละเอียด
              <span className="step-hint">เลือกได้หลายอย่าง</span>
            </div>

            {/* ทรงผม */}
            <div className="detail-section">
              <div className="detail-sec-label">💇 ทรงผม</div>
              <div className="option-pills">
                {HAIRSTYLES.map(h => (
                  <button
                    key={h.prompt}
                    className={`pill ${selHair === h.prompt ? 'active' : ''}`}
                    onClick={() => setSelHair(selHair === h.prompt ? null : h.prompt)}
                  >
                    <span className="emoji-icon">{h.icon}</span> {h.label}
                  </button>
                ))}
              </div>
            </div>

            {/* สีผม */}
            <div className="detail-section">
              <div className="detail-sec-label">🎨 สีผม</div>
              <div className="color-chips">
                {HAIR_COLORS.map(c => (
                  <button
                    key={c.value}
                    className={`color-chip ${selHairColor === c.value ? 'active' : ''}`}
                    onClick={() => setSelHairColor(selHairColor === c.value ? null : c.value)}
                    title={c.label}
                  >
                    <span className="cc-dot" style={{ background: c.hex }} />
                    <span className="cc-label">{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* เครื่องประดับ */}
            <div className="detail-section">
              <div className="detail-sec-label">💍 เครื่องประดับ</div>
              <div className="option-pills">
                {ACCESSORIES.map(a => (
                  <button
                    key={a.value}
                    className={`pill ${selAccessories.includes(a.value) ? 'active' : ''}`}
                    onClick={() => toggleAccessory(a.value)}
                  >
                    <span className="emoji-icon">{a.icon}</span> {a.label}
                  </button>
                ))}
              </div>
            </div>

            {/* รองเท้า */}
            <div className="detail-section">
              <div className="detail-sec-label">👠 รองเท้า</div>
              <div className="option-pills">
                {SHOES.map(s => (
                  <button
                    key={s.value}
                    className={`pill ${selShoes === s.value ? 'active' : ''}`}
                    onClick={() => setSelShoes(selShoes === s.value ? null : s.value)}
                  >
                    <span className="emoji-icon">{s.icon}</span> {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* เมคอัพ */}
            <div className="detail-section">
              <div className="detail-sec-label">💄 เมคอัพ</div>
              <div className="makeup-grid">
                {MAKEUPS.map(m => (
                  <button
                    key={m.key}
                    className={`makeup-chip ${selMakeup === m.key ? 'active' : ''}`}
                    onClick={() => setSelMakeup(selMakeup === m.key ? null : m.key)}
                  >
                    <span className="mk-icon">{m.icon}</span>
                    <span className="mk-label">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom text */}
            <div className="detail-section">
              <div className="detail-sec-label">✏️ เพิ่มเติม (พิมพ์เองได้)</div>
              <textarea
                className="custom-textarea"
                placeholder="เช่น: ใส่สร้อยมุกยาว, สไตล์ minimalist, ธีมสี beige..."
                value={customText}
                onChange={e => setCustomText(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        )}

        {/* ── GENERATE BUTTON ── */}
        <button
          id="gen-ai-studio-generate-btn"
          className="generate-btn"
          onClick={handleGenerate}
          disabled={!canGenerate || pipeline.state.status === 'running'}
        >
          {pipeline.state.status === 'running' ? (
            <>
              <span className="gen-spinner" />
              กำลังประมวลผล... ({pipeline.state.progress}%)
            </>
          ) : (
            '✦ สร้างภาพด้วย AI'
          )}
        </button>

        {!image && (
          <p className="gen-hint">กรุณาอัปโหลดรูปตัวเองก่อน</p>
        )}

        {/* ── RESULT PANEL ── */}
        <AIProcessingPanel
          state={pipeline.state}
          beforeUrl={image?.dataUrl}
          onReset={pipeline.reset}
          label="Muse AI · Style Generation"
        />

      </div>
    </div>
  );
}
