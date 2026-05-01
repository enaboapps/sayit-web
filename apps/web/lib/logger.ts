type LogContext = Record<string, unknown>;

type LogOptions = {
  production?: boolean;
};

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type NodeEnvReader = () => string | undefined;

function currentNodeEnv(): string | undefined {
  return process.env['NODE_ENV'];
}

function shouldLog(level: LogLevel, nodeEnv: string | undefined, options?: LogOptions): boolean {

  if (nodeEnv === 'test') return true;
  if (level === 'debug') return nodeEnv !== 'production';
  if (options?.production === false && nodeEnv === 'production') return false;

  return true;
}

function writeLog(
  level: LogLevel,
  message: string,
  context?: LogContext,
  options?: LogOptions,
  readNodeEnv: NodeEnvReader = currentNodeEnv
) {
  if (!shouldLog(level, readNodeEnv(), options)) return;

  if (context && Object.keys(context).length > 0) {
    console[level](message, context);
    return;
  }

  console[level](message);
}

export function createAppLogger(readNodeEnv: NodeEnvReader = currentNodeEnv) {
  return {
    debug(message: string, context?: LogContext, options?: LogOptions) {
      writeLog('debug', message, context, options, readNodeEnv);
    },
    info(message: string, context?: LogContext, options?: LogOptions) {
      writeLog('info', message, context, options, readNodeEnv);
    },
    warn(message: string, context?: LogContext, options?: LogOptions) {
      writeLog('warn', message, context, options, readNodeEnv);
    },
    error(message: string, context?: LogContext, options?: LogOptions) {
      writeLog('error', message, context, options, readNodeEnv);
    },
  };
}

export const appLogger = createAppLogger();
