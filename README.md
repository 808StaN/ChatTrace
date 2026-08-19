# ChatTrace - Chat History for Twitch

View your own or other Twitch users' chat history directly on Twitch. Click a chatter, choose **Logs** from their normal Twitch user card, and browse past messages without leaving Twitch.

## Stack

- WXT 0.21.4, Manifest V3
- React 19 and strict TypeScript
- Vite and Tailwind tooling
- Supa Logs' current structured logs infrastructure

## Setup

```bash
npm install
npm run dev
```

WXT starts a development Chromium profile with the extension loaded. For a build that can be loaded manually:

```bash
npm run build
```

Open `chrome://extensions`, enable **Developer mode**, select **Load unpacked**, and choose `.output/chrome-mv3`.

For Firefox development and production builds:

```bash
npm run dev:firefox
npm run build:firefox
```

## Quality Checks

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

## Architecture

```text
Twitch chat click / user card
  -> content script and isolated Twitch DOM adapter
  -> current channel + selected username
  -> SupaLogsProvider
  -> normalized ChatMessage objects
  -> React logs panel
```

Twitch-specific selectors and observers are isolated in `src/twitch`. The provider boundary is in `src/services/logs`, so a future provider can implement `LogsProvider` without changing React components.

## Supa Logs Integration

The production `tv.supa.sh/logs` client was inspected on 2026-08-17. Its structured, CORS-enabled requests are made to `https://logs.zonian.dev`:

- Availability: `GET /list?channel={channel}&user={username}` returns `availableLogs` entries with `year`, `month`, and optionally `day`.
- Messages: `GET /channel/{channel}/user/{username}/{YYYY}/{MM}[/{DD}]?jsonBasic=1` returns `messages`.
- The observed API does not expose server cursor/offset pagination. This extension treats each available period as a page and slices an in-memory period response into 50-message UI pages.
- `404` is treated as no logs, `429` as rate limiting, and other failures as recoverable API errors.

The extension talks only to the endpoint used by Supa's current client. It does not contact other log providers directly.

## Privacy

No account, analytics, tracking, Twitch bot, database, crawler, or chat logger is included. The extension reads only the current Twitch channel and the selected chatter username, then requests matching existing logs. It retains a short-lived in-memory cache while the page is open and caps the visible loaded history at 2,000 messages.

The publishable website and policy are in [`web/`](web/). Host `web/privacy-policy.html` at a public HTTPS URL before submitting to the Chrome Web Store.

## Limitations

- Logs only exist where Supa's current logs infrastructure has coverage.
- Twitch DOM changes can temporarily affect detection of chat usernames or the user-card action.
- Removed, private, or never-recorded messages cannot be recovered.
- Twitch, 7TV, BetterTTV, and FrankerFaceZ emotes are resolved from their public catalogs. Removed or unavailable catalog entries remain plain text.
