import type { ChatMessage } from '@/services/logs';

export function filterMessages(messages: ChatMessage[], query: string): ChatMessage[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) {
    return messages;
  }
  return messages.filter((message) => message.text.toLocaleLowerCase().includes(normalizedQuery));
}
