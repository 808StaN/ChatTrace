import { extractSelectedUsername, extractUsernameFromUserCard } from './getSelectedUsername';
import { TWITCH_SELECTORS } from './selectors';

const BUTTON_ATTRIBUTE = 'data-twitch-user-logs-action';

function isLikelyUserCard(card: Element, username: string): boolean {
  if (card.getAttribute('data-a-target') === 'user-card' || card.querySelector('[data-a-target="user-card"]')) {
    return true;
  }

  return extractUsernameFromUserCard(card) === username;
}

function injectLogsButton(card: Element, username: string, onOpen: (username: string) => void): void {
  if (card.querySelector(`[${BUTTON_ATTRIBUTE}]`)) {
    return;
  }

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'tul-card-button';
  button.setAttribute(BUTTON_ATTRIBUTE, '');
  button.textContent = 'Logs';
  button.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    onOpen(username);
  });

  const actionArea = card.querySelector(TWITCH_SELECTORS.userCardActionArea);
  const existingButton = card.querySelector('button');
  const container = actionArea ?? existingButton?.parentElement ?? card;
  container.append(button);
}

export function observeTwitchUserCards(onOpen: (username: string) => void): () => void {
  let selectedUsername: string | null = null;
  let frameId: number | undefined;

  const scanCards = () => {
    frameId = undefined;
    if (!selectedUsername) {
      return;
    }

    for (const card of document.querySelectorAll(TWITCH_SELECTORS.userCard)) {
      if (isLikelyUserCard(card, selectedUsername)) {
        injectLogsButton(card, selectedUsername, onOpen);
      }
    }
  };

  const scheduleScan = () => {
    if (frameId === undefined) {
      frameId = window.requestAnimationFrame(scanCards);
    }
  };

  const onDocumentClick = (event: MouseEvent) => {
    if (event.target instanceof Element && event.target.closest(`[${BUTTON_ATTRIBUTE}]`)) {
      return;
    }

    if (!(event.target instanceof Element) || !event.target.closest(TWITCH_SELECTORS.chatUsername)) {
      return;
    }

    const username = extractSelectedUsername(event.target);
    if (username) {
      selectedUsername = username;
      scheduleScan();
    }
  };

  document.addEventListener('click', onDocumentClick, true);
  const observer = new MutationObserver(scheduleScan);
  observer.observe(document.body, { childList: true, subtree: true });
  scheduleScan();

  return () => {
    document.removeEventListener('click', onDocumentClick, true);
    observer.disconnect();
    if (frameId !== undefined) {
      window.cancelAnimationFrame(frameId);
    }
  };
}
