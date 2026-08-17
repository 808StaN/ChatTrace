import { describe, expect, it } from 'vitest';
import { getExternalEmotes } from './catalog';

describe('external emote catalog', () => {
  it('exports a cached lookup loader', () => {
    expect(typeof getExternalEmotes).toBe('function');
  });
});
