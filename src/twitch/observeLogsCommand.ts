import { LOGS_COMMAND_EVENT } from './logsCommandBridge';

export function observeLogsCommand(onCommand: (username: string) => void): () => void {
  const onLogsCommand = (event: Event) => {
    if (!(event instanceof CustomEvent) || typeof event.detail !== 'string') {
      return;
    }

    onCommand(event.detail);
  };

  window.addEventListener(LOGS_COMMAND_EVENT, onLogsCommand);
  return () => window.removeEventListener(LOGS_COMMAND_EVENT, onLogsCommand);
}
