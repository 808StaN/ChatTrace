import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent, RefObject } from 'react';

interface PanelPosition {
  height: number;
  left: number;
  top: number;
  width: number;
  zIndex: number;
}

function positionsMatch(left: PanelPosition, right: PanelPosition): boolean {
  return (
    left.height === right.height &&
    left.left === right.left &&
    left.top === right.top &&
    left.width === right.width &&
    left.zIndex === right.zIndex
  );
}

const VIEWPORT_GUTTER = 8;
const CARD_GAP = -1;

function getCardZIndex(anchor: Element): number {
  let element: HTMLElement | null = anchor as HTMLElement;
  while (element && element !== document.body) {
    const zIndex = Number.parseInt(window.getComputedStyle(element).zIndex, 10);
    if (Number.isFinite(zIndex)) {
      return zIndex;
    }
    element = element.parentElement;
  }
  return 1;
}

function getPanelPosition(anchor: Element): PanelPosition {
  const card = anchor.getBoundingClientRect();
  const panelHeight = Math.round(card.height * 1.75);
  const panelWidth = Math.round(card.width);
  const leftSideLeft = card.left - panelWidth - CARD_GAP;
  const left = Math.max(VIEWPORT_GUTTER, leftSideLeft);
  const top = card.top;

  return { height: panelHeight, left, top, width: panelWidth, zIndex: getCardZIndex(anchor) };
}

export function useUserCardAnchor(anchor: Element, panelRef: RefObject<HTMLElement | null>) {
  const [position, setPosition] = useState<PanelPosition>(() => getPanelPosition(anchor));
  const anchorRef = useRef(anchor);
  const drag = useRef<{
    startX: number;
    startY: number;
    translateX: number;
    translateY: number;
  } | null>(null);
  const pendingDrag = useRef<{ x: number; y: number } | null>(null);
  const dragFrameId = useRef<number | undefined>(undefined);
  const shouldClearPanelTransform = useRef(false);

  const applyPendingDrag = useCallback(() => {
    dragFrameId.current = undefined;
    const activeDrag = drag.current;
    const delta = pendingDrag.current;
    if (!activeDrag || !delta) {
      return;
    }

    const anchorElement = anchorRef.current as HTMLElement;
    anchorElement.style.translate = `${activeDrag.translateX + delta.x}px ${activeDrag.translateY + delta.y}px`;
    panelRef.current?.style.setProperty('transform', `translate3d(${delta.x}px, ${delta.y}px, 0)`);
  }, [panelRef]);

  useLayoutEffect(() => {
    if (shouldClearPanelTransform.current) {
      panelRef.current?.style.removeProperty('transform');
      shouldClearPanelTransform.current = false;
    }
  }, [panelRef, position]);

  useLayoutEffect(() => {
    anchorRef.current = anchor;
    const anchorElement = anchorRef.current as HTMLElement;
    const panelElement = panelRef.current;
    let frameId: number | undefined;
    let trackingFrameId: number | undefined;
    let previousPosition = getPanelPosition(anchorElement);
    const updatePosition = () => {
      frameId = undefined;
      if (drag.current) {
        return;
      }
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
      if (dragFrameId.current !== undefined) {
        window.cancelAnimationFrame(dragFrameId.current);
      }
      panelElement?.style.removeProperty('transform');
    };
  }, [anchor, panelRef]);

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
    pendingDrag.current = { x: 0, y: 0 };
    event.currentTarget.setPointerCapture(event.pointerId);
  }, []);

  const onHeaderPointerMove = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (!drag.current) {
      return;
    }

    pendingDrag.current = {
      x: event.clientX - drag.current.startX,
      y: event.clientY - drag.current.startY,
    };
    if (dragFrameId.current === undefined) {
      dragFrameId.current = window.requestAnimationFrame(applyPendingDrag);
    }
  }, [applyPendingDrag]);

  const onHeaderPointerUp = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (!drag.current) {
      return;
    }
    pendingDrag.current = {
      x: event.clientX - drag.current.startX,
      y: event.clientY - drag.current.startY,
    };
    if (dragFrameId.current !== undefined) {
      window.cancelAnimationFrame(dragFrameId.current);
    }
    applyPendingDrag();
    drag.current = null;
    pendingDrag.current = null;
    shouldClearPanelTransform.current = true;
    setPosition(getPanelPosition(anchorRef.current));
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, [applyPendingDrag]);

  const panelStyle: CSSProperties = {
    '--tul-panel-height': `${position.height}px`,
    '--tul-panel-left': `${position.left}px`,
    '--tul-panel-top': `${position.top}px`,
    '--tul-panel-width': `${position.width}px`,
    zIndex: position.zIndex,
  } as CSSProperties;

  return { onHeaderPointerDown, onHeaderPointerMove, onHeaderPointerUp, panelStyle };
}
