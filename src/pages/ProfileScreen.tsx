import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import AvatarDisplay from '@/components/AvatarDisplay';
import { useProfileStore } from '@/store/useProfileStore';
import {
  SKIN_TONES, HAIR_COLORS, HAIR_LENGTH_LABELS,
  HAIR_STYLE_LABELS, FACE_SHAPE_LABELS, BODY_TYPE_LABELS,
} from '@/types/profile';
import './ProfileScreen.css';

export default function ProfileScreen() {
  const nav = useNavigate();
  const [user] = useAuthState(auth);
  const { profile, update, reset } = useProfileStore();

  const handleLogout = async () => {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการออกจากระบบ?')) {
      await auth.signOut();
      nav('/login');
    }
  };

  return (
    <div className="prof-page">
      <div className="prof-hero">
        <div className="prof-avatar-wrap">
          <AvatarDisplay
            profile={profile}
            width={140}
            onAvatarGenerated={url => update({ avatarUrl: url })}
          />
        </div>
        <div className="prof-hero-info">
          <h1 className="prof-name">{user?.displayName || profile.name}</h1>
          <div style={{color: 'var(--text2)', fontSize: '0.85rem', marginBottom: '0.5rem'}}>{user?.email}</div>
          <span className="prof-type-badge">{BODY_TYPE_LABELS[profile.bodyType].th}</span>
          <p className="prof-type-tip">{BODY_TYPE_LABELS[profile.bodyType].tip}</p>
          <button className="btn-primary prof-edit-btn" onClick={() => nav('/profile/setup')}>
            ✏️ แก้ไขโปรไฟล์
          </button>
        </div>
      </div>

      <div className="prof-stats">
        <div className="ps-card"><span className="ps-v">{profile.measurements.height}</span><span className="ps-l">ส่วนสูง cm</span></div>
        <div className="ps-card"><span className="ps-v">{profile.measurements.weight}</span><span className="ps-l">น้ำหนัก kg</span></div>
        <div className="ps-card"><span className="ps-v">{profile.bmi}</span><span className="ps-l">BMI</span></div>
      </div>

      <section className="prof-section">
        <div className="prof-sec-title">ลักษณะภายนอก</div>
        <div className="prof-detail-grid">
          <DetailChip label="สีผิว" value={SKIN_TONES[profile.skinTone].label} dot={SKIN_TONES[profile.skinTone].hex} />
          <DetailChip label="สีผม"  value={HAIR_COLORS[profile.hairColor].label} dot={HAIR_COLORS[profile.hairColor].hex} />
          <DetailChip label="ความยาวผม" value={HAIR_LENGTH_LABELS[profile.hairLength]} />
          <DetailChip label="สไตล์ผม"  value={HAIR_STYLE_LABELS[profile.hairStyle]} />
          <DetailChip label="ใบหน้า"    value={FACE_SHAPE_LABELS[profile.faceShape]} />
        </div>
      </section>

      <section className="prof-section">
        <div className="prof-sec-title">ขนาดร่างกาย</div>
        <div className="measure-bars">
          {([
            { label:'รอบอก', key:'bust', max:130 },
            { label:'รอบเอว', key:'waist', max:120 },
            { label:'รอบสะโพก', key:'hips', max:140 },
            { label:'ความกว้างไหล่', key:'shoulder', max:55 },
          ] as const).map(({ label, key, max }) => (
            <MeasureBar key={key} label={label} value={profile.measurements[key]} max={max} unit="cm" />
          ))}
        </div>
      </section>

      <section className="prof-section">
        <button className="prof-action-row" onClick={() => nav('/room')}>
          <span>👗 ห้องแต่งตัว Virtual</span><span className="prof-arrow">→</span>
        </button>
        <button className="prof-action-row" onClick={() => nav('/studio')}>
          <span>✦ ปรึกษา AI Stylist</span><span className="prof-arrow">→</span>
        </button>
        <button className="prof-action-row danger" onClick={handleLogout}>
          <span>👋 ออกจากระบบ</span><span className="prof-arrow">→</span>
        </button>
      </section>
    </div>
  );
}

function DetailChip({ label, value, dot }: { label: string; value: string; dot?: string }) {
  return (
    <div className="detail-chip">
      {dot && <span className="detail-dot" style={{ background: dot }} />}
      <div>
        <div className="detail-label">{label}</div>
        <div className="detail-val">{value}</div>
      </div>
    </div>
  );
}

function MeasureBar({ label, value, max, unit }: { label: string; value: number; max: number; unit: string }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="mbar">
      <div className="mbar-top">
        <span className="mbar-label">{label}</span>
        <span className="mbar-val">{value} {unit}</span>
      </div>
      <div className="mbar-track">
        <div className="mbar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
