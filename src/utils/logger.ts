type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const PREFIX = '[SightAI]';

function emit(level: LogLevel, tag: string, message: string, extra?: unknown) {
  const line = `${PREFIX} ${tag}: ${message}`;
  if (extra !== undefined) {
    // Keep extras serializable for Metro / Expo Go log streaming
    const safe =
      extra instanceof Error
        ? { name: extra.name, message: extra.message, stack: extra.stack }
        : extra;
    // eslint-disable-next-line no-console
    console[level](line, safe);
  } else {
    // eslint-disable-next-line no-console
    console[level](line);
  }
}

export const log = {
  debug: (tag: string, message: string, extra?: unknown) =>
    emit('debug', tag, message, extra),
  info: (tag: string, message: string, extra?: unknown) =>
    emit('info', tag, message, extra),
  warn: (tag: string, message: string, extra?: unknown) =>
    emit('warn', tag, message, extra),
  error: (tag: string, message: string, extra?: unknown) =>
    emit('error', tag, message, extra),
};

export function installGlobalErrorHandlers(): void {
  const ErrorUtils = (
    globalThis as {
      ErrorUtils?: {
        getGlobalHandler?: () => (error: Error, isFatal?: boolean) => void;
        setGlobalHandler?: (
          handler: (error: Error, isFatal?: boolean) => void
        ) => void;
      };
    }
  ).ErrorUtils;

  if (!ErrorUtils?.getGlobalHandler || !ErrorUtils.setGlobalHandler) {
    log.warn('GlobalErrors', 'ErrorUtils unavailable');
    return;
  }

  const previous = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    log.error('GlobalErrors', `Unhandled ${isFatal ? 'FATAL' : 'error'}`, error);
    previous?.(error, isFatal);
  });

  log.info('GlobalErrors', 'Global JS error handler installed');
}
