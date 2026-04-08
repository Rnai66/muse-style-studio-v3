import type { Transform } from '../types';
import './TransformPanel.css';

interface Props {
  transform: Transform;
  onChange: (patch: Partial<Transform>) => void;
}

export default function TransformPanel({ transform, onChange }: Props) {
  const t = transform;

  const bodyW  = Math.round(t.scaleX * 100);
  const bodyH  = Math.round(t.scaleY * 100);

  // Silhouette visual feedback
  const silW = Math.max(18, Math.min(60, 30 * (t.scaleX ?? 1)));
  const silH = Math.max(30, Math.min(80, 56 * (t.scaleY ?? 1)));

  return (
    <div className="tp-root">
      <div className="tp-title">ปรับแต่ง Layer</div>

      {/* ── Body proportions ── */}
      <div className="tp-section-label">📐 สัดส่วนร่างกาย</div>

      {/* Silhouette preview */}
      <div className="tp-silhouette-wrap">
        <div
          className="tp-silhouette"
          style={{ width: silW, height: silH }}
          title={`อ้วน/ผอม: ${bodyW}%  สูง/ต่ำ: ${bodyH}%`}
        />
        <div className="tp-sil-labels">
          <span>{bodyW < 100 ? '← ผอม' : bodyW > 100 ? 'อ้วน →' : 'กลาง'}</span>
          <span>{bodyH < 100 ? '↓ ต่ำ' : bodyH > 100 ? 'สูง ↑' : 'กลาง'}</span>
        </div>
      </div>

      <SliderRow
        label="อ้วน / ผอม"
        value={bodyW}
        min={50} max={200} unit="%"
        accentColor="var(--accent, #c084fc)"
        onChange={v => onChange({ scaleX: v / 100 })}
      />
      <SliderRow
        label="สูง / ต่ำ"
        value={bodyH}
        min={50} max={200} unit="%"
        accentColor="var(--gold, #f8c853)"
        onChange={v => onChange({ scaleY: v / 100 })}
      />

      <button
        className="tp-toggle"
        style={{ width: '100%', marginBottom: '.5rem' }}
        onClick={() => onChange({ scaleX: 1, scaleY: 1 })}
      >
        ↺ รีเซตสัดส่วน
      </button>

      {/* ── General transforms ── */}
      <div className="tp-section-label" style={{ marginTop: '.5rem' }}>⚙ ทั่วไป</div>

      <SliderRow
        label="ขนาด"
        value={Math.round(t.scale * 100)}
        min={10} max={300} unit="%"
        accentColor="var(--gold, #f8c853)"
        onChange={v => onChange({ scale: v / 100 })}
      />
      <SliderRow
        label="หมุน"
        value={Math.round(t.rotation)}
        min={-180} max={180} unit="°"
        accentColor="var(--gold, #f8c853)"
        onChange={v => onChange({ rotation: v })}
      />
      <SliderRow
        label="โปร่งใส"
        value={Math.round(t.opacity * 100)}
        min={0} max={100} unit="%"
        accentColor="var(--gold, #f8c853)"
        onChange={v => onChange({ opacity: v / 100 })}
      />

      <div className="tp-row">
        <span className="tp-label">X</span>
        <input
          type="number" className="tp-num"
          value={Math.round(t.x)}
          onChange={e => onChange({ x: Number(e.target.value) })}
        />
        <span className="tp-label">Y</span>
        <input
          type="number" className="tp-num"
          value={Math.round(t.y)}
          onChange={e => onChange({ y: Number(e.target.value) })}
        />
      </div>

      <div className="tp-toggle-row">
        <button
          className={`tp-toggle ${t.flipX ? 'active' : ''}`}
          onClick={() => onChange({ flipX: !t.flipX })}
        >↔ กลับสาย</button>
        <button
          className="tp-toggle"
          onClick={() => onChange({ x: 0, y: 0, scale: 1, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1, flipX: false })}
        >↺ รีเซตทั้งหมด</button>
      </div>
    </div>
  );
}

function SliderRow({ label, value, min, max, unit, accentColor, onChange }: {
  label: string; value: number; min: number; max: number; unit: string;
  accentColor?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="tp-slider-row">
      <span className="tp-label">{label}</span>
      <input
        type="range" min={min} max={max} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="tp-slider"
        style={{ '--slider-accent': accentColor } as React.CSSProperties}
      />
      <span className="tp-val" style={{ color: accentColor }}>{value}{unit}</span>
    </div>
  );
}
