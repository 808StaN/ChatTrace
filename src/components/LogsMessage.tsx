import type { ChatMessage } from '@/services/logs';
import { formatMessageTime } from '@/utils/dates';

export function LogsMessage({ message }: { message: ChatMessage }) {
  return (
    <article className="tul-message">
      <time className="tul-message-time" dateTime={message.timestamp.toISOString()}>
        {formatMessageTime(message.timestamp)}
      </time>
      <p className="tul-message-text">{message.text}</p>
    </article>
  );
}
