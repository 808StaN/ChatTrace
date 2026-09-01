const TWITCH_LOGIN = /^[a-z0-9_]{3,25}$/i;

export function parseLogsCommand(value: string): string | null {
  const match = /^\/logs\s+@?([^\s]+)\s*$/i.exec(value.trim());
  const username = match?.[1];
  if (!username || !TWITCH_LOGIN.test(username)) {
    return null;
  }

  return username.toLowerCase();
}
