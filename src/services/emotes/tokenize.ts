import type { ChatEmote, ChatMessage } from '@/services/logs';
import type { ExternalEmoteLookup, MessagePart } from './types';

function twitchEmoteUrl(id: string): string {
  return `https://static-cdn.jtvnw.net/emotes/v2/${encodeURIComponent(id)}/default/dark/1.0`;
}

function appendTextParts(parts: MessagePart[], text: string, emotes: ExternalEmoteLookup): void {
  for (const token of text.split(/(\s+)/)) {
    if (!token) {
      continue;
    }
    const emote = emotes[token];
    if (emote) {
      parts.push({ type: 'emote', alt: emote.name, provider: emote.provider, url: emote.url });
    } else {
      parts.push({ type: 'text', text: token });
    }
  }
}

function validEmotes(emotes: ChatEmote[] | undefined, text: string): ChatEmote[] {
  return (emotes ?? [])
    .filter((emote) => emote.end < text.length)
    .sort((left, right) => left.start - right.start);
}

export function tokenizeMessage(
  message: ChatMessage,
  externalEmotes: ExternalEmoteLookup,
): MessagePart[] {
  const parts: MessagePart[] = [];
  let cursor = 0;
  for (const emote of validEmotes(message.emotes, message.text)) {
    if (emote.start < cursor) {
      continue;
    }
    appendTextParts(parts, message.text.slice(cursor, emote.start), externalEmotes);
    parts.push({
      type: 'emote',
      alt: message.text.slice(emote.start, emote.end + 1),
      provider: 'twitch',
      url: twitchEmoteUrl(emote.id),
    });
    cursor = emote.end + 1;
  }
  appendTextParts(parts, message.text.slice(cursor), externalEmotes);
  return parts;
}
