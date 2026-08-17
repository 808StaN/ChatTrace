const TWITCH_LOGIN = /^[a-z0-9_]{4,25}$/i;

function normalizeLogin(value: string | undefined): string | null {
  const login = value?.trim().replace(/^@/, '');
  return login && TWITCH_LOGIN.test(login) ? login.toLowerCase() : null;
}

function usernameFromHref(href: string): string | null {
  try {
    const url = new URL(href, window.location.origin);
    const [username, extraSegment] = url.pathname.split('/').filter(Boolean);
    return extraSegment ? null : normalizeLogin(username);
  } catch {
    return null;
  }
}

export function extractSelectedUsername(target: EventTarget | null): string | null {
  if (!(target instanceof Element)) {
    return null;
  }

  const userElement = target.closest<HTMLElement>('[data-a-user]');
  const fromDataAttribute = normalizeLogin(userElement?.dataset.aUser);
  if (fromDataAttribute) {
    return fromDataAttribute;
  }

  const profileLink = target.closest<HTMLAnchorElement>('a[href]');
  const fromProfileLink = profileLink ? usernameFromHref(profileLink.href) : null;
  if (fromProfileLink) {
    return fromProfileLink;
  }

  return normalizeLogin(userElement?.textContent ?? undefined);
}

export function extractUsernameFromUserCard(card: Element): string | null {
  const dataUser = card.querySelector<HTMLElement>('[data-a-user]');
  const fromDataAttribute = normalizeLogin(dataUser?.dataset.aUser);
  if (fromDataAttribute) {
    return fromDataAttribute;
  }

  for (const link of card.querySelectorAll<HTMLAnchorElement>('a[href]')) {
    const username = usernameFromHref(link.href);
    if (username) {
      return username;
    }
  }

  return null;
}
