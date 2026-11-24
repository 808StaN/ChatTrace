import { LOGS_COMMAND_EVENT } from '@/twitch/logsCommandBridge';
import { ensureLogsChatCommand, findChatCommandStore, type ReactFiber } from '@/twitch/chatCommand';

const CHAT_ROOT = '.stream-chat';

function getReactFiber(element: Element): ReactFiber | null {
  const fiberKey = Object.getOwnPropertyNames(element).find((key) =>
    key.startsWith('__reactFiber$'),
  );
  return fiberKey
    ? ((element as unknown as Record<string, unknown>)[fiberKey] as ReactFiber)
    : null;
}

export default defineContentScript({
  matches: ['https://www.twitch.tv/*'],
  runAt: 'document_idle',
  world: 'MAIN',
  main() {
    let frameId: number | undefined;

    const registerCommand = () => {
      frameId = undefined;
      const chatRoot = document.querySelector(CHAT_ROOT);
      const commandStore = chatRoot ? findChatCommandStore(getReactFiber(chatRoot)) : null;
      if (!commandStore) {
        return;
      }

      ensureLogsChatCommand(commandStore, document.documentElement.lang, (username) => {
        window.dispatchEvent(new CustomEvent(LOGS_COMMAND_EVENT, { detail: username }));
      });
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
