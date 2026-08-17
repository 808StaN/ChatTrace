import { describe, expect, it } from 'vitest';
import type { ChatMessage } from '@/services/logs';
import { tokenizeMessage } from './tokenize';

const message: ChatMessage = {
  username: 'viewer',
  timestamp: new Date('2026-08-17T12:00:00Z'),
  text: 'Kappa OMEGALUL hello',
  emotes: [{ id: '25', start: 0, end: 4 }],
};

describe('tokenizeMessage', () => {
  it('preserves text while replacing native and external emotes safely', () => {
    expect(
      tokenizeMessage(message, {
        OMEGALUL: { name: 'OMEGALUL', provider: 'bttv', url: 'https://cdn.example.test/omegalul' },
      }),
    ).toEqual([
      {
        type: 'emote',
        alt: 'Kappa',
        provider: 'twitch',
        url: 'https://static-cdn.jtvnw.net/emotes/v2/25/default/dark/1.0',
      },
      { type: 'text', text: ' ' },
      {
        type: 'emote',
        alt: 'OMEGALUL',
        provider: 'bttv',
        url: 'https://cdn.example.test/omegalul',
      },
      { type: 'text', text: ' ' },
      { type: 'text', text: 'hello' },
    ]);
  });
});
