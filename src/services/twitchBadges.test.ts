import { describe, expect, it } from 'vitest';
import { parseBadgeCatalog } from './twitchBadges';

describe('parseBadgeCatalog', () => {
  it('maps Twitch badge set and version IDs to image URLs', () => {
    expect(
      parseBadgeCatalog([
        {
          set_id: 'subscriber',
          versions: [{ id: '12', image_url_1x: 'https://cdn.example.test/subscriber-12.png' }],
        },
      ]),
    ).toEqual({ 'subscriber/12': 'https://cdn.example.test/subscriber-12.png' });
  });

  it('ignores malformed badge records', () => {
    expect(parseBadgeCatalog([{ set_id: 'vip', versions: [{}] }])).toEqual({});
  });
});
