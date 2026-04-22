import { useState } from 'react';
import AppIcon, { type AppIconName } from '@/components/AppIcon';
import AvatarSVG from '@/components/AvatarSVG';
import { useProfileStore } from '@/store/useProfileStore';
import { useAIStylist } from '@/hooks/useAIStylist';
import { BODY_TYPE_LABELS } from '@/types/profile';
import './DressingRoomScreen.css';

// Outfit items catalog
interface Item {
  id: string; name: string; price: string;
  category: 'top' | 'bottom' | 'dress' | 'shoes' | 'bag' | 'accessory';
  color: string; icon: AppIconName;
}

const CATALOG: Item[] = [
  // Tops
  { id:'t1', name:'Silk Blouse', price:'฿1,490', category:'top', color:'#e8d5b5', icon:'top' },
  { id:'t2', name:'Blazer ดำ',   price:'฿2,150', category:'top', color:'#2a2828', icon:'outerwear' },
  { id:'t3', name:'Crop Top',    price:'฿790',   category:'top', color:'#c9a96e', icon:'top' },
  { id:'t4', name:'Knit Top',    price:'฿1,090', category:'top', color:'#8a9fc0', icon:'top' },
  // Bottoms
  { id:'b1', name:'Midi Skirt',  price:'฿1,290', category:'bottom', color:'#c8a878', icon:'bottom' },
  { id:'b2', name:'Wide Pants',  price:'฿1,590', category:'bottom', color:'#505870', icon:'bottom' },
  { id:'b3', name:'Mini Skirt',  price:'฿890',   category:'bottom', color:'#d4827a', icon:'bottom' },
  // Dresses
  { id:'d1', name:'Wrap Dress',  price:'฿1,890', category:'dress', color:'#7a9f78', icon:'dress' },
  { id:'d2', name:'Slip Dress',  price:'฿2,290', category:'dress', color:'#c0a870', icon:'dress' },
  { id:'d3', name:'Maxi Dress',  price:'฿2,590', category:'dress', color:'#8870c0', icon:'dress' },
  // Shoes
  { id:'s1', name:'Block Heels', price:'฿1,890', category:'shoes', color:'#2a1a10', icon:'heels' },
  { id:'s2', name:'White Sneakers', price:'฿2,490', category:'shoes', color:'#e8e8e0', icon:'sneaker' },
  { id:'s3', name:'Loafers',     price:'฿1,690', category:'shoes', color:'#5a3820', icon:'loafers' },
];

const CATS = [
  { key: 'all',       label: 'ทั้งหมด' },
  { key: 'top',       label: 'เสื้อ' },
  { key: 'bottom',    label: 'กางเกง/กระโปรง' },
  { key: 'dress',     label: 'ชุดเดรส' },
  { key: 'shoes',     label: 'รองเท้า' },
];

export default function DressingRoomScreen() {
  const { profile } = useProfileStore();
  const { send, loading } = useAIStylist();
  const [outfit, setOutfit] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Record<string, Item>>({});
  const [cat, setCat] = useState('all');
  const [aiTip, setAiTip] = useState('');

  const toggleItem = (item: Item) => {
    const isOn = !!selected[item.id];
    if (isOn) {
      const next = { ...selected };
      delete next[item.id];
      setSelected(next);
      // remove from outfit
      const o = { ...outfit };
      delete (o as Record<string, string | undefined>)[item.category];
      setOutfit(o);
    } else {
      // deselect same category first
      const next: Record<string, Item> = {};
      Object.values(selected).forEach(s => { if (s.category !== item.category) next[s.id] = s; });
      next[item.id] = item;
      setSelected(next);
      setOutfit(prev => ({ ...prev, [item.category]: item.color }));
    }
  };

  const getAIAdvice = async () => {
    const worn = Object.values(selected).map(i => i.name).join(', ');
    if (!worn) return;
    const bodyType = BODY_TYPE_LABELS[profile.bodyType].th;
    const prompt = `ฉันมีรูปร่างแบบ${bodyType} สีผิว ${profile.skinTone} กำลังใส่: ${worn} — แนะนำว่าลุคนี้เหมาะสมไหม และควรปรับอะไรเพิ่มเพื่อให้เข้ากับรูปร่างฉันมากขึ้น?`;
    const reply = await send(prompt);
    if (typeof reply === 'string') setAiTip(reply);
  };

  const clearOutfit = () => { setOutfit({}); setSelected({}); setAiTip(''); };

  const filtered = cat === 'all' ? CATALOG : CATALOG.filter(i => i.category === cat);

  return (
    <div className="room-root">
      <header className="room-header">
        <h1 className="room-title serif">ห้อง<em>แต่งตัว</em></h1>
        <div className="room-info">
          <span className="room-badge">{BODY_TYPE_LABELS[profile.bodyType].th}</span>
        </div>
      </header>

      <div className="room-body">
        {/* AVATAR PANEL */}
        <div className="avatar-panel">
          <div className="avatar-stage">
            <AvatarSVG profile={profile} width={180} />
          </div>

          <div className="worn-list">
            {Object.values(selected).length === 0
              ? <p className="worn-empty">เลือกไอเทมจากด้านขวา →</p>
              : Object.values(selected).map(i => (
                  <div key={i.id} className="worn-chip">
                    <AppIcon name={i.icon} />
                    <span className="worn-name">{i.name}</span>
                    <button className="worn-rm" onClick={() => toggleItem(i)}>×</button>
                  </div>
                ))
            }
          </div>

          <div className="avatar-actions">
            {Object.values(selected).length > 0 && (
              <>
                <button className="av-btn" onClick={clearOutfit}>รีเซต</button>
                <button className="av-btn gold" onClick={getAIAdvice} disabled={loading}>
                  {loading ? '...' : 'ขอคำแนะนำ'}
                </button>
              </>
            )}
          </div>

          {aiTip && (
            <div className="ai-tip-box">
              <div className="ai-tip-label">MUSE AI</div>
              <p className="ai-tip-text">{aiTip}</p>
            </div>
          )}
        </div>

        {/* CATALOG PANEL */}
        <div className="catalog-panel">
          {/* Category filter */}
          <div className="cat-scroll">
            {CATS.map(c => (
              <button
                key={c.key}
                className={`cat-btn ${cat === c.key ? 'active' : ''}`}
                onClick={() => setCat(c.key)}
              >{c.label}</button>
            ))}
          </div>

          {/* Items */}
          <div className="items-list">
            {filtered.map(item => {
              const isOn = !!selected[item.id];
              return (
                <div
                  key={item.id}
                  className={`item-row ${isOn ? 'selected' : ''}`}
                  onClick={() => toggleItem(item)}
                >
                  <div className="item-swatch" style={{ background: item.color }}>
                    <AppIcon name={item.icon} />
                  </div>
                  <div className="item-info">
                    <div className="item-name">{item.name}</div>
                    <div className="item-price">{item.price}</div>
                  </div>
                  <div className={`item-check ${isOn ? 'on' : ''}`}>
                    {isOn ? <AppIcon name="check" /> : '+'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
