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
