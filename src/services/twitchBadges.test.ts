import { describe, expect, it } from 'vitest';
import { parseBadgeCatalog } from './twitchBadges';

describe('parseBadgeCatalog', () => {
  it('maps Twitch badge set and version IDs to image URLs', () => {
    expect(
      parseBadgeCatalog({
        badge_sets: {
          subscriber: {
            versions: {
              '12': { image_url_1x: 'https://cdn.example.test/subscriber-12.png' },
            },
          },
        },
      }),
    ).toEqual({ 'subscriber/12': 'https://cdn.example.test/subscriber-12.png' });
  });

  it('ignores malformed badge records', () => {
    expect(parseBadgeCatalog({ badge_sets: { vip: { versions: { '1': {} } } } })).toEqual({});
  });
});
