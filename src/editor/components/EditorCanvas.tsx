import { useRef, useCallback } from 'react';
import type { Layer, EditorState } from '../types';
import { useCanvasDrag } from '../hooks/useCanvasDrag';
import { EMOJI } from '@/lib/emojis';
import './EditorCanvas.css';

interface Props {
  state: EditorState;
  onSelectLayer: (id: string | null) => void;
  onTransformLayer: (id: string, patch: { x?: number; y?: number; scale?: number }) => void;
}

export default function EditorCanvas({ state, onSelectLayer, onTransformLayer }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { baseImage, layers, selectedLayerId, canvasW, canvasH, zoom, showGrid, showComparison, aiResultUrl } = state;

  const handleCanvasClick = useCallback(() => { onSelectLayer(null); }, [onSelectLayer]);

  return (
    <div className="ec-outer" ref={containerRef}>
      <div
        className="ec-canvas"
        style={{ width: canvasW * zoom, height: canvasH * zoom }}
        onClick={handleCanvasClick}
      >
        {/* Grid overlay */}
        {showGrid && <div className="ec-grid" style={{ width: canvasW, height: canvasH, transform: `scale(${zoom})`, transformOrigin: '0 0' }} />}

        {/* Base image */}
        {baseImage && (
          <img
            src={baseImage}
            alt="base"
            className="ec-base"
            style={{ width: canvasW * zoom, height: canvasH * zoom }}
            draggable={false}
          />
        )}

        {!baseImage && (
          <div className="ec-empty" style={{ width: canvasW * zoom, height: canvasH * zoom }}>
            <span>อัปโหลดรูปเพื่อเริ่มแต่ง</span>
          </div>
        )}

        {/* Layers */}
        {layers.filter(l => l.visible && l.category !== 'base').map(layer => (
          <DraggableLayer
            key={layer.id}
            layer={layer}
            zoom={zoom}
            isSelected={layer.id === selectedLayerId}
            canvasW={canvasW}
            canvasH={canvasH}
            onSelect={() => { onSelectLayer(layer.id); }}
            onMove={(x, y) => onTransformLayer(layer.id, { x, y })}
            onResize={(scale) => onTransformLayer(layer.id, { scale })}
          />
        ))}

        {/* Comparison overlay */}
        {showComparison && aiResultUrl && (
          <div className="ec-comparison">
            <img src={aiResultUrl} alt="AI result" className="ec-comparison-img"
              style={{ width: canvasW * zoom, height: canvasH * zoom }} />
            <div className="ec-comparison-label">AI {EMOJI.star} ผลลัพธ์</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Draggable layer overlay ──
function DraggableLayer({ layer, zoom, isSelected, canvasW, canvasH, onSelect, onMove, onResize }: {
  layer: Layer; zoom: number; isSelected: boolean;
  canvasW: number; canvasH: number;
  onSelect: () => void;
  onMove: (x: number, y: number) => void;
  onResize: (scale: number) => void;
}) {
  const t = layer.transform;
  const { onPointerDown } = useCanvasDrag((x, y) => onMove(x, y));

  const imgW = Math.round(canvasW * t.scale * zoom);
  const posX = Math.round((canvasW / 2 + t.x - (canvasW * t.scale) / 2) * zoom);
  const posY = Math.round((canvasH * 0.05 + t.y) * zoom);

  // ── Corner-handle resize (mouse + touch) ──
  const startResizeRef = useRef<{ clientX: number; clientY: number; scale: number } | null>(null);

  const handleResizeStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const pt = 'touches' in e ? e.touches[0] : e;
    startResizeRef.current = { clientX: pt.clientX, clientY: pt.clientY, scale: t.scale };

    const onResizeMove = (ev: MouseEvent | TouchEvent) => {
      if (!startResizeRef.current) return;
      const cur = 'touches' in ev ? ev.touches[0] : ev;
      // distance dragged diagonally → changes scale
      const dx = cur.clientX - startResizeRef.current.clientX;
      const dy = cur.clientY - startResizeRef.current.clientY;
      const delta = (dx + dy) / (canvasW * zoom); // normalise to canvas width
      const newScale = Math.max(0.05, Math.min(3, startResizeRef.current.scale + delta));
      onResize(newScale);
    };
    const onResizeEnd = () => {
      startResizeRef.current = null;
      window.removeEventListener('mousemove', onResizeMove);
      window.removeEventListener('touchmove', onResizeMove);
      window.removeEventListener('mouseup', onResizeEnd);
      window.removeEventListener('touchend', onResizeEnd);
    };
    window.addEventListener('mousemove', onResizeMove);
    window.addEventListener('touchmove', onResizeMove, { passive: false });
    window.addEventListener('mouseup', onResizeEnd);
    window.addEventListener('touchend', onResizeEnd);
  }, [t.scale, canvasW, zoom, onResize]);

  // ── Pinch-to-zoom ──
  const pinchRef = useRef<{ dist: number; scale: number } | null>(null);
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (layer.locked) return;
    if (e.touches.length === 2) {
      e.stopPropagation();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchRef.current = { dist: Math.hypot(dx, dy), scale: t.scale };
      return;
    }
    onPointerDown(e, t.x, t.y);
  }, [layer.locked, t.scale, t.x, t.y, onPointerDown]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const newScale = Math.max(0.05, Math.min(3, pinchRef.current.scale * (dist / pinchRef.current.dist)));
      onResize(newScale);
    }
  }, [onResize]);

  const handleTouchEnd = useCallback(() => { pinchRef.current = null; }, []);

  return (
    <div
      className={`ec-layer ${isSelected ? 'selected' : ''} ${layer.locked ? 'locked' : ''}`}
      style={{
        left: posX, top: posY,
        width: imgW,
        opacity: t.opacity,
        transform: `rotate(${t.rotation}deg) scaleX(${(t.flipX ? -1 : 1) * (t.scaleX ?? 1)}) scaleY(${t.scaleY ?? 1})`,
        cursor: layer.locked ? 'not-allowed' : 'grab',
      }}
      onClick={e => { e.stopPropagation(); onSelect(); }}
      onMouseDown={e => !layer.locked && onPointerDown(e, t.x, t.y)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {layer.imageUrl.startsWith('data:') || layer.imageUrl.startsWith('http')
        ? <img src={layer.imageUrl} alt={layer.name} draggable={false} style={{ width: '100%', display: 'block' }} />
        : (
          <div className="ec-layer-emoji-placeholder">
            <span style={{ fontSize: Math.max(24, imgW * 0.4) }}>{layer.imageUrl}</span>
          </div>
        )
      }

      {/* Selection handles */}
      {isSelected && !layer.locked && (
        <div className="ec-handles">
          <div className="ec-handle tl" />
          <div className="ec-handle tr" />
          <div className="ec-handle bl" />
          {/* br handle is interactive – drag to resize */}
          <div
            className="ec-handle br resize-handle"
            onMouseDown={handleResizeStart}
            onTouchStart={handleResizeStart}
          />
          <div className="ec-handle-border" />
          {/* scale badge */}
          <div className="ec-scale-badge">{Math.round(t.scale * 100)}%</div>
        </div>
      )}
    </div>
  );
}
