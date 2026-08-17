export const TWITCH_SELECTORS = {
  chatUsername: '[data-a-user], [data-a-target="chat-message-username"]',
  userCard: '[data-a-target="user-card"], [role="dialog"]',
  userCardActionArea: '[data-a-target="user-card-actions"]',
} as const;

/**
 * These are Twitch implementation details, last verified 2026-08-17.
 * Keep fallback logic here rather than spreading generated selectors through the UI.
 */
