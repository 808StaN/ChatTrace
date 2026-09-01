import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  srcDir: 'src',
  manifest: {
    name: 'ChatTrace - Chat History for Twitch',
    description:
      "View your own or other users' chat history directly on Twitch. Click a chatter or use /logs [username] to browse past messages.",
    icons: {
      16: 'icon.png',
      32: 'icon.png',
      48: 'icon.png',
      128: 'icon.png',
    },
    host_permissions: [
      'https://www.twitch.tv/*',
      'https://logs.zonian.dev/*',
      'https://api.ivr.fi/*',
      'https://7tv.io/*',
      'https://api.betterttv.net/*',
      'https://api.frankerfacez.com/*',
    ],
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
});
