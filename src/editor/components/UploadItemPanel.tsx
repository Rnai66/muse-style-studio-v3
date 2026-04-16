import { useRef, useState, useCallback } from 'react';
import type { CatalogItem, LayerCategory } from '../types';
import { CATEGORY_META } from '../types';
import { useRemoveBg } from '@/hooks/useRemoveBg';
import EmojiIcon from '@/components/EmojiIcon';
import { EMOJI } from '@/lib/emojis';
import './UploadItemPanel.css';

const UPLOADABLE_CATS: LayerCategory[] = [
  'top', 'bottom', 'dress', 'hair', 'shoes', 'bag', 'hat', 'glasses', 'jewelry', 'outerwear',
];

interface Props {
  onAdd: (item: CatalogItem, imageUrl: string) => void;
}

export default function UploadItemPanel({ onAdd }: Props) {
  const fileRef   = useRef<HTMLInputElement>(null);
  const [preview, setPreview]         = useState<string | null>(null);
  const [originalPreview, setOriginal] = useState<string | null>(null); // before rembg
  const [fileName, setFileName]       = useState('');
  const [name, setName]               = useState('');
  const [category, setCategory]       = useState<LayerCategory>('dress');
  const [dragging, setDragging]       = useState(false);
  const [bgRemoved, setBgRemoved]     = useState(false);

  const { removeBg, loading: removingBg, error: rembgError } = useRemoveBg();

  const loadFile = useCallback((file: File) => {
    const baseName = file.name.replace(/\.[^.]+$/, '');
    setFileName(file.name);
    setName(baseName);
    setBgRemoved(false);
    setOriginal(null);
    const reader = new FileReader();
    reader.onload = e => {
      const url = e.target?.result as string;
      setPreview(url);
      setOriginal(url);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) loadFile(f);
    e.target.value = '';
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('image/')) loadFile(f);
  }, [loadFile]);

  // ── Remove background ──
  const handleRemoveBg = async () => {
    if (!preview) return;
    const result = await removeBg(preview);
    if (result) {
      setPreview(result);
      setBgRemoved(true);
    }
  };

  // ── Restore original ──
  const handleRestoreOriginal = () => {
    if (originalPreview) {
      setPreview(originalPreview);
      setBgRemoved(false);
    }
  };

  const handleAdd = () => {
    if (!preview) return;
    const item: CatalogItem = {
      id: `upload_${Date.now()}`,
      name: name || 'ไอเทมที่อัปโหลด',
      nameEn: name || 'Uploaded Item',
      category,
      previewUrl: preview,
      color: '#6b6b8a',
      price: '',
      tags: ['uploaded', CATEGORY_META[category].label],
      aiPrompt: name,
      replicateCategory: 'upper_body',
    };
    onAdd(item, preview);
    setPreview(null);
    setOriginal(null);
    setName('');
    setFileName('');
    setBgRemoved(false);
  };

  return (
    <div className="uip-root">

      {/* ── Drop zone ── */}
      <div
        className={`uip-dropzone ${dragging ? 'dragging' : ''} ${preview ? 'has-preview' : ''}`}
        onClick={() => !preview && fileRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        {preview ? (
          <div className="uip-preview-wrap" style={{ background: bgRemoved ? 'repeating-conic-gradient(#3a3a4a 0% 25%, #2a2a3a 0% 50%) 0 0 / 12px 12px' : undefined }}>
            <img src={preview} alt="preview" className="uip-preview-img" />
            {bgRemoved && (
              <div className="uip-bg-removed-badge">{EMOJI.check} ลบพื้นหลังแล้ว</div>
            )}
          </div>
        ) : (
          <div className="uip-drop-content">
            <EmojiIcon symbol={EMOJI.upload} className="uip-drop-icon" label="อัปโหลด" />
            <span className="uip-drop-title">คลิกหรือลากรูปมาวาง</span>
            <span className="uip-drop-hint">PNG · JPG · WEBP · GIF · SVG</span>
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>

      {/* ── Background removal button (shown when preview ready) ── */}
      {preview && (
        <div className="uip-rembg-row">
          {!bgRemoved ? (
            <button
              className={`uip-rembg-btn ${removingBg ? 'loading' : ''}`}
              onClick={handleRemoveBg}
              disabled={removingBg}
              title={removingBg ? 'กำลังประมวลผล (อาจใช้เวลา 15-60 วินาที)' : 'ลบพื้นหลังโดยใช้ AI'}
            >
              {removingBg
                ? <><span className="uip-spinner" /> กำลังลบพื้นหลัง…</>
                : <><EmojiIcon symbol={EMOJI.magic} className="uip-action-icon" label="ลบพื้นหลัง" /> ลบพื้นหลัง</>
              }
            </button>
          ) : (
            <button className="uip-restore-btn" onClick={handleRestoreOriginal}>
              {EMOJI.reset} คืนพื้นหลังเดิม
            </button>
          )}
          <button className="uip-change-btn" onClick={() => fileRef.current?.click()}>
            <EmojiIcon symbol={EMOJI.folder} className="uip-action-icon" label="เปลี่ยนรูป" /> เปลี่ยนรูป
          </button>
        </div>
      )}

      {removingBg && (
        <div className="uip-processing-hint">
          {EMOJI.clock} กำลังประมวลผล... (อาจใช้เวลา 1-3 นาที)
        </div>
      )}

      {rembgError && (
        <div className="uip-error">{EMOJI.warning} {rembgError}</div>
      )}

      {/* ── Form ── */}
      {preview && (
        <div className="uip-form">

          <div className="uip-field">
            <label className="uip-label">ชื่อไอเทม</label>
            <input
              className="uip-input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="เช่น เสื้อสีฟ้า, กระเป๋าชมพู"
            />
          </div>

          <div className="uip-field">
            <label className="uip-label">หมวดหมู่</label>
            <div className="uip-cat-grid">
              {UPLOADABLE_CATS.map(cat => (
                <button
                  key={cat}
                  className={`uip-cat-btn ${category === cat ? 'active' : ''}`}
                  onClick={() => setCategory(cat)}
                >
                  <span className="uip-cat-icon">{CATEGORY_META[cat].icon}</span>
                  <span className="uip-cat-label">{CATEGORY_META[cat].label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="uip-actions">
            <button className="uip-add-btn" onClick={handleAdd}>
              <EmojiIcon symbol={EMOJI.star} className="uip-action-icon" label="เพิ่ม" /> เพิ่มลงบนรูป
            </button>
            <button
              className="uip-reset-btn"
              onClick={() => {
                setPreview(null);
                setOriginal(null);
                setName('');
                setFileName('');
                setBgRemoved(false);
              }}
            >
              {EMOJI.close} เลือกใหม่
            </button>
          </div>
        </div>
      )}

      {!preview && (
        <div className="uip-tip">
          <p><EmojiIcon symbol={EMOJI.sparkle} className="uip-tip-icon" label="เคล็ดลับ" /> อัปโหลดรูปเสื้อผ้า กระเป๋า รองเท้า หรืออุปกรณ์เสริม แล้วใช้ <strong>{EMOJI.magic} ลบพื้นหลัง</strong> เพื่อตัดเหลือแต่ไอเทมก่อนวางทับรูปของคุณ</p>
        </div>
      )}

      {fileName && !preview && (
        <div className="uip-loading">⏳ กำลังโหลด {fileName}…</div>
      )}
    </div>
  );
}
