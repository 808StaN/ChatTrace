import { describe, expect, it, vi } from 'vitest';
import { createLogsChatCommand } from './chatCommand';

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
