import type { ChatMessage } from '@/services/logs';
import type { BadgeImageLookup } from '@/services/twitchBadges';
import type { ExternalEmoteLookup } from '@/services/emotes/types';
import { dayLabel, groupMessagesByDay } from '@/utils/dates';
import { LogsMessage } from './LogsMessage';

export function LogsList({
  messages,
  badgeImages,
  externalEmotes,
  locale,
}: {
  messages: ChatMessage[];
  badgeImages: BadgeImageLookup;
  externalEmotes: ExternalEmoteLookup;
  locale: string;
}) {
  return (
    <div className="tul-list">
      {groupMessagesByDay(messages).map((group) => (
        <section key={group.date.toISOString()} className="tul-day-group">
          <h3>{dayLabel(group.date, locale)}</h3>
          {group.messages.map((message, index) => (
            <LogsMessage
              key={message.id ?? `${message.timestamp.valueOf()}-${index}`}
              message={message}
              badgeImages={badgeImages}
              externalEmotes={externalEmotes}
              locale={locale}
            />
          ))}
        </section>
      ))}
    </div>
  );
}
