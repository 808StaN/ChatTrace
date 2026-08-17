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
      'https://badges.twitch.tv/*',
    ],
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
});
