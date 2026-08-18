import { getMessages } from '@/i18n/messages';
import { extractSelectedUsername, extractUsernameFromUserCard } from './getSelectedUsername';
import { TWITCH_SELECTORS } from './selectors';

const BUTTON_ATTRIBUTE = 'data-twitch-user-logs-action';
const USER_CARD_SURFACE =
  '[data-a-target="user-card"], [data-a-target="viewer-card"], [data-test-selector*="user-card"]';

function isLikelyUserCard(card: Element, username: string): boolean {
  if (isExplicitUserCard(card)) {
    return true;
  }

  return extractUsernameFromUserCard(card) === username;
}

function isExplicitUserCard(card: Element): boolean {
  return (
    ['user-card', 'viewer-card'].includes(card.getAttribute('data-a-target') ?? '') ||
    Boolean(card.querySelector(USER_CARD_SURFACE))
  );
}

function getVisibleCardSurface(card: Element): Element {
  return card.matches(USER_CARD_SURFACE) ? card : (card.querySelector(USER_CARD_SURFACE) ?? card);
}

function getCardDragTarget(card: Element): HTMLElement {
  return (
    card.ownerDocument.getElementById('VIEWER_CARD_ID') ??
    card.closest<HTMLElement>('[role="dialog"]') ??
    (card as HTMLElement)
  );
}

const ACTION_ROW_CLASS = 'tul-action-row';

function findActionButton(card: Element, pattern: RegExp): HTMLButtonElement | undefined {
  return [...card.querySelectorAll<HTMLButtonElement>('button')].find((button) =>
    pattern.test(button.textContent?.trim() ?? ''),
  );
}

function getActionRow(card: Element): Element {
  const followAction =
    card.querySelector<HTMLButtonElement>(TWITCH_SELECTORS.followAction) ??
    findActionButton(card, /^(follow|obserwuj)$/i);
  const whisperAction = findActionButton(card, /^(whisper|szept)$/i);

  const followParent = followAction?.parentElement;
  const whisperParent = whisperAction?.parentElement;

  if (followParent && whisperParent && followParent !== whisperParent) {
    const sharedRow = followParent.parentElement;
    if (sharedRow) {
      return sharedRow;
    }
  }

  if (followParent) {
    return followParent;
  }

  if (whisperParent) {
    return whisperParent;
  }

  const actionArea = card.querySelector(TWITCH_SELECTORS.userCardActionArea);
  if (actionArea) {
    return actionArea;
  }

  return card;
}

function injectLogsButton(
  card: Element,
  username: string,
  locale: string,
  onOpen: (username: string, card: Element, dragTarget: HTMLElement) => void,
): void {
  const existingButton = card.querySelector<HTMLButtonElement>(`[${BUTTON_ATTRIBUTE}]`);
  if (existingButton) {
    existingButton.textContent = getMessages(locale).userCardAction;
    return;
  }

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'tul-card-button';
  button.setAttribute(BUTTON_ATTRIBUTE, '');
  button.textContent = getMessages(locale).userCardAction;
  button.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    onOpen(username, getVisibleCardSurface(card), getCardDragTarget(card));
  });

  const actionRow = getActionRow(card);
  actionRow.classList.add(ACTION_ROW_CLASS);
  actionRow.append(button);
}

export interface TwitchUserCardsObserver {
  stop: () => void;
  updateLocale: (locale: string) => void;
}

export function observeTwitchUserCards(
  locale: string,
  onOpen: (username: string, card: Element, dragTarget: HTMLElement) => void,
): TwitchUserCardsObserver {
  let selectedUsername: string | null = null;
  let currentLocale = locale;
  let frameId: number | undefined;

  const scanCards = () => {
    frameId = undefined;
    for (const card of document.querySelectorAll(TWITCH_SELECTORS.userCard)) {
      if (selectedUsername && isLikelyUserCard(card, selectedUsername)) {
        injectLogsButton(card, selectedUsername, currentLocale, onOpen);
        continue;
      }

      const cardUsername = extractUsernameFromUserCard(card);
      if (cardUsername && isExplicitUserCard(card)) {
        injectLogsButton(card, cardUsername, currentLocale, onOpen);
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

  const updateLocale = (nextLocale: string) => {
    currentLocale = nextLocale;
    scheduleScan();
  };

  return {
    stop: () => {
      document.removeEventListener('click', onDocumentClick, true);
      observer.disconnect();
      if (frameId !== undefined) {
        window.cancelAnimationFrame(frameId);
      }
    },
    updateLocale,
  };
}
