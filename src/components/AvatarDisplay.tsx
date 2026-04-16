/**
 * AvatarDisplay
 * Shows the AI-generated photorealistic portrait when available,
 * falling back to the SVG avatar. Includes a "Generate" button.
 */
import { useState } from 'react';
import type { UserProfile } from '@/types/profile';
import { useAvatarGen } from '@/hooks/useAvatarGen';
import AvatarSVG from '@/components/AvatarSVG';
import { EMOJI } from '@/lib/emojis';
import EmojiIcon from '@/components/EmojiIcon';
import './AvatarDisplay.css';

interface Props {
  profile: UserProfile;
  width?: number;
  onAvatarGenerated?: (url: string) => void;
}

export default function AvatarDisplay({ profile, width = 140, onAvatarGenerated }: Props) {
  const { generate, loading, error } = useAvatarGen();
  const [localUrl, setLocalUrl]      = useState<string | null>(profile.avatarUrl ?? null);
  const [showPrompt, setShowPrompt]  = useState(false);
  const [lastPrompt, setLastPrompt]  = useState('');

  const handleGenerate = async () => {
    const url = await generate(profile);
    if (url) {
      setLocalUrl(url);
      onAvatarGenerated?.(url);
    }
  };

  const friendlyError = (() => {
    if (!error) return null;
    if (error.includes('402') || error.toLowerCase().includes('insufficient credit') || error.toLowerCase().includes('credit')) {
      return { msg: 'Replicate credit หมด — เติมเครดิตเพื่อใช้งาน AI Portrait', link: 'https://replicate.com/account/billing' };
    }
    if (error.includes('503') || error.toLowerCase().includes('not configured')) {
      return { msg: 'ยังไม่ได้ตั้งค่า REPLICATE_API_TOKEN ใน .env', link: null };
    }
    return { msg: error.slice(0, 100), link: null };
  })();

  // On profile change (when parent updates), also capture any newly saved avatarUrl
  const displayUrl = localUrl ?? profile.avatarUrl ?? null;

  return (
    <div className="avd-root">
      {/* ── Portrait area ── */}
      <div className="avd-portrait" style={{ width, height: width * 1.4 }}>
        {displayUrl ? (
          <>
            <img
              src={displayUrl}
              alt="AI Avatar"
              className="avd-ai-img"
              style={{ width: '100%', height: '100%' }}
            />
            <div className="avd-ai-badge"><EmojiIcon symbol={EMOJI.star} label="AI" /> AI Portrait</div>
          </>
        ) : (
          <AvatarSVG profile={profile} width={width} />
        )}

        {/* Loading overlay */}
        {loading && (
          <div className="avd-loading-overlay">
            <div className="avd-spinner" />
            <p>กำลังสร้าง<br/>AI Portrait…</p>
            <span className="avd-loading-hint">ใช้เวลา ~15 วิ</span>
          </div>
        )}
      </div>

      {/* ── Generate button ── */}
      <button
        className={`avd-gen-btn ${loading ? 'loading' : ''}`}
        onClick={handleGenerate}
        disabled={loading}
        title="สร้าง AI Portrait จากข้อมูลโปรไฟล์"
      >
        {loading
          ? <><span className="avd-btn-spinner" /> กำลังสร้าง…</>
          : displayUrl
            ? `${EMOJI.reset} สร้างใหม่`
            : `${EMOJI.star} สร้าง AI Portrait`
        }
      </button>

      {/* ── Error ── */}
      {friendlyError && (
        <div className="avd-error">
          <span>{EMOJI.warning} {friendlyError.msg}</span>
          {friendlyError.link && (
            <a href={friendlyError.link} target="_blank" rel="noreferrer" className="avd-error-link">
              เติมเครดิต →
            </a>
          )}
        </div>
      )}

      {/* ── Prompt peek ── */}
      {lastPrompt && (
        <button className="avd-prompt-toggle" onClick={() => setShowPrompt(v => !v)}>
          {showPrompt ? '▲ ซ่อน Prompt' : '▼ ดู Prompt ที่ใช้'}
        </button>
      )}
      {showPrompt && lastPrompt && (
        <p className="avd-prompt-text">{lastPrompt}</p>
      )}
    </div>
  );
}
