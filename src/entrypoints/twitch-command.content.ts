import { LOGS_COMMAND_EVENT } from '@/twitch/logsCommandBridge';
import { createLogsChatCommand, type TwitchChatCommand } from '@/twitch/chatCommand';

const CHAT_ROOT = '.stream-chat';

interface ReactFiber {
  memoizedProps?: unknown;
  pendingProps?: unknown;
  return: ReactFiber | null;
}

interface TwitchChatCommandStore {
  addCommand: (command: TwitchChatCommand) => void;
  getCommands: () => unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getReactFiber(element: Element): ReactFiber | null {
  const fiberKey = Object.getOwnPropertyNames(element).find((key) =>
    key.startsWith('__reactFiber$'),
  );
  return fiberKey
    ? ((element as unknown as Record<string, unknown>)[fiberKey] as ReactFiber)
    : null;
}

function isCommandStore(value: unknown): value is TwitchChatCommandStore {
  return (
    isRecord(value) &&
    typeof value.addCommand === 'function' &&
    typeof value.getCommands === 'function'
  );
}

function getChatCommandStore(): TwitchChatCommandStore | null {
  const chatRoot = document.querySelector(CHAT_ROOT);
  let fiber = chatRoot ? getReactFiber(chatRoot) : null;

  for (let depth = 0; fiber && depth < 25; depth += 1) {
    const pendingProps = isRecord(fiber.pendingProps) ? fiber.pendingProps : undefined;
    const memoizedProps = isRecord(fiber.memoizedProps) ? fiber.memoizedProps : undefined;
    const commandStore = pendingProps?.value ?? memoizedProps?.value;
    if (isCommandStore(commandStore)) {
      return commandStore;
    }

    fiber = fiber.return;
  }

  return null;
}

export default defineContentScript({
  matches: ['https://www.twitch.tv/*'],
  runAt: 'document_idle',
  world: 'MAIN',
  main() {
    const registeredStores = new WeakSet<TwitchChatCommandStore>();
    let frameId: number | undefined;

    const registerCommand = () => {
      frameId = undefined;
      const commandStore = getChatCommandStore();
      if (!commandStore || registeredStores.has(commandStore)) {
        return;
      }

      commandStore.addCommand(
        createLogsChatCommand(document.documentElement.lang, (username) => {
          window.dispatchEvent(new CustomEvent(LOGS_COMMAND_EVENT, { detail: username }));
        }),
      );
      registeredStores.add(commandStore);
    };

    const scheduleRegistration = () => {
      if (frameId === undefined) {
        frameId = window.requestAnimationFrame(registerCommand);
      }
    };

    const observer = new MutationObserver(scheduleRegistration);
    observer.observe(document.body, { childList: true, subtree: true });
    scheduleRegistration();
  },
});
