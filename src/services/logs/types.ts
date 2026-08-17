export interface AvailableLogDate {
  year: number;
  month: number;
  day?: number;
}

export interface ChatBadge {
  name: string;
  version?: string;
}

export interface ChatMessage {
  id?: string;
  username: string;
  displayName?: string;
  color?: string;
  roomId?: string;
  timestamp: Date;
  text: string;
  badges?: ChatBadge[];
  raw?: unknown;
}

export interface GetMessagesOptions {
  period: AvailableLogDate;
  limit?: number;
  offset?: number;
  signal?: AbortSignal;
}

export interface ChatMessagePage {
  messages: ChatMessage[];
  period: AvailableLogDate;
  nextOffset?: number;
}

export interface LogsProvider {
  getAvailableLogs(
    channel: string,
    username: string,
    signal?: AbortSignal,
  ): Promise<AvailableLogDate[]>;
  getMessages(
    channel: string,
    username: string,
    options: GetMessagesOptions,
  ): Promise<ChatMessagePage>;
}

export type LogsErrorKind = 'not-found' | 'rate-limited' | 'network' | 'invalid-response';

export class LogsProviderError extends Error {
  constructor(
    public readonly kind: LogsErrorKind,
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'LogsProviderError';
  }
}
