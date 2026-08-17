import { useState } from 'react';
import { useUserLogs } from '@/hooks/useUserLogs';
import { filterMessages } from '@/utils/search';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';
import { LogsHeader } from './LogsHeader';
import { LogsList } from './LogsList';
import { LogsSearch } from './LogsSearch';
import { LoadingState } from './LoadingState';

interface LogsPanelProps {
  channel: string;
  username: string;
  onClose: () => void;
}

export function LogsPanel({ channel, username, onClose }: LogsPanelProps) {
  const [query, setQuery] = useState('');
  const { messages, status, isLoadingOlder, canLoadOlder, retry, loadOlder } = useUserLogs(
    channel,
    username,
  );
  const filteredMessages = filterMessages(messages, query);

  return (
    <aside className="tul-panel" aria-label={`Logs for ${username} in ${channel}`}>
      <LogsHeader channel={channel} username={username} onClose={onClose} />
      <LogsSearch query={query} onChange={setQuery} />
      <div className="tul-content">
        {status === 'loading' && <LoadingState />}
        {status === 'empty' && (
          <EmptyState>No logs found for this user on this channel.</EmptyState>
        )}
        {(status === 'error' || status === 'rate-limited') && (
          <ErrorState rateLimited={status === 'rate-limited'} onRetry={retry} />
        )}
        {status === 'ready' && filteredMessages.length === 0 && (
          <EmptyState>No loaded messages match your search.</EmptyState>
        )}
        {status === 'ready' && filteredMessages.length > 0 && (
          <LogsList messages={filteredMessages} />
        )}
        {status === 'ready' && canLoadOlder && (
          <button
            className="tul-load-button"
            type="button"
            disabled={isLoadingOlder}
            onClick={loadOlder}
          >
            {isLoadingOlder ? 'Loading...' : 'Load older messages'}
          </button>
        )}
      </div>
    </aside>
  );
}
