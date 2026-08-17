import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';

interface PanelPosition {
  height: number;
  left: number;
  top: number;
}

const PANEL_WIDTH = 390;
const VIEWPORT_GUTTER = 8;
const CARD_GAP = 8;

function getPanelPosition(anchor: Element): PanelPosition {
  const card = anchor.getBoundingClientRect();
  const maxPanelHeight = Math.max(280, window.innerHeight - VIEWPORT_GUTTER * 2);
  const panelHeight = Math.min(
    maxPanelHeight,
    Math.max(360, window.innerHeight - card.top - VIEWPORT_GUTTER),
  );
  const rightSideLeft = card.right + CARD_GAP;
  const leftSideLeft = card.left - PANEL_WIDTH - CARD_GAP;
  const fitsRight = rightSideLeft + PANEL_WIDTH <= window.innerWidth - VIEWPORT_GUTTER;
  const left = fitsRight ? rightSideLeft : Math.max(VIEWPORT_GUTTER, leftSideLeft);
  const top = Math.min(
    Math.max(VIEWPORT_GUTTER, card.top),
    window.innerHeight - panelHeight - VIEWPORT_GUTTER,
  );

  return { height: panelHeight, left, top };
}

export function useUserCardAnchor(anchor: Element) {
  const [position, setPosition] = useState<PanelPosition>(() => getPanelPosition(anchor));
  const anchorRef = useRef(anchor);
  const drag = useRef<{
    startX: number;
    startY: number;
    translateX: number;
    translateY: number;
  } | null>(null);

  useLayoutEffect(() => {
    anchorRef.current = anchor;
    const anchorElement = anchorRef.current as HTMLElement;
    const originalTranslate = anchorElement.style.translate;
    let frameId: number | undefined;
    const updatePosition = () => {
      frameId = undefined;
      setPosition(getPanelPosition(anchorElement));
    };
    const schedulePositionUpdate = () => {
      if (frameId === undefined) {
        frameId = window.requestAnimationFrame(updatePosition);
      }
    };

    const resizeObserver = new ResizeObserver(schedulePositionUpdate);
    const mutationObserver = new MutationObserver(schedulePositionUpdate);
    resizeObserver.observe(anchorElement);
    mutationObserver.observe(anchorElement, { attributes: true, childList: true, subtree: true });
    window.addEventListener('resize', schedulePositionUpdate);
    window.addEventListener('scroll', schedulePositionUpdate, true);
    schedulePositionUpdate();

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener('resize', schedulePositionUpdate);
      window.removeEventListener('scroll', schedulePositionUpdate, true);
      if (frameId !== undefined) {
        window.cancelAnimationFrame(frameId);
      }
      anchorElement.style.translate = originalTranslate;
    };
  }, [anchor]);

  const onHeaderPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (
        event.button !== 0 ||
        (event.target instanceof Element && event.target.closest('button'))
      ) {
        return;
      }

      const style = (anchorRef.current as HTMLElement).style;
      const [translateX = '0', translateY = '0'] = style.translate.split(' ');
      drag.current = {
        startX: event.clientX,
        startY: event.clientY,
        translateX: Number.parseFloat(translateX) || 0,
        translateY: Number.parseFloat(translateY) || 0,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [],
  );

  const onHeaderPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!drag.current) {
        return;
      }

      const deltaX = event.clientX - drag.current.startX;
      const deltaY = event.clientY - drag.current.startY;
      const anchorElement = anchorRef.current as HTMLElement;
      anchorElement.style.translate =
        `${drag.current.translateX + deltaX}px ${drag.current.translateY + deltaY}px`;
      setPosition(getPanelPosition(anchorElement));
    },
    [],
  );

  const onHeaderPointerUp = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (!drag.current) {
      return;
    }
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  const panelStyle: CSSProperties = {
    '--tul-panel-height': `${position.height}px`,
    '--tul-panel-left': `${position.left}px`,
    '--tul-panel-top': `${position.top}px`,
  } as CSSProperties;

  return { onHeaderPointerDown, onHeaderPointerMove, onHeaderPointerUp, panelStyle };
}
