import { parseLogsCommand } from './logsCommand';

const CHAT_COMPOSER = [
  '[data-a-target="chat-input"][contenteditable="true"]',
  '[data-a-target="chat-input"] [contenteditable="true"]',
  'textarea[data-a-target="chat-input"]',
].join(', ');

function selectComposerText(composer: HTMLElement): void {
  if (composer instanceof HTMLTextAreaElement) {
    composer.select();
    return;
  }

  const selection = window.getSelection();
  if (!selection) {
    return;
  }

  const range = document.createRange();
  range.selectNodeContents(composer);
  selection.removeAllRanges();
  selection.addRange(range);
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
    // Twitch owns this controlled editor. The next native edit replaces the selected command.
    selectComposerText(composer);
  };

  window.addEventListener('keydown', onKeyDown, true);
  return () => window.removeEventListener('keydown', onKeyDown, true);
}
