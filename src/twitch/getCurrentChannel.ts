const RESERVED_ROUTES = new Set([
  'directory',
  'downloads',
  'jobs',
  'login',
  'messages',
  'p',
  'products',
  'search',
  'settings',
  'signup',
  'subscriptions',
  'turbo',
  'videos',
  'wallet',
]);

const CHANNEL_LOGIN = /^[a-z0-9_]{4,25}$/i;

export function getCurrentChannel(url: string = window.location.href): string | null {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(url);
  } catch {
    return null;
  }

  if (!['www.twitch.tv', 'twitch.tv'].includes(parsedUrl.hostname)) {
    return null;
  }

  const [firstSegment, secondSegment] = parsedUrl.pathname.split('/').filter(Boolean);
  if (!firstSegment || secondSegment || RESERVED_ROUTES.has(firstSegment.toLowerCase())) {
    return null;
  }

  return CHANNEL_LOGIN.test(firstSegment) ? firstSegment.toLowerCase() : null;
}

export function observeCurrentChannel(onChange: (channel: string | null) => void): () => void {
  let previousUrl = window.location.href;
  const notifyIfChanged = () => {
    if (window.location.href === previousUrl) {
      return;
    }

    previousUrl = window.location.href;
    onChange(getCurrentChannel(previousUrl));
  };

  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  history.pushState = function pushState(...args) {
    originalPushState.apply(this, args);
    notifyIfChanged();
  };
  history.replaceState = function replaceState(...args) {
    originalReplaceState.apply(this, args);
    notifyIfChanged();
  };

  window.addEventListener('popstate', notifyIfChanged);
  return () => {
    history.pushState = originalPushState;
    history.replaceState = originalReplaceState;
    window.removeEventListener('popstate', notifyIfChanged);
  };
}
