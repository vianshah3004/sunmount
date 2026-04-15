type LogLevel = "INFO" | "WARN" | "ERROR";

const errorReplacer = (_key: string, value: unknown) => {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack
    };
  }
  return value;
};

const formatMessage = (level: LogLevel, message: string, meta?: unknown) => {
  const timestamp = new Date().toISOString();
  const base = `[${timestamp}] [${level}] ${message}`;
  return meta ? `${base} | ${JSON.stringify(meta, errorReplacer)}` : base;
};

export const logger = {
  info(message: string, meta?: unknown) {
    console.log(formatMessage("INFO", message, meta));
  },
  warn(message: string, meta?: unknown) {
    console.warn(formatMessage("WARN", message, meta));
  },
  error(message: string, meta?: unknown) {
    console.error(formatMessage("ERROR", message, meta));
  }
};
