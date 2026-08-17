import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  srcDir: 'src',
  manifest: {
    name: 'Twitch User Logs',
    description: 'View existing Supa Logs history for Twitch chatters.',
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
