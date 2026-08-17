export type EmoteProvider = 'bttv' | 'ffz' | '7tv';

export interface ExternalEmote {
  name: string;
  provider: EmoteProvider;
  url: string;
}

export type ExternalEmoteLookup = Record<string, ExternalEmote>;

export type MessagePart =
  | { type: 'text'; text: string }
  | { type: 'emote'; alt: string; provider: EmoteProvider | 'twitch'; url: string };
