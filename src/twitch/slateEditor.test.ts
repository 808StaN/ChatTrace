import { describe, expect, it } from 'vitest';
import { getSlateRange } from './slateEditor';

describe('getSlateRange', () => {
  it('selects all text in a Slate paragraph', () => {
    expect(getSlateRange([{ children: [{ text: 'logs user' }] }])).toEqual({
      anchor: { offset: 0, path: [0, 0] },
      focus: { offset: 9, path: [0, 0] },
    });
  });

  it('finds the first and final leaves across nested nodes', () => {
    expect(
      getSlateRange([
        { children: [{ text: 'first' }] },
        { children: [{ children: [{ text: 'last' }] }] },
      ]),
    ).toEqual({
      anchor: { offset: 0, path: [0, 0] },
      focus: { offset: 4, path: [1, 0, 0] },
    });
  });

  it('returns null for an empty Slate document', () => {
    expect(getSlateRange([])).toBeNull();
  });
});
