import type { ChatMessage } from '@/services/logs';
import { formatMessageTime } from '@/utils/dates';

const BADGE_LABELS: Record<string, string> = {
  broadcaster: 'BR',
  moderator: 'MOD',
  subscriber: 'SUB',
  vip: 'VIP',
};

function badgeClassName(name: string): string {
  return `tul-badge tul-badge-${name in BADGE_LABELS ? name : 'default'}`;
}

export function LogsMessage({ message }: { message: ChatMessage }) {
  return (
    <article className="tul-message">
      <time className="tul-message-time" dateTime={message.timestamp.toISOString()}>
        {formatMessageTime(message.timestamp)}
      </time>
      <div className="tul-message-body">
        <div className="tul-message-meta">
          {message.badges?.map((badge) => (
            <span
              key={`${badge.name}-${badge.version ?? ''}`}
              className={badgeClassName(badge.name)}
              title={badge.name}
            >
              {BADGE_LABELS[badge.name] ?? badge.name.slice(0, 3).toUpperCase()}
            </span>
          ))}
          <span className="tul-message-author" style={{ color: message.color }}>
            {message.displayName ?? message.username}
          </span>
          <span className="tul-message-colon">:</span>
        </div>
        <p className="tul-message-text">{message.text}</p>
      </div>
    </article>
  );
}
