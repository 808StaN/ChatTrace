import { describe, expect, it } from 'vitest';
import { getOlderPageRequest } from './pagination';

const dates = [
  { year: 2026, month: 8 },
  { year: 2026, month: 7 },
];

describe('getOlderPageRequest', () => {
  it('continues within the current Supa Logs period when a local offset exists', () => {
    expect(getOlderPageRequest(dates, 0, 50)).toEqual({
      period: dates[0],
      periodIndex: 0,
      offset: 50,
    });
  });

  it('moves to the preceding available period after exhausting the current period', () => {
    expect(getOlderPageRequest(dates, 0, undefined)).toEqual({
      period: dates[1],
      periodIndex: 1,
      offset: undefined,
    });
    expect(getOlderPageRequest(dates, 1, undefined)).toBeNull();
  });
});
