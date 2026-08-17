interface LogsSearchProps {
  query: string;
  onChange: (query: string) => void;
}

export function LogsSearch({ query, onChange }: LogsSearchProps) {
  return (
    <div className="tul-search">
      <input
        type="search"
        value={query}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search messages..."
        aria-label="Search loaded messages"
      />
      {query && (
        <button type="button" aria-label="Clear search" onClick={() => onChange('')}>
          Clear
        </button>
      )}
    </div>
  );
}
