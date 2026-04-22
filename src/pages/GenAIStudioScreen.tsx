import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CameraSource } from '@capacitor/camera';
import { useCamera } from '@/hooks/useCamera';
import { useRnai } from '@/hooks/useRnaiPipeline';
import AIProcessingPanel from '@/components/AIProcessingPanel';
import AppIcon, { type AppIconName } from '@/components/AppIcon';
import { optimizeImageDataUrl } from '@/lib/image';
import './GenAIStudioScreen.css';

// ── Types ──────────────────────────────────────────────────────────────────────

type ActiveTab = 'clothes' | 'details';

interface ClothingItem {
  id: string;
  dataUrl: string;
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
  { label: 'บ็อบสั้น',  prompt: 'bob cut',           icon: 'scissors' as AppIconName },
  { label: 'พิกซี่',    prompt: 'pixie cut',         icon: 'hair' as AppIconName },
  { label: 'ลอนยาว',    prompt: 'long wavy hair',    icon: 'wave' as AppIconName },
  { label: 'ตรงยาว',    prompt: 'straight long hair', icon: 'ruler' as AppIconName },
  { label: 'เลเยอร์',   prompt: 'layered shag cut',  icon: 'spark' as AppIconName },
  { label: 'เปีย',      prompt: 'braids',            icon: 'braid' as AppIconName },
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
  { label: 'สร้อย',      value: 'necklace',   icon: 'necklace' as AppIconName },
  { label: 'ต่างหู',      value: 'earrings',   icon: 'earrings' as AppIconName },
  { label: 'แว่นตา',      value: 'sunglasses', icon: 'glasses' as AppIconName },
  { label: 'กำไล',       value: 'bracelet',   icon: 'bracelet' as AppIconName },
  { label: 'หมวก',        value: 'hat',        icon: 'hat' as AppIconName },
  { label: 'กระเป๋า',    value: 'handbag',    icon: 'bag' as AppIconName },
];

const SHOES = [
  { label: 'ส้นสูง',      value: 'high heels', icon: 'heels' as AppIconName },
  { label: 'แฟลต',        value: 'flat shoes', icon: 'flats' as AppIconName },
  { label: 'สนีกเกอร์',   value: 'sneakers',   icon: 'sneaker' as AppIconName },
  { label: 'บูท',         value: 'boots',      icon: 'boots' as AppIconName },
  { label: 'แตะ',         value: 'sandals',    icon: 'sandals' as AppIconName },
  { label: 'ล็อฟเฟอร์',  value: 'loafers',    icon: 'loafers' as AppIconName },
];

const MAKEUPS = [
  { label: 'Natural',    key: 'natural',   icon: 'leaf' as AppIconName },
  { label: 'Office',     key: 'office',    icon: 'briefcase' as AppIconName },
  { label: 'Glam',       key: 'glam',      icon: 'spark' as AppIconName },
  { label: 'Smoky Eye',  key: 'smoky',     icon: 'moon' as AppIconName },
  { label: 'Bold Lip',   key: 'bold_lip',  icon: 'lipstick' as AppIconName },
  { label: 'K-Beauty',   key: 'korean',    icon: 'flower' as AppIconName },
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
  const rnai = useRnai();

  // ── Handlers ──

  const handleAddItem = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || items.length >= 6) return;
    const r = new FileReader();
    r.onload = async ev => {
      const rawDataUrl = ev.target?.result as string;
      const dataUrl = await optimizeImageDataUrl(rawDataUrl, {
        maxWidth: 1024,
        maxHeight: 1024,
        quality: 0.76,
        mimeType: 'image/jpeg',
      });
      setItems(prev => [...prev, {
        id: `item-${Date.now()}`,
        dataUrl,
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
    
    // Construct a rich prompt for RNAI based on selections
    const parts = [];
    if (items.length > 0) {
      const itemDesc = items.map(it => it.category.replace('_', ' ')).join(', ');
      parts.push(`wearing ${itemDesc}`);
    }
    if (selHair) parts.push(`with ${selHair} hairstyle`);
    if (selHairColor) parts.push(`in ${selHairColor} color`);
    if (selAccessories.length > 0) parts.push(`accessorized with ${selAccessories.join(', ')}`);
    if (selShoes) parts.push(`wearing ${selShoes}`);
    if (selMakeup) parts.push(`with ${selMakeup} makeup`);
    if (customText) parts.push(customText);

    const prompt = parts.length > 0 
      ? `A professional fashion photo of this person, ${parts.join(', ')}, high quality, highly detailed, photorealistic.`
      : `A professional fashion photo of this person, high quality, photorealistic.`;

    rnai.edit(image.dataUrl, prompt);
  };

  return (
    <div className="gen-root">

      {/* ── HEADER ── */}
      <header className="gen-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="gen-title serif">Generative <em>AI Studio</em></h1>
          <span className="gen-badge">Powered by RNAI Agent</span>
        </div>
        <button className="home-notif" style={{background:'transparent', border:'none', color:'var(--text1)', fontSize:'1.2rem', padding: 0}} onClick={() => navigate('/profile')} aria-label="โปรไฟล์"><AppIcon name="profile" label="โปรไฟล์" /></button>
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
              <AppIcon name="camera" className="photo-empty-icon" label="อัปโหลดรูป" />
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
            <AppIcon name="clothes" className="tab-icon" label="เสื้อผ้า" />
            <span>เสื้อผ้า / ไอเทม</span>
            {items.length > 0 && <span className="tab-badge">{items.length}</span>}
          </button>
          <button
            className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            <AppIcon name="details" className="tab-icon" label="รายละเอียด" />
            <span>รายละเอียด</span>
            {hasAnyDetail && <span className="tab-badge tab-badge--gold"><AppIcon name="check" label="เลือกแล้ว" /></span>}
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
                  <button className="item-delete" onClick={() => removeItem(item.id)}><AppIcon name="close" label="ลบ" /></button>
                  <img src={item.dataUrl} alt="item" className="item-thumb" loading="lazy" />
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
              <div className="detail-sec-label"><AppIcon name="hair" className="detail-sec-icon" label="ทรงผม" /> ทรงผม</div>
              <div className="option-pills">
                {HAIRSTYLES.map(h => (
                  <button
                    key={h.prompt}
                    className={`pill ${selHair === h.prompt ? 'active' : ''}`}
                    onClick={() => setSelHair(selHair === h.prompt ? null : h.prompt)}
                  >
                    <AppIcon name={h.icon} className="detail-pill-icon" label={h.label} /> {h.label}
                  </button>
                ))}
              </div>
            </div>

            {/* สีผม */}
            <div className="detail-section">
              <div className="detail-sec-label"><AppIcon name="palette" className="detail-sec-icon" label="สีผม" /> สีผม</div>
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
              <div className="detail-sec-label"><AppIcon name="jewelry" className="detail-sec-icon" label="เครื่องประดับ" /> เครื่องประดับ</div>
              <div className="option-pills">
                {ACCESSORIES.map(a => (
                  <button
                    key={a.value}
                    className={`pill ${selAccessories.includes(a.value) ? 'active' : ''}`}
                    onClick={() => toggleAccessory(a.value)}
                  >
                    <AppIcon name={a.icon} className="detail-pill-icon" label={a.label} /> {a.label}
                  </button>
                ))}
              </div>
            </div>

            {/* รองเท้า */}
            <div className="detail-section">
              <div className="detail-sec-label"><AppIcon name="shoes" className="detail-sec-icon" label="รองเท้า" /> รองเท้า</div>
              <div className="option-pills">
                {SHOES.map(s => (
                  <button
                    key={s.value}
                    className={`pill ${selShoes === s.value ? 'active' : ''}`}
                    onClick={() => setSelShoes(selShoes === s.value ? null : s.value)}
                  >
                    <AppIcon name={s.icon} className="detail-pill-icon" label={s.label} /> {s.label}
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
                    <AppIcon name={m.icon} className="mk-icon" label={m.label} />
                    <span className="mk-label">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom text */}
            <div className="detail-section">
              <div className="detail-sec-label"><AppIcon name="text" className="detail-sec-icon" label="เพิ่มเติม" /> เพิ่มเติม (พิมพ์เองได้)</div>
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
          disabled={!canGenerate || rnai.state.status === 'running'}
        >
          {rnai.state.status === 'running' ? (
            <>
              <span className="gen-spinner" />
              กำลังประมวลผลด้วย RNAI...
            </>
          ) : (
            'สร้างภาพด้วย AI (RNAI)'
          )}
        </button>

        {!image && (
          <p className="gen-hint">กรุณาอัปโหลดรูปตัวเองก่อน</p>
        )}

        {/* ── RESULT PANEL ── */}
        <AIProcessingPanel
          state={{
            status: rnai.state.status,
            progress: rnai.state.status === 'running' ? 50 : (rnai.state.status === 'done' ? 100 : 0),
            message: rnai.state.status === 'running' ? 'RNAI กำลังสร้างภาพ...' : rnai.state.error || '',
            resultUrl: rnai.state.resultUrl,
            error: rnai.state.error
          }}
          beforeUrl={image?.dataUrl}
          onReset={rnai.reset}
          label="RNAI Agent · Fashion Generation"
        />

      </div>
    </div>
  );
}
