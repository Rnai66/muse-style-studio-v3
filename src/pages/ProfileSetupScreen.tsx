import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppIcon from '@/components/AppIcon';
import AvatarSVG from '@/components/AvatarSVG';
import { useProfileStore } from '@/store/useProfileStore';
import {
  SKIN_TONES, HAIR_COLORS, HAIR_STYLE_LABELS, HAIR_LENGTH_LABELS, FACE_SHAPE_LABELS,
  BODY_TYPE_LABELS,
} from '@/types/profile';
import type { SkinTone, HairColor, HairLength, HairStyle, FaceShape } from '@/types/profile';
import './ProfileSetupScreen.css';

const STEPS = ['ชื่อ & ผิว', 'ทรงผม', 'ใบหน้า', 'ขนาดร่างกาย', 'สรุป'];

export default function ProfileSetupScreen() {
  const nav = useNavigate();
  const { profile, update, updateMeasure } = useProfileStore();
  const [step, setStep] = useState(0);

  const next = () => step < STEPS.length - 1 ? setStep(s => s + 1) : nav('/profile');
  const back = () => step > 0 ? setStep(s => s - 1) : nav('/profile');

  return (
    <div className="setup-root">
      {/* HEADER */}
      <header className="setup-header">
        <button className="setup-back" onClick={back}>←</button>
        <div className="setup-step-label">
          {STEPS[step]} <span className="step-num">{step + 1}/{STEPS.length}</span>
        </div>
        {step < STEPS.length - 1 && (
          <button className="setup-skip" onClick={next}>ข้าม</button>
        )}
      </header>

      {/* PROGRESS */}
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
      </div>

      {/* AVATAR PREVIEW (sticky) */}
      <div className="avatar-preview">
        <AvatarSVG profile={profile} width={120} />
        <div className="avatar-type">
          <span className="type-badge">{BODY_TYPE_LABELS[profile.bodyType].th}</span>
          <span className="bmi-badge">BMI {profile.bmi}</span>
        </div>
      </div>

      {/* STEP CONTENT */}
      <div className="setup-content">

        {/* ── STEP 0: Name + Skin ── */}
        {step === 0 && (
          <div className="step-panel fade-up">
            <h2 className="step-title serif">ชื่อ &amp; <em>สีผิว</em></h2>

            <label className="field-label">ชื่อโปรไฟล์</label>
            <input
              className="field-input"
              value={profile.name}
              onChange={e => update({ name: e.target.value })}
              placeholder="เช่น My Style, งานออฟฟิศ..."
            />

            <label className="field-label" style={{ marginTop: '1.5rem' }}>สีผิว</label>
            <div className="skin-grid">
              {(Object.entries(SKIN_TONES) as [SkinTone, typeof SKIN_TONES[SkinTone]][]).map(([key, val]) => (
                <button
                  key={key}
                  className={`skin-chip ${profile.skinTone === key ? 'active' : ''}`}
                  onClick={() => update({ skinTone: key })}
                >
                  <span className="skin-dot" style={{ background: val.hex, boxShadow: `0 0 0 2px ${val.shadow}` }} />
                  <span className="skin-label">{val.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 1: Hair ── */}
        {step === 1 && (
          <div className="step-panel fade-up">
            <h2 className="step-title serif">ทรงผม &amp; <em>สีผม</em></h2>

            <label className="field-label">สีผม</label>
            <div className="color-row">
              {(Object.entries(HAIR_COLORS) as [HairColor, typeof HAIR_COLORS[HairColor]][]).map(([key, val]) => (
                <button
                  key={key}
                  className={`color-chip ${profile.hairColor === key ? 'active' : ''}`}
                  onClick={() => update({ hairColor: key })}
                  title={val.label}
                >
                  <span className="color-dot" style={{ background: val.hex }} />
                  <span className="color-label">{val.label}</span>
                </button>
              ))}
            </div>

            <label className="field-label" style={{ marginTop: '1.25rem' }}>ความยาวผม</label>
            <div className="option-pills">
              {(Object.entries(HAIR_LENGTH_LABELS) as [HairLength, string][]).map(([key, lbl]) => (
                <button
                  key={key}
                  className={`pill ${profile.hairLength === key ? 'active' : ''}`}
                  onClick={() => update({ hairLength: key })}
                >{lbl}</button>
              ))}
            </div>

            <label className="field-label" style={{ marginTop: '1.25rem' }}>สไตล์ผม</label>
            <div className="option-pills">
              {(Object.entries(HAIR_STYLE_LABELS) as [HairStyle, string][]).map(([key, lbl]) => (
                <button
                  key={key}
                  className={`pill ${profile.hairStyle === key ? 'active' : ''}`}
                  onClick={() => update({ hairStyle: key })}
                >{lbl}</button>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 2: Face ── */}
        {step === 2 && (
          <div className="step-panel fade-up">
            <h2 className="step-title serif">รูปทรง<em>ใบหน้า</em></h2>
            <p className="step-desc">ข้อมูลนี้ช่วยให้ AI แนะนำทรงผมและการแต่งหน้าที่เหมาะสมที่สุด</p>
            <div className="face-grid">
              {(Object.entries(FACE_SHAPE_LABELS) as [FaceShape, string][]).map(([key, lbl]) => (
                <button
                  key={key}
                  className={`face-chip ${profile.faceShape === key ? 'active' : ''}`}
                  onClick={() => update({ faceShape: key })}
                >
                  <FaceIcon shape={key} />
                  <span>{lbl}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 3: Measurements ── */}
        {step === 3 && (
          <div className="step-panel fade-up">
            <h2 className="step-title serif">ขนาด<em>ร่างกาย</em></h2>
            <p className="step-desc">ข้อมูลส่วนตัว — เก็บในเครื่องของคุณเท่านั้น ไม่แชร์ออกไปข้างนอก</p>

            {([
              { key: 'height',   label: 'ส่วนสูง',    unit: 'cm', min: 140, max: 200, step: 1  },
              { key: 'weight',   label: 'น้ำหนัก',    unit: 'kg', min: 40,  max: 150, step: 0.5 },
              { key: 'bust',     label: 'รอบอก',      unit: 'cm', min: 70,  max: 130, step: 1  },
              { key: 'waist',    label: 'รอบเอว',     unit: 'cm', min: 55,  max: 120, step: 1  },
              { key: 'hips',     label: 'รอบสะโพก',  unit: 'cm', min: 70,  max: 140, step: 1  },
              { key: 'shoulder', label: 'ความกว้างไหล่', unit: 'cm', min: 30, max: 55, step: 0.5 },
            ] as const).map(({ key, label, unit, min, max, step: s }) => (
              <MeasureSlider
                key={key}
                label={label}
                unit={unit}
                value={profile.measurements[key]}
                min={min}
                max={max}
                step={s}
                onChange={v => updateMeasure(key, v)}
              />
            ))}
          </div>
        )}

        {/* ── STEP 4: Summary ── */}
        {step === 4 && (
          <div className="step-panel fade-up">
            <h2 className="step-title serif">โปรไฟล์<em>สมบูรณ์</em></h2>
            <div className="summary-grid">
              <SummaryRow label="ชื่อ"        value={profile.name} />
              <SummaryRow label="สีผิว"       value={SKIN_TONES[profile.skinTone].label} />
              <SummaryRow label="สีผม"        value={HAIR_COLORS[profile.hairColor].label} />
              <SummaryRow label="ทรงผม"       value={`${HAIR_LENGTH_LABELS[profile.hairLength]} · ${HAIR_STYLE_LABELS[profile.hairStyle]}`} />
              <SummaryRow label="ใบหน้า"      value={FACE_SHAPE_LABELS[profile.faceShape]} />
              <SummaryRow label="ส่วนสูง"     value={`${profile.measurements.height} cm`} />
              <SummaryRow label="น้ำหนัก"     value={`${profile.measurements.weight} kg`} />
              <SummaryRow label="รอบอก"       value={`${profile.measurements.bust} cm`} />
              <SummaryRow label="รอบเอว"      value={`${profile.measurements.waist} cm`} />
              <SummaryRow label="รอบสะโพก"   value={`${profile.measurements.hips} cm`} />
              <SummaryRow label="ไหล่"        value={`${profile.measurements.shoulder} cm`} />
              <SummaryRow label="รูปร่าง"     value={BODY_TYPE_LABELS[profile.bodyType].th} gold />
              <SummaryRow label="BMI"          value={`${profile.bmi}`} gold />
            </div>
            <div className="summary-tip">
              <AppIcon name="spark" className="tip-icon" />
              <span>{BODY_TYPE_LABELS[profile.bodyType].tip}</span>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="setup-footer">
        <button className="btn-primary full-width" onClick={next}>
          {step === STEPS.length - 1 ? 'เสร็จสิ้น' : 'ถัดไป →'}
        </button>
      </div>
    </div>
  );
}

// ── Sub-components ──

function MeasureSlider({ label, unit, value, min, max, step, onChange }: {
  label: string; unit: string; value: number;
  min: number; max: number; step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="measure-row">
      <div className="measure-top">
        <span className="measure-label">{label}</span>
        <span className="measure-val">{value} <span className="measure-unit">{unit}</span></span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="measure-slider"
      />
      <div className="measure-minmax">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, gold }: { label: string; value: string; gold?: boolean }) {
  return (
    <div className="sum-row">
      <span className="sum-label">{label}</span>
      <span className={`sum-val ${gold ? 'gold' : ''}`}>{value}</span>
    </div>
  );
}

function FaceIcon({ shape }: { shape: FaceShape }) {
  const shapes: Record<FaceShape, JSX.Element> = {
    oval:    <ellipse cx="20" cy="24" rx="12" ry="16" fill="none" stroke="currentColor" strokeWidth="1.5" />,
    round:   <circle cx="20" cy="24" r="14" fill="none" stroke="currentColor" strokeWidth="1.5" />,
    square:  <rect x="8" y="10" width="24" height="28" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5" />,
    heart:   <path d="M20 36 C12 28 6 22 6 16 A8 8 0 0 1 20 12 A8 8 0 0 1 34 16 C34 22 28 28 20 36Z" fill="none" stroke="currentColor" strokeWidth="1.5" />,
    diamond: <polygon points="20,8 34,24 20,40 6,24" fill="none" stroke="currentColor" strokeWidth="1.5" />,
    oblong:  <ellipse cx="20" cy="24" rx="10" ry="18" fill="none" stroke="currentColor" strokeWidth="1.5" />,
  };
  return <svg viewBox="0 0 40 48" width="36" height="44">{shapes[shape]}</svg>;
}
