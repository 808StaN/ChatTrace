import type { ExternalEmote, ExternalEmoteLookup, EmoteProvider } from './types';

type JsonRecord = Record<string, unknown>;

const GLOBAL_CATALOGS = {
  '7tv': 'https://7tv.io/v3/emote-sets/global',
  bttv: 'https://api.betterttv.net/3/cached/emotes/global',
  ffz: 'https://api.frankerfacez.com/v1/set/global',
} as const;

const channelCatalogs = new Map<string, Promise<ExternalEmoteLookup>>();
let globalCatalog: Promise<ExternalEmoteLookup> | undefined;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getString(record: JsonRecord, key: string): string | undefined {
  const value = record[key];
  return typeof value === 'string' ? value : undefined;
}

function getIdentifier(record: JsonRecord, key: string): string | undefined {
  const value = record[key];
  return typeof value === 'string' || typeof value === 'number' ? String(value) : undefined;
}

function imageUrl(provider: EmoteProvider, id: string): string {
  switch (provider) {
    case '7tv':
      return `https://cdn.7tv.app/emote/${encodeURIComponent(id)}/1x.webp`;
    case 'bttv':
      return `https://cdn.betterttv.net/emote/${encodeURIComponent(id)}/1x`;
    case 'ffz':
      return `https://cdn.frankerfacez.com/emote/${encodeURIComponent(id)}/1`;
  }
}

function parseEmote(raw: unknown, provider: EmoteProvider): ExternalEmote | null {
  if (!isRecord(raw)) {
    return null;
  }
  const id = getIdentifier(raw, 'id');
  const name = getString(raw, 'name') ?? getString(raw, 'code');
  if (!id || !name) {
    return null;
  }
  return { name, provider, url: imageUrl(provider, id) };
}

function parseEmoteArray(raw: unknown, provider: EmoteProvider): ExternalEmote[] {
  return Array.isArray(raw)
    ? raw.flatMap((emote) => {
        const parsed = parseEmote(emote, provider);
        return parsed ? [parsed] : [];
      })
    : [];
}

function parseSevenTv(raw: unknown): ExternalEmote[] {
  return isRecord(raw) ? parseEmoteArray(raw.emotes, '7tv') : [];
}

function parseBttvChannel(raw: unknown): ExternalEmote[] {
  if (!isRecord(raw)) {
    return [];
  }
  return [
    ...parseEmoteArray(raw.channelEmotes, 'bttv'),
    ...parseEmoteArray(raw.sharedEmotes, 'bttv'),
  ];
}

function parseFfz(raw: unknown): ExternalEmote[] {
  if (!isRecord(raw) || !isRecord(raw.sets)) {
    return [];
  }
  return Object.values(raw.sets).flatMap((set) =>
    isRecord(set) ? parseEmoteArray(set.emoticons, 'ffz') : [],
  );
}

async function fetchJson(url: string): Promise<unknown> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    return response.ok ? ((await response.json()) as unknown) : undefined;
  } catch {
    return undefined;
  }
}

function toLookup(emotes: ExternalEmote[]): ExternalEmoteLookup {
  const lookup: ExternalEmoteLookup = {};
  for (const emote of emotes) {
    lookup[emote.name] = emote;
  }
  return lookup;
}

async function loadGlobalCatalog(): Promise<ExternalEmoteLookup> {
  const [sevenTv, bttv, ffz] = await Promise.all([
    fetchJson(GLOBAL_CATALOGS['7tv']),
    fetchJson(GLOBAL_CATALOGS.bttv),
    fetchJson(GLOBAL_CATALOGS.ffz),
  ]);
  return toLookup([...parseFfz(ffz), ...parseEmoteArray(bttv, 'bttv'), ...parseSevenTv(sevenTv)]);
}

async function loadChannelCatalog(roomId: string): Promise<ExternalEmoteLookup> {
  const encodedRoomId = encodeURIComponent(roomId);
  const [sevenTv, bttv, ffz] = await Promise.all([
    fetchJson(`https://7tv.io/v3/users/twitch/${encodedRoomId}`),
    fetchJson(`https://api.betterttv.net/3/cached/users/twitch/${encodedRoomId}`),
    fetchJson(`https://api.frankerfacez.com/v1/room/id/${encodedRoomId}`),
  ]);
  return toLookup([
    ...parseFfz(ffz),
    ...parseBttvChannel(bttv),
    ...parseSevenTv(
      isRecord(sevenTv) && isRecord(sevenTv.emote_set) ? sevenTv.emote_set : undefined,
    ),
  ]);
}

export async function getExternalEmotes(roomId: string | undefined): Promise<ExternalEmoteLookup> {
  globalCatalog ??= loadGlobalCatalog();
  const globalEmotes = await globalCatalog;
  if (!roomId) {
    return globalEmotes;
  }

  let channelCatalog = channelCatalogs.get(roomId);
  if (!channelCatalog) {
    channelCatalog = loadChannelCatalog(roomId);
    channelCatalogs.set(roomId, channelCatalog);
  }
  return { ...globalEmotes, ...(await channelCatalog) };
}
