import { describe, expect, it } from 'vitest';
import { normalizeTwitchLogin, parseLogsCommand } from './logsCommand';

describe('parseLogsCommand', () => {
  it('returns a normalized Twitch login from a logs command', () => {
    expect(parseLogsCommand('/logs User_Name')).toBe('user_name');
  });

  it('accepts an optional at-sign before the login', () => {
    expect(parseLogsCommand('/logs @xqc')).toBe('xqc');
  });

  it('rejects commands without one valid Twitch login', () => {
    expect(parseLogsCommand('/logs')).toBeNull();
    expect(parseLogsCommand('/logs user name')).toBeNull();
    expect(parseLogsCommand('/logs user-name')).toBeNull();
  });

  it('does not intercept other Twitch commands or regular chat messages', () => {
    expect(parseLogsCommand('/block user')).toBeNull();
    expect(parseLogsCommand('hello /logs user')).toBeNull();
  });

  it('normalizes a command argument supplied by Twitch', () => {
    expect(normalizeTwitchLogin('@User_Name')).toBe('user_name');
    expect(normalizeTwitchLogin('user-name')).toBeNull();
  });
});
