export const TWITCH_SELECTORS = {
  chatUsername:
    '[data-a-user], [data-a-target="chat-message-username"], .chat-author__display-name',
  userCard:
    '[data-a-target="user-card"], [data-a-target="viewer-card"], [data-test-selector*="user-card"], [role="dialog"]',
  userCardActionArea:
    '[data-a-target="user-card-actions"], [data-a-target*="user-card-actions"], [data-test-selector*="user-card-actions"]',
  followAction: 'button[data-a-target*="follow"], button[data-test-selector*="follow"]',
} as const;

/**
 * These are Twitch implementation details, last verified 2026-08-17.
 * Keep fallback logic here rather than spreading generated selectors through the UI.
 */
