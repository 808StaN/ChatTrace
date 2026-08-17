import { useEffect, useState } from 'react';
import type { ChatMessage } from '@/services/logs';
import { getTwitchBadgeImages, type BadgeImageLookup } from '@/services/twitchBadges';

const EMPTY_BADGES: BadgeImageLookup = {};

export function useTwitchBadges(messages: ChatMessage[]): BadgeImageLookup {
  const roomId = messages.find((message) => message.roomId)?.roomId;
  const [badgeImages, setBadgeImages] = useState<BadgeImageLookup>(EMPTY_BADGES);

  useEffect(() => {
    let active = true;
    void getTwitchBadgeImages(roomId).then((images) => {
      if (active) {
        setBadgeImages(images);
      }
    });
    return () => {
      active = false;
    };
  }, [roomId]);

  return badgeImages;
}
