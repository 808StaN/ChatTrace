import { getCurrentChannel, observeCurrentChannel } from '@/twitch/getCurrentChannel';

export default defineContentScript({
  matches: ['https://www.twitch.tv/*'],
  runAt: 'document_idle',
  main() {
    if (import.meta.env.DEV) {
      console.debug('[Twitch User Logs] content script started', {
        channel: getCurrentChannel(),
      });
    }

    observeCurrentChannel((channel) => {
      if (import.meta.env.DEV) {
        console.debug('[Twitch User Logs] channel changed', { channel });
      }
    });
  },
});
