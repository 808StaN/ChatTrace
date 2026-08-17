import {
  type AvailableLogDate,
  type ChatBadge,
  type ChatMessage,
  type ChatMessagePage,
  type GetMessagesOptions,
  LogsProviderError,
  type LogsProvider,
} from './types';

const API_BASE_URL = 'https://logs.zonian.dev';
const CACHE_TTL_MS = 5 * 60 * 1000;
const DEFAULT_PAGE_SIZE = 50;

interface CacheEntry {
  expiresAt: number;
  messages: ChatMessage[];
}

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getString(record: JsonRecord, key: string): string | undefined {
  const value = record[key];
  return typeof value === 'string' ? value : undefined;
}

function parseBadges(tags: JsonRecord | undefined): ChatBadge[] | undefined {
  const badges = tags ? getString(tags, 'badges') : undefined;
  if (!badges) {
    return undefined;
  }

  return badges.split(',').flatMap((badge) => {
    const [name, version] = badge.split('/');
    return name ? [{ name, version }] : [];
  });
}

function parseNameColor(tags: JsonRecord | undefined): string | undefined {
  const color = tags ? getString(tags, 'color') : undefined;
  return color && /^#[0-9a-f]{6}$/i.test(color) ? color : undefined;
}

function normalizeMessage(raw: unknown, username: string): ChatMessage | null {
  if (!isRecord(raw)) {
    return null;
  }

  const text = getString(raw, 'text');
  const timestampValue = getString(raw, 'timestamp');
  if (text === undefined || !timestampValue) {
    return null;
  }

  const timestamp = new Date(timestampValue);
  if (Number.isNaN(timestamp.valueOf())) {
    return null;
  }

  const tags = isRecord(raw.tags) ? raw.tags : undefined;
  return {
    id: getString(raw, 'id') ?? (tags ? getString(tags, 'id') : undefined),
    username,
    displayName:
      getString(raw, 'displayName') ?? (tags ? getString(tags, 'display-name') : undefined),
    color: parseNameColor(tags),
    roomId: tags ? getString(tags, 'room-id') : undefined,
    timestamp,
    text,
    badges: parseBadges(tags),
    raw,
  };
}

export function normalizeSupaMessages(response: unknown, username: string): ChatMessage[] {
  if (!isRecord(response) || !Array.isArray(response.messages)) {
    throw new LogsProviderError(
      'invalid-response',
      'Supa Logs returned an unexpected message response.',
    );
  }

  return response.messages
    .map((message) => normalizeMessage(message, username))
    .filter((message): message is ChatMessage => message !== null)
    .sort((left, right) => right.timestamp.valueOf() - left.timestamp.valueOf());
}

function normalizeAvailableDates(response: unknown): AvailableLogDate[] {
  if (!isRecord(response) || !Array.isArray(response.availableLogs)) {
    throw new LogsProviderError(
      'invalid-response',
      'Supa Logs returned an unexpected availability response.',
    );
  }

  const availableDates = response.availableLogs.flatMap((rawDate) => {
    if (!isRecord(rawDate)) {
      return [];
    }

    const year = Number(rawDate.year);
    const month = Number(rawDate.month);
    const day = rawDate.day === undefined ? undefined : Number(rawDate.day);
    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
      return [];
    }
    if (day !== undefined && (!Number.isInteger(day) || day < 1 || day > 31)) {
      return [];
    }

    return [{ year, month, day }];
  });

  return availableDates.sort((left, right) => {
    const leftKey = left.year * 10_000 + left.month * 100 + (left.day ?? 0);
    const rightKey = right.year * 10_000 + right.month * 100 + (right.day ?? 0);
    return rightKey - leftKey;
  });
}

function periodPath(period: AvailableLogDate): string {
  const year = String(period.year);
  const month = String(period.month).padStart(2, '0');
  const day = period.day === undefined ? '' : `/${String(period.day).padStart(2, '0')}`;
  return `${year}/${month}${day}`;
}

function cacheKey(channel: string, username: string, period: AvailableLogDate): string {
  return `${channel}:${username}:${periodPath(period)}`;
}

async function parseResponse(response: Response): Promise<unknown> {
  try {
    return (await response.json()) as unknown;
  } catch {
    throw new LogsProviderError(
      'invalid-response',
      'Supa Logs returned invalid JSON.',
      response.status,
    );
  }
}

function getResponseError(response: Response): LogsProviderError {
  if (response.status === 404) {
    return new LogsProviderError(
      'not-found',
      'No logs found for this user on this channel.',
      response.status,
    );
  }
  if (response.status === 429) {
    return new LogsProviderError(
      'rate-limited',
      'Too many requests. Try again shortly.',
      response.status,
    );
  }
  return new LogsProviderError('network', 'Could not load logs.', response.status);
}

/**
 * API contract verified against the tv.supa.sh production client on 2026-08-17.
 * Supa's UI uses logs.zonian.dev as its structured, CORS-enabled logs endpoint.
 */
export class SupaLogsProvider implements LogsProvider {
  private readonly messageCache = new Map<string, CacheEntry>();

  async getAvailableLogs(
    channel: string,
    username: string,
    signal?: AbortSignal,
  ): Promise<AvailableLogDate[]> {
    const query = new URLSearchParams({
      channel: channel.toLowerCase(),
      user: username.toLowerCase(),
    });
    const response = await this.fetch(`${API_BASE_URL}/list?${query}`, signal);
    return normalizeAvailableDates(await parseResponse(response));
  }

  async getMessages(
    channel: string,
    username: string,
    options: GetMessagesOptions,
  ): Promise<ChatMessagePage> {
    const normalizedChannel = channel.toLowerCase();
    const normalizedUsername = username.toLowerCase();
    const key = cacheKey(normalizedChannel, normalizedUsername, options.period);
    const cached = this.messageCache.get(key);
    const messages =
      cached && cached.expiresAt > Date.now()
        ? cached.messages
        : await this.fetchPeriod(
            normalizedChannel,
            normalizedUsername,
            options.period,
            options.signal,
          );

    const offset = options.offset ?? 0;
    const limit = options.limit ?? DEFAULT_PAGE_SIZE;
    const pageMessages = messages.slice(offset, offset + limit);
    const nextOffset = offset + pageMessages.length;
    return {
      messages: pageMessages,
      period: options.period,
      nextOffset: nextOffset < messages.length ? nextOffset : undefined,
    };
  }

  private async fetchPeriod(
    channel: string,
    username: string,
    period: AvailableLogDate,
    signal?: AbortSignal,
  ): Promise<ChatMessage[]> {
    const path = `/channel/${encodeURIComponent(channel)}/user/${encodeURIComponent(username)}/${periodPath(period)}`;
    const response = await this.fetch(`${API_BASE_URL}${path}?jsonBasic=1`, signal);
    const messages = normalizeSupaMessages(await parseResponse(response), username);
    this.messageCache.set(cacheKey(channel, username, period), {
      messages,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });
    return messages;
  }

  private async fetch(url: string, signal?: AbortSignal): Promise<Response> {
    let response: Response;
    try {
      response = await fetch(url, { signal });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw error;
      }
      throw new LogsProviderError('network', 'Could not load logs.');
    }

    if (!response.ok) {
      throw getResponseError(response);
    }
    return response;
  }
}
