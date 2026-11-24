import { describe, expect, it, vi } from 'vitest';
import {
  createLogsChatCommand,
  ensureLogsChatCommand,
  findChatCommandStore,
  type ReactFiber,
  type TwitchChatCommand,
} from './chatCommand';

describe('findChatCommandStore', () => {
  it('finds the command provider beyond the previous 25-fiber limit', () => {
    const store = { addCommand: vi.fn(), getCommands: vi.fn() };
    let fiber: ReactFiber = {
      memoizedProps: { value: store },
      pendingProps: { value: {} },
      return: null,
    };

    for (let depth = 0; depth < 40; depth += 1) {
      fiber = { return: fiber };
    }

    expect(findChatCommandStore(fiber)).toBe(store);
  });

  it('returns null when the chat tree has no command provider', () => {
    expect(findChatCommandStore({ memoizedProps: { value: {} }, return: null })).toBeNull();
  });
});

describe('ensureLogsChatCommand', () => {
  it('registers once and restores /logs if the same store loses the command', () => {
    const commands = new Map<string, TwitchChatCommand>();
    const store = {
      addCommand: vi.fn((command: TwitchChatCommand) => commands.set(command.name, command)),
      getCommands: vi.fn((level: number) =>
        [...commands.values()].filter((command) => level >= command.permissionLevel),
      ),
    };
    const onOpen = vi.fn();

    ensureLogsChatCommand(store, 'en', onOpen);
    ensureLogsChatCommand(store, 'en', onOpen);
    expect(store.addCommand).toHaveBeenCalledOnce();

    commands.delete('logs');
    ensureLogsChatCommand(store, 'en', onOpen);
    expect(store.addCommand).toHaveBeenCalledTimes(2);
    commands.get('logs')?.handler('@User_Name');
    expect(onOpen).toHaveBeenCalledExactlyOnceWith('user_name');
  });
});

describe('createLogsChatCommand', () => {
  it('creates a native Twitch command with one required username argument', () => {
    const command = createLogsChatCommand('en', vi.fn());

    expect(command).toMatchObject({
      commandArgs: [{ isRequired: true, name: 'username' }],
      group: 'twitch',
      name: 'logs',
      permissionLevel: 0,
    });
  });

  it('passes normalized valid usernames to the command handler', () => {
    const onOpen = vi.fn();
    const command = createLogsChatCommand('pl', onOpen);

    command.handler('@User_Name');
    command.handler('not-a-login');

    expect(onOpen).toHaveBeenCalledOnce();
    expect(onOpen).toHaveBeenCalledWith('user_name');
    expect(command.description).toContain('ChatTrace');
  });
});
