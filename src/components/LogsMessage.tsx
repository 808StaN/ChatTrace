import { Fragment } from 'react';
import type { ChatMessage } from '@/services/logs';
import type { BadgeImageLookup } from '@/services/twitchBadges';
import { formatMessageTime } from '@/utils/dates';
import { tokenizeMessage } from '@/services/emotes/tokenize';
import type { ExternalEmoteLookup } from '@/services/emotes/types';

export function LogsMessage({
  message,
  badgeImages,
  externalEmotes,
}: {
  message: ChatMessage;
  badgeImages: BadgeImageLookup;
  externalEmotes: ExternalEmoteLookup;
}) {
  const messageParts = tokenizeMessage(message, externalEmotes);
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
        <span className="tul-message-text">
          {messageParts.map((part, index) =>
            part.type === 'text' ? (
              <Fragment key={`${part.text}-${index}`}>{part.text}</Fragment>
            ) : (
              <img
                key={`${part.provider}-${part.url}-${index}`}
                className="tul-inline-emote"
                src={part.url}
                alt={part.alt}
                title={part.alt}
                onError={(event) => {
                  event.currentTarget.hidden = true;
                }}
              />
            ),
          )}
        </span>
      </div>
    </article>
  );
}
