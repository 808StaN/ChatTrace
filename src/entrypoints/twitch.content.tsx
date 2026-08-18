import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';
import { LogsPanel } from '@/components/LogsPanel';
import { getCurrentChannel, observeCurrentChannel } from '@/twitch/getCurrentChannel';
import { observeTwitchUserCards } from '@/twitch/observeUserCard';
import { getTwitchLocale } from '@/twitch/getTwitchLocale';
import '@/styles/twitch-theme.css';

interface LogsContext {
  anchor: Element;
  channel: string;
  username: string;
}

function TwitchLogsApp() {
  const [context, setContext] = useState<LogsContext | null>(null);
  const [locale, setLocale] = useState(() => getTwitchLocale());

  useEffect(() => {
    const anchor = context?.anchor;
    if (!anchor) {
      return;
    }

    const closeWhenCardIsGone = () => {
      const style = window.getComputedStyle(anchor);
      const isHidden =
        style.display === 'none' ||
        style.visibility === 'hidden' ||
        anchor.getClientRects().length === 0;
      if (!anchor.isConnected || isHidden) {
        setContext((current) => (current?.anchor === anchor ? null : current));
      }
    };

    const observer = new MutationObserver(closeWhenCardIsGone);
    observer.observe(document.body, { attributes: true, childList: true, subtree: true });
    return () => observer.disconnect();
  }, [context?.anchor]);

  useEffect(() => {
    const userCards = observeTwitchUserCards(locale, (username, anchor) => {
      const channel = getCurrentChannel();
      if (channel) {
        setContext({ anchor, channel, username });
      }
    });
    const stopChannelObserver = observeCurrentChannel((channel) => {
      setContext((current) => (current?.channel === channel ? current : null));
    });

    const onLangChange = () => {
      const nextLocale = getTwitchLocale();
      setLocale(nextLocale);
      userCards.updateLocale(nextLocale);
    };
    const langObserver = new MutationObserver(onLangChange);
    langObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

    return () => {
      userCards.stop();
      stopChannelObserver();
      langObserver.disconnect();
    };
  }, [locale]);

  return context ? (
    <LogsPanel
      key={`${context.channel}:${context.username}`}
      anchor={context.anchor}
      channel={context.channel}
      username={context.username}
      locale={locale}
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
