import { useRef, useCallback } from 'react';

interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  origX: number;
  origY: number;
}

export function useCanvasDrag(
  onMove: (dx: number, dy: number) => void,
  onEnd?: () => void
) {
  const drag = useRef<DragState>({ isDragging: false, startX: 0, startY: 0, origX: 0, origY: 0 });

  const getXY = (e: MouseEvent | TouchEvent) => {
    if ('touches' in e) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  };

  const onPointerDown = useCallback((e: React.MouseEvent | React.TouchEvent, origX: number, origY: number) => {
    e.stopPropagation();
    const { x, y } = getXY(e.nativeEvent);
    drag.current = { isDragging: true, startX: x, startY: y, origX, origY };

    const onMove_ = (ev: MouseEvent | TouchEvent) => {
      if (!drag.current.isDragging) return;
      const { x: cx, y: cy } = getXY(ev);
      onMove(drag.current.origX + cx - drag.current.startX,
             drag.current.origY + cy - drag.current.startY);
    };
    const onUp = () => {
      drag.current.isDragging = false;
      onEnd?.();
      window.removeEventListener('mousemove', onMove_);
      window.removeEventListener('touchmove', onMove_);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchend', onUp);
    };
    window.addEventListener('mousemove', onMove_);
    window.addEventListener('touchmove', onMove_, { passive: false });
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchend', onUp);
  }, [onMove, onEnd]);

  return { onPointerDown };
}
