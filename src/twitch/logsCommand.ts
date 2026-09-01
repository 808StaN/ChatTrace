const TWITCH_LOGIN = /^[a-z0-9_]{3,25}$/i;

export function normalizeTwitchLogin(value: string): string | null {
  const username = value.trim().replace(/^@/, '');
  return TWITCH_LOGIN.test(username) ? username.toLowerCase() : null;
}

export function parseLogsCommand(value: string): string | null {
  const match = /^\/logs\s+@?([^\s]+)\s*$/i.exec(value.trim());
  return match ? normalizeTwitchLogin(match[1] ?? '') : null;
}
