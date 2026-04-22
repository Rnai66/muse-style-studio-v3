import type { Layer } from '../types';
import { CATEGORY_META } from '../types';
import AppIcon from '@/components/AppIcon';
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
          : <AppIcon name={meta.icon} className="layer-thumb-icon" label={meta.label} />
        }
        {layer.aiProcessed && <span className="layer-ai-badge">AI</span>}
      </div>

      {/* Info */}
      <div className="layer-info">
        <div className="layer-name">{layer.name}</div>
        <div className="layer-cat"><AppIcon name={meta.icon} className="layer-cat-icon" label={meta.label} /> {meta.label}</div>
      </div>

      {/* Actions */}
      <div className="layer-actions" onClick={e => e.stopPropagation()}>
        {meta.aiSupported && onRunAI && !layer.aiProcessed && (
          <button className="la-btn ai" onClick={onRunAI} title="รัน AI"><AppIcon name="spark" label="รัน AI" /></button>
        )}
        <button className="la-btn" onClick={onToggleVisible} title="ซ่อน/แสดง">
          <AppIcon name={layer.visible ? 'eye' : 'hidden'} className="la-icon" label={layer.visible ? 'แสดง' : 'ซ่อน'} />
        </button>
        <button className="la-btn" onClick={onToggleLock} title="ล็อก">
          <AppIcon name={layer.locked ? 'lock' : 'unlock'} className="la-icon" label={layer.locked ? 'ล็อก' : 'ปลดล็อก'} />
        </button>
        <button className="la-btn danger" onClick={onDelete} title="ลบ"><AppIcon name="close" label="ลบ" /></button>
      </div>
    </div>
  );
}
