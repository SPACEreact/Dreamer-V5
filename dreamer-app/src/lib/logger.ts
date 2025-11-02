/**
 * Professional logging utility for Dreamer App
 * Replaces direct console statements with environment-aware logging
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

export interface LogConfig {
  level: LogLevel;
  enableColors: boolean;
  enableTimestamp: boolean;
  enableStackTrace: boolean;
}

class Logger {
  private config: LogConfig;

  constructor(config: Partial<LogConfig> = {}) {
    this.config = {
      level: this.getEnvironmentLogLevel(),
      enableColors: this.shouldEnableColors(),
      enableTimestamp: true,
      enableStackTrace: false,
      ...config
    };
  }

  private getEnvironmentLogLevel(): LogLevel {
    if (typeof window === 'undefined') {
      return LogLevel.ERROR;
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    const debugParam = urlParams.get('debug');
    const localStorageLevel = localStorage.getItem('dreamer_log_level');
    
    if (debugParam === 'true' || localStorageLevel === 'debug') {
      return LogLevel.DEBUG;
    }
    
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return LogLevel.DEBUG;
    }
    
    return LogLevel.WARN;
  }

  private shouldEnableColors(): boolean {
    return typeof window !== 'undefined' && 
           window.location.hostname === 'localhost';
  }

  private formatMessage(level: LogLevel, message: string, ...args: any[]): string {
    const timestamp = this.config.enableTimestamp 
      ? `[${new Date().toISOString()}]` 
      : '';
    
    const levelPrefix = this.getLevelPrefix(level);
    const prefix = this.config.enableColors 
      ? `${timestamp}${this.getColor(level, levelPrefix)}` 
      : `${timestamp}${levelPrefix}`;
    
    const formattedMessage = `${prefix} ${message}`;
    
    if (args.length > 0) {
      return `${formattedMessage} ${JSON.stringify(args, null, 2)}`;
    }
    
    return formattedMessage;
  }

  private getLevelPrefix(level: LogLevel): string {
    switch (level) {
      case LogLevel.ERROR: return '❌ ERROR';
      case LogLevel.WARN:  return '⚠️  WARN';
      case LogLevel.INFO:  return 'ℹ️  INFO';
      case LogLevel.DEBUG: return '🔍 DEBUG';
      default: return 'LOG';
    }
  }

  private getColor(level: LogLevel, message: string): string {
    const colorMap = {
      [LogLevel.ERROR]: '\x1b[31m', // Red
      [LogLevel.WARN]:  '\x1b[33m', // Yellow
      [LogLevel.INFO]:  '\x1b[36m', // Cyan
      [LogLevel.DEBUG]: '\x1b[90m'  // Gray
    };
    
    const resetColor = '\x1b[0m';
    return `${colorMap[level] || ''}${message}${resetColor}`;
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.config.level;
  }

  error(message: string, ...args: any[]): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    console.error(this.formatMessage(LogLevel.ERROR, message), ...args);
  }

  warn(message: string, ...args: any[]): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    console.warn(this.formatMessage(LogLevel.WARN, message), ...args);
  }

  info(message: string, ...args: any[]): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    console.info(this.formatMessage(LogLevel.INFO, message), ...args);
  }

  debug(message: string, ...args: any[]): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    console.log(this.formatMessage(LogLevel.DEBUG, message), ...args);
  }

  // Convenience methods for specific domains
  service(serviceName: string) {
    return {
      error: (message: string, ...args: any[]) => this.error(`[${serviceName}] ${message}`, ...args),
      warn: (message: string, ...args: any[]) => this.warn(`[${serviceName}] ${message}`, ...args),
      info: (message: string, ...args: any[]) => this.info(`[${serviceName}] ${message}`, ...args),
      debug: (message: string, ...args: any[]) => this.debug(`[${serviceName}] ${message}`, ...args)
    };
  }

  // Performance logging
  time(label: string): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    console.time(label);
  }

  timeEnd(label: string): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    console.timeEnd(label);
  }

  // Group logging for better organization
  group(label: string): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    console.group(label);
  }

  groupEnd(): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    console.groupEnd();
  }
}

// Export singleton instance
export const logger = new Logger();

// Convenience export for quick access
export const {
  error: logError,
  warn: logWarn,
  info: logInfo,
  debug: logDebug
} = logger;

// Service-specific loggers for easy importing
export const appLogger = logger.service('App');
export const geminiLogger = logger.service('GeminiService');
export const imageLogger = logger.service('ImageGeneration');
export const soundLogger = logger.service('SoundDesign');
export const castingLogger = logger.service('CastingAssistant');
export const supabaseLogger = logger.service('SupabaseService');
export const hugfaceLogger = logger.service('HuggingFaceService');