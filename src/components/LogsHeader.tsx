import type { PointerEventHandler } from 'react';

interface LogsHeaderProps {
  channel: string;
  username: string;
  onClose: () => void;
  onPointerDown: PointerEventHandler<HTMLElement>;
  onPointerMove: PointerEventHandler<HTMLElement>;
  onPointerUp: PointerEventHandler<HTMLElement>;
}

export function LogsHeader({
  channel,
  username,
  onClose,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: LogsHeaderProps) {
  return (
    <header
      className="tul-header"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div>
        <p className="tul-eyebrow">Chat history</p>
        <h2 className="tul-title">{username}</h2>
        <p className="tul-channel">#{channel}</p>
      </div>
      <button className="tul-icon-button" type="button" aria-label="Close logs" onClick={onClose}>
        ×
      </button>
    </header>
  );
}
