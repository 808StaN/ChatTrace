import { describe, expect, it } from 'vitest';
import type { ChatMessage } from '@/services/logs';
import { dayLabel, groupMessagesByDay } from './dates';
import { filterMessages } from './search';

const messages: ChatMessage[] = [
  { username: 'viewer', timestamp: new Date('2026-08-16T18:42:00Z'), text: 'KEKW' },
  { username: 'viewer', timestamp: new Date('2026-08-16T18:39:00Z'), text: 'co on robi' },
  { username: 'viewer', timestamp: new Date('2026-08-15T18:31:00Z'), text: 'LULW' },
];

describe('logs UI helpers', () => {
  it('filters loaded messages case-insensitively', () => {
    expect(filterMessages(messages, 'kekw')).toEqual([messages[0]]);
    expect(filterMessages(messages, '  ')).toEqual(messages);
  });

  it('groups messages by their local calendar day', () => {
    expect(groupMessagesByDay(messages).map((group) => group.messages)).toEqual([
      [messages[0], messages[1]],
      [messages[2]],
    ]);
  });

  it('uses a readable date label', () => {
    expect(dayLabel(new Date('2026-08-15T12:00:00Z'), 'en-US')).toContain('August');
  });

  it('localizes relative day labels', () => {
    const today = new Date();
    expect(dayLabel(today, 'en-US')).toBe('today');
    expect(dayLabel(today, 'pl-PL')).toBe('dzisiaj');

    const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
    expect(dayLabel(yesterday, 'en-US')).toBe('yesterday');
    expect(dayLabel(yesterday, 'pl-PL')).toBe('wczoraj');
  });
});
