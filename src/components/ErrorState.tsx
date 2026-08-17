export function ErrorState({
  rateLimited,
  onRetry,
}: {
  rateLimited: boolean;
  onRetry: () => void;
}) {
  return (
    <div className="tul-state tul-state-muted">
      <span>{rateLimited ? 'Too many requests. Try again shortly.' : "Couldn't load logs."}</span>
      <button className="tul-text-button" type="button" onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}
