# Chrome Web Store Submission Notes

## Single Purpose

ChatTrace displays available public Twitch chat history for a selected chatter in the currently viewed Twitch channel. It adds a Logs action to Twitch user cards and shows matching past messages without navigating away from Twitch.

## Privacy Policy

Publish `privacy-policy.html` at a public HTTPS URL and paste that URL into the Chrome Web Store privacy-policy field.

## Host Permission Justification

### `https://www.twitch.tv/*`

Required to run the content script on Twitch. The extension reads the currently viewed channel and selected chatter login from the visible Twitch page, adds the Logs action to user cards, and displays the chat-history panel.

### `https://logs.zonian.dev/*`

Required to request existing chat-history records matching the selected channel and chatter. The extension does not upload chat history or send data to its own backend.

### `https://api.ivr.fi/*`

Required to retrieve public Twitch badge images for messages displayed in the panel.

### `https://7tv.io/*`

Required to retrieve public 7TV emote catalog data so matching emotes render in displayed messages.

### `https://api.betterttv.net/*`

Required to retrieve public BetterTTV emote catalog data so matching emotes render in displayed messages.

### `https://api.frankerfacez.com/*`

Required to retrieve public FrankerFaceZ emote catalog data so matching emotes render in displayed messages.

## Remote Code

ChatTrace does not download or execute remote code. All executable extension code is packaged in the submitted extension archive. External requests retrieve only JSON data and image assets used to display chat history, badges, and emotes.
