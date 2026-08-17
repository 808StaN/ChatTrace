import type { ChatMessage } from '@/services/logs';
import type { BadgeImageLookup } from '@/services/twitchBadges';
import { formatMessageTime } from '@/utils/dates';

export function LogsMessage({
  message,
  badgeImages,
}: {
  message: ChatMessage;
  badgeImages: BadgeImageLookup;
}) {
  return (
    <article className="tul-message">
      <time className="tul-message-time" dateTime={message.timestamp.toISOString()}>
        {formatMessageTime(message.timestamp)}
      </time>
      <div className="tul-message-body">
        <span className="tul-message-meta">
          {message.badges?.map((badge) => {
            const imageUrl = badgeImages[`${badge.name}/${badge.version ?? '1'}`];
            return imageUrl ? (
              <img
                key={`${badge.name}-${badge.version ?? ''}`}
                className="tul-badge-image"
                src={imageUrl}
                alt={badge.name}
                title={badge.name}
                onError={(event) => {
                  event.currentTarget.hidden = true;
                }}
              />
            ) : null;
          })}
          <span className="tul-message-author" style={{ color: message.color }}>
            {message.displayName ?? message.username}
          </span>
          <span className="tul-message-colon">:</span>
        </span>
        <span className="tul-message-text">{message.text}</span>
      </div>
    </article>
  );
}
