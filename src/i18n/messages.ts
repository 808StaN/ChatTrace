export type LocaleKey = 'en' | 'pl';

export interface TranslationMessages {
  userCardAction: string;
  panelAriaLabel: (username: string, channel: string) => string;
  panelTitle: string;
  closePanel: string;
  searchPlaceholder: string;
  searchAriaLabel: string;
  clearSearch: string;
  loading: string;
  noLogs: string;
  noSearchResults: string;
  loadOlder: string;
  rateLimited: string;
  loadError: string;
  retry: string;
}

export const messages: Record<LocaleKey, TranslationMessages> = {
  en: {
    userCardAction: 'Chat history',
    panelAriaLabel: (username, channel) => `Logs for ${username} in ${channel}`,
    panelTitle: 'Chat history',
    closePanel: 'Close logs',
    searchPlaceholder: 'Search messages...',
    searchAriaLabel: 'Search loaded messages',
    clearSearch: 'Clear',
    loading: 'Loading messages...',
    noLogs: 'No logs found for this user on this channel.',
    noSearchResults: 'No loaded messages match your search.',
    loadOlder: 'Load older messages',
    rateLimited: 'Too many requests. Try again shortly.',
    loadError: "Couldn't load logs.",
    retry: 'Retry',
  },
  pl: {
    userCardAction: 'Historia czatu',
    panelAriaLabel: (username, channel) => `Logi użytkownika ${username} na kanale ${channel}`,
    panelTitle: 'Historia czatu',
    closePanel: 'Zamknij logi',
    searchPlaceholder: 'Wyszukaj wiadomości...',
    searchAriaLabel: 'Wyszukaj wczytane wiadomości',
    clearSearch: 'Wyczyść',
    loading: 'Wczytywanie wiadomości...',
    noLogs: 'Brak logów dla tego użytkownika na tym kanale.',
    noSearchResults: 'Żadna wczytana wiadomość nie pasuje do wyszukiwania.',
    loadOlder: 'Wczytaj starsze wiadomości',
    rateLimited: 'Zbyt wiele żądań. Spróbuj ponownie za chwilę.',
    loadError: 'Nie udało się wczytać logów.',
    retry: 'Spróbuj ponownie',
  },
};

export function getMessages(locale: string): TranslationMessages {
  const key: LocaleKey = locale.toLowerCase().startsWith('pl') ? 'pl' : 'en';
  return messages[key];
}
