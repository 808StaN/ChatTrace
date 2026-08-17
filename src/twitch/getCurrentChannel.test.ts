import { describe, expect, it } from 'vitest';
import { getCurrentChannel } from './getCurrentChannel';

describe('getCurrentChannel', () => {
  it('returns a normalized channel login from a channel URL', () => {
    expect(getCurrentChannel('https://www.twitch.tv/ewroon')).toBe('ewroon');
    expect(getCurrentChannel('https://www.twitch.tv/Some_Channel?foo=bar')).toBe('some_channel');
  });

  it('rejects Twitch routes that are not channels', () => {
    expect(getCurrentChannel('https://www.twitch.tv/directory')).toBeNull();
    expect(getCurrentChannel('https://www.twitch.tv/settings')).toBeNull();
    expect(getCurrentChannel('https://www.twitch.tv/videos/123')).toBeNull();
  });

  it('rejects invalid and non-Twitch URLs', () => {
    expect(getCurrentChannel('https://example.com/ewroon')).toBeNull();
    expect(getCurrentChannel('not-a-url')).toBeNull();
    expect(getCurrentChannel('https://www.twitch.tv/a')).toBeNull();
  });
});
