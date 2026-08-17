import { useState } from 'react';
import { useUserLogs } from '@/hooks/useUserLogs';
import { useUserCardAnchor } from '@/hooks/useUserCardAnchor';
import { useTwitchBadges } from '@/hooks/useTwitchBadges';
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
  anchor: Element;
  onClose: () => void;
}

export function LogsPanel({ channel, username, anchor, onClose }: LogsPanelProps) {
  const [query, setQuery] = useState('');
  const { messages, status, isLoadingOlder, canLoadOlder, retry, loadOlder } = useUserLogs(
    channel,
    username,
  );
  const filteredMessages = filterMessages(messages, query);
  const badgeImages = useTwitchBadges(messages);
  const { onHeaderPointerDown, onHeaderPointerMove, onHeaderPointerUp, panelStyle } =
    useUserCardAnchor(anchor);

  return (
    <aside
      className="tul-panel"
      style={panelStyle}
      aria-label={`Logs for ${username} in ${channel}`}
    >
      <LogsHeader
        onClose={onClose}
        onPointerDown={onHeaderPointerDown}
        onPointerMove={onHeaderPointerMove}
        onPointerUp={onHeaderPointerUp}
      />
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
          <LogsList messages={filteredMessages} badgeImages={badgeImages} />
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
