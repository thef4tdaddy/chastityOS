/**
 * Centralized logging utility for ChastityOS
 * Replaces all console.log usage per ESLint architectural rules
 */

export enum LogLevel {
  ERROR = "error",
  WARN = "warn",
  INFO = "info",
  DEBUG = "debug",
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  data?: unknown;
  timestamp: Date;
  source?: string;
}

class Logger {
  private isDevelopment =
    import.meta.env.MODE === "development" ||
    import.meta.env.MODE === "nightly";

  private formatMessage(
    level: LogLevel,
    message: string,
    data?: unknown,
    source?: string,
  ): string {
    const timestamp = new Date().toISOString();
    const sourceStr = source ? ` [${source}]` : "";
    const dataStr = data ? ` ${JSON.stringify(data)}` : "";
    return `[${timestamp}] ${level.toUpperCase()}${sourceStr}: ${message}${dataStr}`;
  }

  private log(
    level: LogLevel,
    message: string,
    data?: unknown,
    source?: string,
  ): void {
    if (!this.isDevelopment && level === LogLevel.DEBUG) {
      return; // Skip debug logs in production
    }

    const formattedMessage = this.formatMessage(level, message, data, source);

    // Use appropriate console method
    switch (level) {
      case LogLevel.ERROR:
        console.error(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        break;
      case LogLevel.DEBUG:
        console.debug(formattedMessage);
        break;
    }

    // In the future, we could also send logs to external service here
    // this.sendToExternalLogger(level, message, data, source);
  }

  error(message: string, data?: unknown, source?: string): void {
    this.log(LogLevel.ERROR, message, data, source);
  }

  warn(message: string, data?: unknown, source?: string): void {
    this.log(LogLevel.WARN, message, data, source);
  }

  info(message: string, data?: unknown, source?: string): void {
    this.log(LogLevel.INFO, message, data, source);
  }

  debug(message: string, data?: unknown, source?: string): void {
    this.log(LogLevel.DEBUG, message, data, source);
  }

  // Service-specific loggers
  service(serviceName: string) {
    return {
      error: (message: string, data?: unknown) =>
        this.error(message, data, serviceName),
      warn: (message: string, data?: unknown) =>
        this.warn(message, data, serviceName),
      info: (message: string, data?: unknown) =>
        this.info(message, data, serviceName),
      debug: (message: string, data?: unknown) =>
        this.debug(message, data, serviceName),
    };
  }
}

// Export singleton logger instance
export const logger = new Logger();

// Export service-specific loggers for common use cases
export const serviceLogger = (serviceName: string) =>
  logger.service(serviceName);
