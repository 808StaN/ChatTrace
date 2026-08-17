import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';
import { LogsPanel } from '@/components/LogsPanel';
import { getCurrentChannel, observeCurrentChannel } from '@/twitch/getCurrentChannel';
import { observeTwitchUserCards } from '@/twitch/observeUserCard';
import '@/styles/twitch-theme.css';

interface LogsContext {
  anchor: Element;
  channel: string;
  username: string;
}

function TwitchLogsApp() {
  const [context, setContext] = useState<LogsContext | null>(null);

  useEffect(() => {
    const stopUserCards = observeTwitchUserCards((username, anchor) => {
      const channel = getCurrentChannel();
      if (channel) {
        setContext({ anchor, channel, username });
      }
    });
    const stopChannelObserver = observeCurrentChannel((channel) => {
      setContext((current) => (current?.channel === channel ? current : null));
    });

    return () => {
      stopUserCards();
      stopChannelObserver();
    };
  }, []);

  return context ? (
    <LogsPanel
      key={`${context.channel}:${context.username}`}
      anchor={context.anchor}
      channel={context.channel}
      username={context.username}
      onClose={() => setContext(null)}
    />
  ) : null;
}

export default defineContentScript({
  matches: ['https://www.twitch.tv/*'],
  runAt: 'document_idle',
  main() {
    if (document.getElementById('twitch-user-logs-extension-root')) {
      return;
    }

    const rootElement = document.createElement('div');
    rootElement.id = 'twitch-user-logs-extension-root';
    document.body.append(rootElement);
    createRoot(rootElement).render(<TwitchLogsApp />);

    if (import.meta.env.DEV) {
      console.debug('[Twitch User Logs] content script started', { channel: getCurrentChannel() });
    }
  },
});
