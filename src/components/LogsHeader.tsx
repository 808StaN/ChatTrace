interface LogsHeaderProps {
  channel: string;
  username: string;
  onClose: () => void;
}

export function LogsHeader({ channel, username, onClose }: LogsHeaderProps) {
  return (
    <header className="tul-header">
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
