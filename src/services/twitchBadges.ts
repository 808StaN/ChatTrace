type JsonRecord = Record<string, unknown>;

export type BadgeImageLookup = Record<string, string>;

const BADGES_BASE_URL = 'https://badges.twitch.tv/v1/badges';
let globalCatalog: Promise<BadgeImageLookup> | undefined;
const channelCatalogs = new Map<string, Promise<BadgeImageLookup>>();

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseBadgeCatalog(response: unknown): BadgeImageLookup {
  if (!isRecord(response) || !isRecord(response.badge_sets)) {
    return {};
  }

  const images: BadgeImageLookup = {};
  for (const [setId, rawSet] of Object.entries(response.badge_sets)) {
    if (!isRecord(rawSet) || !isRecord(rawSet.versions)) {
      continue;
    }

    for (const [versionId, rawVersion] of Object.entries(rawSet.versions)) {
      if (!isRecord(rawVersion) || typeof rawVersion.image_url_1x !== 'string') {
        continue;
      }
      images[`${setId}/${versionId}`] = rawVersion.image_url_1x;
    }
  }
  return images;
}

async function fetchBadgeCatalog(url: string): Promise<BadgeImageLookup> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return {};
    }
    return parseBadgeCatalog((await response.json()) as unknown);
  } catch {
    return {};
  }
}

export async function getTwitchBadgeImages(roomId: string | undefined): Promise<BadgeImageLookup> {
  globalCatalog ??= fetchBadgeCatalog(`${BADGES_BASE_URL}/global/display?language=en`);
  const globalImages = await globalCatalog;
  if (!roomId) {
    return globalImages;
  }

  let channelCatalog = channelCatalogs.get(roomId);
  if (!channelCatalog) {
    channelCatalog = fetchBadgeCatalog(
      `${BADGES_BASE_URL}/channels/${encodeURIComponent(roomId)}/display?language=en`,
    );
    channelCatalogs.set(roomId, channelCatalog);
  }
  return { ...globalImages, ...(await channelCatalog) };
}
