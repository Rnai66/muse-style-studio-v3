import type { Layer } from '../types';
import { CATEGORY_META } from '../types';
import { EMOJI } from '@/lib/emojis';
import EmojiIcon from '@/components/EmojiIcon';
import './LayerItem.css';

interface Props {
  layer: Layer;
  isSelected: boolean;
  onSelect: () => void;
  onToggleVisible: () => void;
  onToggleLock: () => void;
  onDelete: () => void;
  onRunAI?: () => void;
}

export default function LayerItem({
  layer, isSelected, onSelect, onToggleVisible, onToggleLock, onDelete, onRunAI,
}: Props) {
  const meta = CATEGORY_META[layer.category];

  return (
    <div
      className={`layer-item ${isSelected ? 'selected' : ''} ${layer.locked ? 'locked' : ''}`}
      onClick={onSelect}
    >
      {/* Thumbnail */}
      <div className="layer-thumb">
        {layer.imageUrl.startsWith('data:') || layer.imageUrl.startsWith('http')
          ? <img src={layer.imageUrl} alt={layer.name} className="layer-thumb-img" />
          : <span className="layer-thumb-emoji">{meta.icon}</span>
        }
        {layer.aiProcessed && <span className="layer-ai-badge">AI</span>}
      </div>

      {/* Info */}
      <div className="layer-info">
        <div className="layer-name">{layer.name}</div>
        <div className="layer-cat"><span className="emoji-icon">{meta.icon}</span> {meta.label}</div>
      </div>

      {/* Actions */}
      <div className="layer-actions" onClick={e => e.stopPropagation()}>
        {meta.aiSupported && onRunAI && !layer.aiProcessed && (
          <button className="la-btn ai" onClick={onRunAI} title="รัน AI">{EMOJI.star}</button>
        )}
        <button className="la-btn" onClick={onToggleVisible} title="ซ่อน/แสดง">
          <EmojiIcon symbol={layer.visible ? EMOJI.eye : EMOJI.hidden} className="la-icon" label={layer.visible ? 'แสดง' : 'ซ่อน'} />
        </button>
        <button className="la-btn" onClick={onToggleLock} title="ล็อก">
          <EmojiIcon symbol={layer.locked ? EMOJI.lock : EMOJI.unlock} className="la-icon" label={layer.locked ? 'ล็อก' : 'ปลดล็อก'} />
        </button>
        <button className="la-btn danger" onClick={onDelete} title="ลบ">{EMOJI.close}</button>
      </div>
    </div>
  );
}
