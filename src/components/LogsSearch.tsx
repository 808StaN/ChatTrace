import { getMessages } from '@/i18n/messages';

interface LogsSearchProps {
  query: string;
  onChange: (query: string) => void;
  locale: string;
}

export function LogsSearch({ query, onChange, locale }: LogsSearchProps) {
  const t = getMessages(locale);
  return (
    <div className="tul-search">
      <input
        type="search"
        value={query}
        onChange={(event) => onChange(event.target.value)}
        placeholder={t.searchPlaceholder}
        aria-label={t.searchAriaLabel}
      />
      {query && (
        <button type="button" aria-label={t.clearSearch} onClick={() => onChange('')}>
          {t.clearSearch}
        </button>
      )}
    </div>
  );
}
