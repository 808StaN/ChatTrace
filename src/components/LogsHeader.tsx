import type { PointerEventHandler } from 'react';
import { getMessages } from '@/i18n/messages';

interface LogsHeaderProps {
  locale: string;
  onClose: () => void;
  onPointerDown: PointerEventHandler<HTMLElement>;
  onPointerMove: PointerEventHandler<HTMLElement>;
  onPointerUp: PointerEventHandler<HTMLElement>;
}

export function LogsHeader({
  locale,
  onClose,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: LogsHeaderProps) {
  const t = getMessages(locale);
  return (
    <header
      className="tul-header"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div>
        <p className="tul-eyebrow">{t.panelTitle}</p>
      </div>
      <button className="tul-icon-button" type="button" aria-label={t.closePanel} onClick={onClose}>
        ×
      </button>
    </header>
  );
}
