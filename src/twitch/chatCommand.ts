import { normalizeTwitchLogin } from './logsCommand';

export interface TwitchChatCommand {
  commandArgs: Array<{ isRequired: boolean; name: string }>;
  description: string;
  group: string;
  handler: (username: string) => void;
  helpText: string;
  name: string;
  permissionLevel: number;
}

export interface ReactFiber {
  memoizedProps?: unknown;
  pendingProps?: unknown;
  return: ReactFiber | null;
}

interface TwitchChatCommandStore {
  addCommand: (command: TwitchChatCommand) => void;
  getCommands: (permissionLevel: number) => unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isCommandStore(value: unknown): value is TwitchChatCommandStore {
  return (
    isRecord(value) &&
    typeof value.addCommand === 'function' &&
    typeof value.getCommands === 'function'
  );
}

export function findChatCommandStore(fiber: ReactFiber | null): TwitchChatCommandStore | null {
  // Twitch can add wrappers between the chat root and the command provider.
  for (; fiber; fiber = fiber.return) {
    for (const props of [fiber.memoizedProps, fiber.pendingProps]) {
      if (isRecord(props) && isCommandStore(props.value)) {
        return props.value;
      }
    }
  }

  return null;
}

export function ensureLogsChatCommand(
  store: TwitchChatCommandStore,
  locale: string,
  onOpen: (username: string) => void,
): void {
  const commands = store.getCommands(0);
  if (Array.isArray(commands) && !commands.some((command) => command?.name === 'logs')) {
    store.addCommand(createLogsChatCommand(locale, onOpen));
  }
}

function getDescription(locale: string): string {
  return locale.toLowerCase().startsWith('pl')
    ? 'Otwórz historię czatu użytkownika w ChatTrace.'
    : 'Open ChatTrace history for a user.';
}

function getHelpText(locale: string): string {
  return locale.toLowerCase().startsWith('pl') ? 'Brak nazwy użytkownika.' : 'Missing username.';
}

export function createLogsChatCommand(
  locale: string,
  onOpen: (username: string) => void,
): TwitchChatCommand {
  return {
    commandArgs: [{ isRequired: true, name: 'username' }],
    description: getDescription(locale),
    group: 'twitch',
    handler: (value) => {
      const username = normalizeTwitchLogin(value);
      if (username) {
        onOpen(username);
      }
    },
    helpText: getHelpText(locale),
    name: 'logs',
    permissionLevel: 0,
  };
}
