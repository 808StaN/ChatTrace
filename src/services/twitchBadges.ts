type JsonRecord = Record<string, unknown>;

export type BadgeImageLookup = Record<string, string>;

const IVR_BADGES_BASE_URL = 'https://api.ivr.fi/v2/twitch/badges';
let globalCatalog: Promise<BadgeImageLookup> | undefined;
const channelCatalogs = new Map<string, Promise<BadgeImageLookup>>();

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseBadgeCatalog(response: unknown): BadgeImageLookup {
  if (!Array.isArray(response)) {
    return {};
  }

  const images: BadgeImageLookup = {};
  for (const rawSet of response) {
    if (!isRecord(rawSet) || typeof rawSet.set_id !== 'string' || !Array.isArray(rawSet.versions)) {
      continue;
    }

    for (const rawVersion of rawSet.versions) {
      if (
        !isRecord(rawVersion) ||
        typeof rawVersion.id !== 'string' ||
        typeof rawVersion.image_url_1x !== 'string'
      ) {
        continue;
      }
      images[`${rawSet.set_id}/${rawVersion.id}`] = rawVersion.image_url_1x;
    }
  }
  return images;
}

async function fetchBadgeCatalog(url: string): Promise<BadgeImageLookup> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!response.ok) {
      return {};
    }
    return parseBadgeCatalog((await response.json()) as unknown);
  } catch {
    return {};
  }
}

export async function getTwitchBadgeImages(roomId: string | undefined): Promise<BadgeImageLookup> {
  globalCatalog ??= fetchBadgeCatalog(`${IVR_BADGES_BASE_URL}/global`);
  const globalImages = await globalCatalog;
  if (!roomId) {
    return globalImages;
  }

  let channelCatalog = channelCatalogs.get(roomId);
  if (!channelCatalog) {
    channelCatalog = fetchBadgeCatalog(
      `${IVR_BADGES_BASE_URL}/channel?id=${encodeURIComponent(roomId)}`,
    );
    channelCatalogs.set(roomId, channelCatalog);
  }
  return { ...globalImages, ...(await channelCatalog) };
}
