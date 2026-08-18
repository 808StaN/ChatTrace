import { getMessages } from '@/i18n/messages';

export function ErrorState({
  rateLimited,
  onRetry,
  locale,
}: {
  rateLimited: boolean;
  onRetry: () => void;
  locale: string;
}) {
  const t = getMessages(locale);
  return (
    <div className="tul-state tul-state-muted">
      <span>{rateLimited ? t.rateLimited : t.loadError}</span>
      <button className="tul-text-button" type="button" onClick={onRetry}>
        {t.retry}
      </button>
    </div>
  );
}
