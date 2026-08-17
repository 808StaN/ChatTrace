import { extractSelectedUsername, extractUsernameFromUserCard } from './getSelectedUsername';
import { TWITCH_SELECTORS } from './selectors';

const BUTTON_ATTRIBUTE = 'data-twitch-user-logs-action';

function isLikelyUserCard(card: Element, username: string): boolean {
  if (isExplicitUserCard(card)) {
    return true;
  }

  return extractUsernameFromUserCard(card) === username;
}

function isExplicitUserCard(card: Element): boolean {
  return (
    ['user-card', 'viewer-card'].includes(card.getAttribute('data-a-target') ?? '') ||
    Boolean(card.querySelector('[data-a-target="user-card"], [data-a-target="viewer-card"]'))
  );
}

function getActionContainer(card: Element): Element {
  const actionArea = card.querySelector(TWITCH_SELECTORS.userCardActionArea);
  if (actionArea) {
    return actionArea;
  }

  const followAction = card.querySelector<HTMLButtonElement>(TWITCH_SELECTORS.followAction);
  if (followAction?.parentElement) {
    return followAction.parentElement;
  }

  const localizedFollowAction = [...card.querySelectorAll<HTMLButtonElement>('button')].find(
    (button) => /^(follow|obserwuj)$/i.test(button.textContent?.trim() ?? ''),
  );
  return localizedFollowAction?.parentElement ?? card;
}

function injectLogsButton(
  card: Element,
  username: string,
  onOpen: (username: string, card: Element) => void,
): void {
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
    onOpen(username, card);
  });

  getActionContainer(card).append(button);
}

export function observeTwitchUserCards(
  onOpen: (username: string, card: Element) => void,
): () => void {
  let selectedUsername: string | null = null;
  let frameId: number | undefined;

  const scanCards = () => {
    frameId = undefined;
    for (const card of document.querySelectorAll(TWITCH_SELECTORS.userCard)) {
      if (selectedUsername && isLikelyUserCard(card, selectedUsername)) {
        injectLogsButton(card, selectedUsername, onOpen);
        continue;
      }

      const cardUsername = extractUsernameFromUserCard(card);
      if (cardUsername && isExplicitUserCard(card)) {
        injectLogsButton(card, cardUsername, onOpen);
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

    if (
      !(event.target instanceof Element) ||
      !event.target.closest(TWITCH_SELECTORS.chatUsername)
    ) {
      return;
    }

    const chatUsernameElement = event.target.closest(TWITCH_SELECTORS.chatUsername);
    const username = extractSelectedUsername(chatUsernameElement);
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
