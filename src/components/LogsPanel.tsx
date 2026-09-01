import { useRef, useState } from 'react';
import type { CSSProperties, PointerEventHandler, RefObject } from 'react';
import { useUserLogs } from '@/hooks/useUserLogs';
import { useUserCardAnchor } from '@/hooks/useUserCardAnchor';
import { useStandalonePanel } from '@/hooks/useStandalonePanel';
import { useTwitchBadges } from '@/hooks/useTwitchBadges';
import { useChatEmotes } from '@/hooks/useChatEmotes';
import { getMessages } from '@/i18n/messages';
import { filterMessages } from '@/utils/search';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';
import { LogsHeader } from './LogsHeader';
import { LogsList } from './LogsList';
import { LogsSearch } from './LogsSearch';
import { LoadingState } from './LoadingState';

interface SharedLogsPanelProps {
  channel: string;
  username: string;
  locale: string;
  onClose: () => void;
}

interface LogsPanelProps extends SharedLogsPanelProps {
  anchor: Element;
  dragTarget: HTMLElement;
}

interface LogsPanelContentProps extends SharedLogsPanelProps {
  panelStyle: CSSProperties;
  panelRef?: RefObject<HTMLElement | null>;
  onHeaderPointerDown: PointerEventHandler<HTMLElement>;
  onHeaderPointerMove: PointerEventHandler<HTMLElement>;
  onHeaderPointerUp: PointerEventHandler<HTMLElement>;
}

function LogsPanelContent({
  channel,
  username,
  locale,
  onClose,
  panelStyle,
  panelRef,
  onHeaderPointerDown,
  onHeaderPointerMove,
  onHeaderPointerUp,
}: LogsPanelContentProps) {
  const [query, setQuery] = useState('');
  const { messages, status, isLoadingOlder, canLoadOlder, retry, loadOlder } = useUserLogs(
    channel,
    username,
  );
  const filteredMessages = filterMessages(messages, query);
  const badgeImages = useTwitchBadges(messages);
  const externalEmotes = useChatEmotes(messages);
  const t = getMessages(locale);

  return (
    <aside
      className="tul-panel"
      ref={panelRef}
      style={panelStyle}
      aria-label={t.panelAriaLabel(username, channel)}
    >
      <LogsHeader
        locale={locale}
        onClose={onClose}
        onPointerDown={onHeaderPointerDown}
        onPointerMove={onHeaderPointerMove}
        onPointerUp={onHeaderPointerUp}
      />
      <LogsSearch query={query} onChange={setQuery} locale={locale} />
      <div className="tul-content">
        {status === 'loading' && <LoadingState label={t.loading} />}
        {status === 'empty' && <EmptyState>{t.noLogs}</EmptyState>}
        {(status === 'error' || status === 'rate-limited') && (
          <ErrorState rateLimited={status === 'rate-limited'} onRetry={retry} locale={locale} />
        )}
        {status === 'ready' && filteredMessages.length === 0 && (
          <EmptyState>{t.noSearchResults}</EmptyState>
        )}
        {status === 'ready' && filteredMessages.length > 0 && (
          <LogsList
            messages={filteredMessages}
            badgeImages={badgeImages}
            externalEmotes={externalEmotes}
            locale={locale}
          />
        )}
        {status === 'ready' && canLoadOlder && (
          <button
            className="tul-load-button"
            type="button"
            disabled={isLoadingOlder}
            onClick={loadOlder}
          >
            {isLoadingOlder ? t.loading : t.loadOlder}
          </button>
        )}
      </div>
    </aside>
  );
}

export function LogsPanel({ anchor, dragTarget, ...props }: LogsPanelProps) {
  const panelRef = useRef<HTMLElement>(null);
  const positioning = useUserCardAnchor(anchor, dragTarget, panelRef);
  return <LogsPanelContent {...props} {...positioning} panelRef={panelRef} />;
}

export function StandaloneLogsPanel(props: SharedLogsPanelProps) {
  const positioning = useStandalonePanel();
  return <LogsPanelContent {...props} {...positioning} />;
}
