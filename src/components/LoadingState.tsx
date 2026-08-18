export function LoadingState({ label }: { label: string }) {
  return (
    <div className="tul-state" role="status">
      <span className="tul-spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
