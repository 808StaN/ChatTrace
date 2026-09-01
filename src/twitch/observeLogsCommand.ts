import { parseLogsCommand } from './logsCommand';

const CHAT_COMPOSER = [
  '[data-a-target="chat-input"][contenteditable="true"]',
  '[data-a-target="chat-input"] [contenteditable="true"]',
  'textarea[data-a-target="chat-input"]',
].join(', ');

function clearComposer(composer: HTMLElement): void {
  if (composer instanceof HTMLTextAreaElement) {
    composer.value = '';
  } else {
    composer.replaceChildren();
  }

  composer.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' }));
}

function getComposerText(composer: HTMLElement): string {
  return composer instanceof HTMLTextAreaElement ? composer.value : composer.innerText;
}

export function observeLogsCommand(onCommand: (username: string) => boolean): () => void {
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

    const username = parseLogsCommand(getComposerText(composer));
    if (!username || !onCommand(username)) {
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();
    clearComposer(composer);
  };

  window.addEventListener('keydown', onKeyDown, true);
  return () => window.removeEventListener('keydown', onKeyDown, true);
}
