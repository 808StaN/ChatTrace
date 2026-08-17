import { useEffect, useState } from 'react';
import type { ChatMessage } from '@/services/logs';
import { getExternalEmotes } from '@/services/emotes/catalog';
import type { ExternalEmoteLookup } from '@/services/emotes/types';

const EMPTY_EMOTES: ExternalEmoteLookup = {};

export function useChatEmotes(messages: ChatMessage[]): ExternalEmoteLookup {
  const roomId = messages.find((message) => message.roomId)?.roomId;
  const [emotes, setEmotes] = useState<ExternalEmoteLookup>(EMPTY_EMOTES);

  useEffect(() => {
    let active = true;
    void getExternalEmotes(roomId).then((catalog) => {
      if (active) {
        setEmotes(catalog);
      }
    });
    return () => {
      active = false;
    };
  }, [roomId]);

  return emotes;
}
