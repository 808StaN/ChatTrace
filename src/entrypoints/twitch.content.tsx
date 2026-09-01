import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';
import { LogsPanel, StandaloneLogsPanel } from '@/components/LogsPanel';
import { getCurrentChannel, observeCurrentChannel } from '@/twitch/getCurrentChannel';
import { observeTwitchUserCards } from '@/twitch/observeUserCard';
import { observeLogsCommand } from '@/twitch/observeLogsCommand';
import { getTwitchLocale } from '@/twitch/getTwitchLocale';
import '@/styles/twitch-theme.css';

interface CardLogsContext {
  kind: 'card';
  anchor: Element;
  dragTarget: HTMLElement;
  channel: string;
  username: string;
}

interface CommandLogsContext {
  kind: 'command';
  channel: string;
  username: string;
}

type LogsContext = CardLogsContext | CommandLogsContext;

function TwitchLogsApp() {
  const [context, setContext] = useState<LogsContext | null>(null);
  const [locale, setLocale] = useState(() => getTwitchLocale());
  const cardAnchor = context?.kind === 'card' ? context.anchor : undefined;

  useEffect(() => {
    const anchor = cardAnchor;
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
        setContext((current) =>
          current?.kind === 'card' && current.anchor === anchor ? null : current,
        );
      }
    };

    const observer = new MutationObserver(closeWhenCardIsGone);
    observer.observe(document.body, { attributes: true, childList: true, subtree: true });
    return () => observer.disconnect();
  }, [cardAnchor]);

  useEffect(() => {
    const userCards = observeTwitchUserCards(locale, (username, anchor, dragTarget) => {
      const channel = getCurrentChannel();
      if (channel) {
        setContext({ kind: 'card', anchor, dragTarget, channel, username });
      }
    });
    const stopLogsCommandObserver = observeLogsCommand((username) => {
      const channel = getCurrentChannel();
      if (!channel) {
        return;
      }

      setContext({ kind: 'command', channel, username });
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
      stopLogsCommandObserver();
      stopChannelObserver();
      langObserver.disconnect();
    };
  }, [locale]);

  if (!context) {
    return null;
  }

  return context.kind === 'card' ? (
    <LogsPanel
      key={`${context.channel}:${context.username}`}
      anchor={context.anchor}
      dragTarget={context.dragTarget}
      channel={context.channel}
      username={context.username}
      locale={locale}
      onClose={() => setContext(null)}
    />
  ) : (
    <StandaloneLogsPanel
      key={`${context.channel}:${context.username}`}
      channel={context.channel}
      username={context.username}
      locale={locale}
      onClose={() => setContext(null)}
    />
  );
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
