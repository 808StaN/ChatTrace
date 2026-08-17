import type { ChatMessage } from '@/services/logs';

export function dayKey(date: Date): string {
  return [date.getFullYear(), date.getMonth(), date.getDate()].join('-');
}

export function dayLabel(date: Date, locale: string = navigator.language): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const messageDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const difference = Math.round((today.valueOf() - messageDay.valueOf()) / 86_400_000);
  if (difference === 0) {
    return 'Today';
  }
  if (difference === 1) {
    return 'Yesterday';
  }
  return new Intl.DateTimeFormat(locale, { month: 'long', day: 'numeric', year: 'numeric' }).format(date);
}

export function formatMessageTime(date: Date, locale: string = navigator.language): string {
  return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(date);
}

export function groupMessagesByDay(messages: ChatMessage[]): Array<{ date: Date; messages: ChatMessage[] }> {
  const groups = new Map<string, { date: Date; messages: ChatMessage[] }>();
  for (const message of messages) {
    const key = dayKey(message.timestamp);
    const group = groups.get(key);
    if (group) {
      group.messages.push(message);
    } else {
      groups.set(key, { date: message.timestamp, messages: [message] });
    }
  }
  return [...groups.values()];
}
