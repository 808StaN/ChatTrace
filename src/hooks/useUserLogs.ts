import { useCallback, useEffect, useRef, useState } from 'react';
import { SupaLogsProvider } from '@/services/logs';
import type { AvailableLogDate, ChatMessage } from '@/services/logs';
import type { LogsProviderError } from '@/services/logs/types';
import { getOlderPageRequest } from '@/utils/pagination';

type LoadStatus = 'idle' | 'loading' | 'ready' | 'empty' | 'error' | 'rate-limited';

interface UserLogsState {
  messages: ChatMessage[];
  status: LoadStatus;
  isLoadingOlder: boolean;
  canLoadOlder: boolean;
  retry: () => void;
  loadOlder: () => void;
}

const PAGE_SIZE = 50;
const MAX_LOADED_MESSAGES = 2_000;

function appendUniqueMessages(existing: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  const knownIds = new Set(existing.map((message) => message.id ?? `${message.timestamp.valueOf()}:${message.text}`));
  const uniqueIncoming = incoming.filter((message) => {
    const key = message.id ?? `${message.timestamp.valueOf()}:${message.text}`;
    if (knownIds.has(key)) {
      return false;
    }
    knownIds.add(key);
    return true;
  });
  return [...existing, ...uniqueIncoming].sort(
    (left, right) => right.timestamp.valueOf() - left.timestamp.valueOf(),
  );
}

function isProviderError(error: unknown): error is LogsProviderError {
  return error instanceof Error && 'kind' in error;
}

export function useUserLogs(channel: string | null, username: string | null): UserLogsState {
  const [provider] = useState(() => new SupaLogsProvider());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<LoadStatus>('idle');
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [availableDates, setAvailableDates] = useState<AvailableLogDate[]>([]);
  const [periodIndex, setPeriodIndex] = useState(0);
  const [nextOffset, setNextOffset] = useState<number | undefined>();
  const [retryToken, setRetryToken] = useState(0);
  const olderRequest = useRef<AbortController | null>(null);
  const requestVersion = useRef(0);

  useEffect(() => {
    olderRequest.current?.abort();
    const version = ++requestVersion.current;
    if (!channel || !username) {
      setMessages([]);
      setStatus('idle');
      return;
    }

    const controller = new AbortController();
    let active = true;
    setMessages([]);
    setAvailableDates([]);
    setPeriodIndex(0);
    setNextOffset(undefined);
    setStatus('loading');

    void (async () => {
      try {
        const dates = await provider.getAvailableLogs(channel, username, controller.signal);
        if (!active || requestVersion.current !== version) {
          return;
        }
        if (dates.length === 0) {
          setStatus('empty');
          return;
        }
        const initialPeriod = dates[0];
        if (!initialPeriod) {
          setStatus('empty');
          return;
        }

        const firstPage = await provider.getMessages(channel, username, {
          period: initialPeriod,
          limit: PAGE_SIZE,
          signal: controller.signal,
        });
        if (!active || requestVersion.current !== version) {
          return;
        }
        setAvailableDates(dates);
        setMessages(firstPage.messages);
        setNextOffset(firstPage.nextOffset);
        setStatus(firstPage.messages.length === 0 && dates.length === 1 ? 'empty' : 'ready');
      } catch (error) {
        if (
          !active ||
          requestVersion.current !== version ||
          (error instanceof DOMException && error.name === 'AbortError')
        ) {
          return;
        }
        setStatus(isProviderError(error) && error.kind === 'rate-limited' ? 'rate-limited' : 'error');
      }
    })();

    return () => {
      active = false;
      controller.abort();
      olderRequest.current?.abort();
    };
  }, [channel, provider, retryToken, username]);

  const retry = useCallback(() => setRetryToken((token) => token + 1), []);

  const loadOlder = useCallback(() => {
    if (!channel || !username || status !== 'ready' || isLoadingOlder || availableDates.length === 0) {
      return;
    }

    const request = getOlderPageRequest(availableDates, periodIndex, nextOffset);
    if (!request) {
      return;
    }

    olderRequest.current?.abort();
    const controller = new AbortController();
    olderRequest.current = controller;
    const version = requestVersion.current;
    setIsLoadingOlder(true);
    void provider
      .getMessages(channel, username, {
        period: request.period,
        limit: Math.min(PAGE_SIZE, MAX_LOADED_MESSAGES - messages.length),
        offset: request.offset,
        signal: controller.signal,
      })
      .then((page) => {
        if (requestVersion.current !== version) {
          return;
        }
        setMessages((current) => appendUniqueMessages(current, page.messages));
        setPeriodIndex(request.periodIndex);
        setNextOffset(page.nextOffset);
      })
      .catch((error: unknown) => {
        if (requestVersion.current !== version) {
          return;
        }
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          setStatus(isProviderError(error) && error.kind === 'rate-limited' ? 'rate-limited' : 'error');
        }
      })
      .finally(() => {
        if (requestVersion.current === version) {
          setIsLoadingOlder(false);
        }
      });
  }, [availableDates, channel, isLoadingOlder, messages.length, nextOffset, periodIndex, provider, status, username]);

  return {
    messages,
    status,
    isLoadingOlder,
    canLoadOlder:
      messages.length < MAX_LOADED_MESSAGES &&
      (nextOffset !== undefined || periodIndex + 1 < availableDates.length),
    retry,
    loadOlder,
  };
}
