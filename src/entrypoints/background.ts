export default defineBackground(() => {
  if (import.meta.env.DEV) {
    console.debug('[Twitch User Logs] background started');
  }
});
