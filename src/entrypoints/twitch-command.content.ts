import { LOGS_COMMAND_EVENT } from '@/twitch/logsCommandBridge';
import { parseLogsCommand } from '@/twitch/logsCommand';
import { clearSlateEditor } from '@/twitch/slateEditor';

const CHAT_COMPOSER = '[data-slate-editor="true"][data-a-target="chat-input"]';

interface ReactFiber {
  memoizedProps?: unknown;
  memoizedState?: { memoizedState?: unknown };
  return: ReactFiber | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getSlateEditor(composer: HTMLElement) {
  const fiberKey = Object.getOwnPropertyNames(composer).find((key) =>
    key.startsWith('__reactFiber$'),
  );
  let fiber = fiberKey
    ? ((composer as unknown as Record<string, unknown>)[fiberKey] as ReactFiber)
    : null;

  while (fiber) {
    const props = isRecord(fiber.memoizedProps) ? fiber.memoizedProps : undefined;
    const state = isRecord(fiber.memoizedState?.memoizedState)
      ? fiber.memoizedState.memoizedState
      : undefined;
    const editor = props?.editor ?? state?.editor;
    if (
      isRecord(editor) &&
      Array.isArray(editor.children) &&
      typeof editor.delete === 'function' &&
      typeof editor.select === 'function'
    ) {
      return editor as unknown as Parameters<typeof clearSlateEditor>[0];
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
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key !== 'Enter' ||
        event.shiftKey ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.isComposing ||
        !(event.target instanceof HTMLElement)
      ) {
        return;
      }

      const composer = event.target.closest<HTMLElement>(CHAT_COMPOSER);
      if (!composer) {
        return;
      }

      const username = parseLogsCommand(composer.innerText);
      if (!username) {
        return;
      }

      const editor = getSlateEditor(composer);
      if (!editor || !clearSlateEditor(editor)) {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();
      window.dispatchEvent(new CustomEvent(LOGS_COMMAND_EVENT, { detail: username }));
    };

    window.addEventListener('keydown', onKeyDown, true);
  },
});
