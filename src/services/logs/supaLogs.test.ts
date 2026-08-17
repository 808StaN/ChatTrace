import { describe, expect, it } from 'vitest';
import { normalizeSupaMessages } from './supaLogs';

describe('normalizeSupaMessages', () => {
  it('normalizes and orders a Supa Logs message response', () => {
    const messages = normalizeSupaMessages(
      {
        messages: [
          {
            id: 'older',
            displayName: 'Viewer',
            text: 'first',
            timestamp: '2026-08-16T18:39:00.000Z',
            tags: { badges: 'subscriber/12' },
          },
          {
            id: 'newer',
            text: 'second',
            timestamp: '2026-08-16T18:42:00.000Z',
            tags: {
              'display-name': 'Viewer',
              badges: 'moderator/1',
              color: '#00FF00',
              emotes: '25:0-4',
            },
          },
        ],
      },
      'viewer',
    );

    expect(messages.map((message) => message.id)).toEqual(['newer', 'older']);
    expect(messages[0]).toMatchObject({
      username: 'viewer',
      displayName: 'Viewer',
      text: 'second',
      badges: [{ name: 'moderator', version: '1' }],
      color: '#00FF00',
      emotes: [{ id: '25', start: 0, end: 4 }],
    });
  });

  it('rejects an unexpected API response', () => {
    expect(() => normalizeSupaMessages({ unexpected: [] }, 'viewer')).toThrow(
      'Supa Logs returned an unexpected message response.',
    );
  });
});
