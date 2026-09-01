import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';

interface PanelPosition {
  height: number;
  left: number;
  top: number;
  width: number;
}

const VIEWPORT_GUTTER = 16;
const PANEL_WIDTH = 440;
const PANEL_HEIGHT = 620;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

function getInitialPosition(): PanelPosition {
  const width = Math.min(PANEL_WIDTH, window.innerWidth - VIEWPORT_GUTTER * 2);
  const height = Math.min(PANEL_HEIGHT, window.innerHeight - VIEWPORT_GUTTER * 2);
  return {
    height,
    left: window.innerWidth - width - VIEWPORT_GUTTER,
    top: window.innerHeight - height - VIEWPORT_GUTTER,
    width,
  };
}

function keepInViewport(position: PanelPosition): PanelPosition {
  const width = Math.min(position.width, window.innerWidth - VIEWPORT_GUTTER * 2);
  const height = Math.min(position.height, window.innerHeight - VIEWPORT_GUTTER * 2);
  return {
    height,
    left: clamp(position.left, VIEWPORT_GUTTER, window.innerWidth - width - VIEWPORT_GUTTER),
    top: clamp(position.top, VIEWPORT_GUTTER, window.innerHeight - height - VIEWPORT_GUTTER),
    width,
  };
}

export function useStandalonePanel() {
  const [position, setPosition] = useState<PanelPosition>(getInitialPosition);
  const drag = useRef<{ left: number; pointerX: number; pointerY: number; top: number } | null>(
    null,
  );

  useEffect(() => {
    const onResize = () => setPosition((current) => keepInViewport(current));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const onHeaderPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (
        event.button !== 0 ||
        (event.target instanceof Element && event.target.closest('button'))
      ) {
        return;
      }

      drag.current = {
        left: position.left,
        pointerX: event.clientX,
        pointerY: event.clientY,
        top: position.top,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [position.left, position.top],
  );

  const onHeaderPointerMove = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    const activeDrag = drag.current;
    if (!activeDrag) {
      return;
    }

    setPosition((current) =>
      keepInViewport({
        ...current,
        left: activeDrag.left + event.clientX - activeDrag.pointerX,
        top: activeDrag.top + event.clientY - activeDrag.pointerY,
      }),
    );
  }, []);

  const onHeaderPointerUp = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  const panelStyle: CSSProperties = {
    '--tul-panel-height': `${position.height}px`,
    '--tul-panel-left': `${position.left}px`,
    '--tul-panel-top': `${position.top}px`,
    '--tul-panel-width': `${position.width}px`,
    zIndex: 9999,
  } as CSSProperties;

  return { onHeaderPointerDown, onHeaderPointerMove, onHeaderPointerUp, panelStyle };
}
