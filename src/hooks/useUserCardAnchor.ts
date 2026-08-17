import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';

interface PanelPosition {
  height: number;
  left: number;
  top: number;
}

function positionsMatch(left: PanelPosition, right: PanelPosition): boolean {
  return left.height === right.height && left.left === right.left && left.top === right.top;
}

const PANEL_WIDTH = 390;
const VIEWPORT_GUTTER = 8;
const CARD_GAP = -1;

function getPanelPosition(anchor: Element): PanelPosition {
  const card = anchor.getBoundingClientRect();
  const availableHeight = window.innerHeight - VIEWPORT_GUTTER * 2;
  const panelHeight = Math.min(
    Math.max(220, Math.round(card.height)),
    Math.max(220, Math.round(availableHeight / 2)),
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
    let trackingFrameId: number | undefined;
    let previousPosition = getPanelPosition(anchorElement);
    const updatePosition = () => {
      frameId = undefined;
      const nextPosition = getPanelPosition(anchorElement);
      if (!positionsMatch(previousPosition, nextPosition)) {
        previousPosition = nextPosition;
        setPosition(nextPosition);
      }
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

    // Twitch can move viewer cards by updating an ancestor's transform without a DOM mutation.
    const trackCardPosition = () => {
      updatePosition();
      trackingFrameId = window.requestAnimationFrame(trackCardPosition);
    };
    trackingFrameId = window.requestAnimationFrame(trackCardPosition);

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener('resize', schedulePositionUpdate);
      window.removeEventListener('scroll', schedulePositionUpdate, true);
      if (frameId !== undefined) {
        window.cancelAnimationFrame(frameId);
      }
      if (trackingFrameId !== undefined) {
        window.cancelAnimationFrame(trackingFrameId);
      }
      anchorElement.style.translate = originalTranslate;
    };
  }, [anchor]);

  const onHeaderPointerDown = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (event.button !== 0 || (event.target instanceof Element && event.target.closest('button'))) {
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
  }, []);

  const onHeaderPointerMove = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (!drag.current) {
      return;
    }

    const deltaX = event.clientX - drag.current.startX;
    const deltaY = event.clientY - drag.current.startY;
    const anchorElement = anchorRef.current as HTMLElement;
    anchorElement.style.translate = `${drag.current.translateX + deltaX}px ${drag.current.translateY + deltaY}px`;
    const nextPosition = getPanelPosition(anchorElement);
    setPosition(nextPosition);
  }, []);

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
