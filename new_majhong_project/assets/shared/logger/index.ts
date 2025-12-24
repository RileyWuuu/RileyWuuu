// Logger with ring buffer, category, level, and enable flag

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: number;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
}

interface LoggerConfig {
  category?: string;
  level?: LogLevel;
  enabled?: boolean;
}

export class Logger {
  private static instance: Logger;
  private ringBuffer: LogEntry[] = [];
  private maxSize: number = 100;
  private listeners: Array<(entry: LogEntry) => void> = [];
  private categoryConfigs: Map<string, LoggerConfig> = new Map();
  private globalLevel: LogLevel = 'debug';
  private globalEnabled: boolean = true;

  private constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  static getInstance(maxSize?: number): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(maxSize);
    }
    return Logger.instance;
  }

  configureCategory(category: string, config: LoggerConfig): void {
    this.categoryConfigs.set(category, {
      ...this.categoryConfigs.get(category),
      ...config
    });
  }

  setGlobalLevel(level: LogLevel): void {
    this.globalLevel = level;
  }

  setGlobalEnabled(enabled: boolean): void {
    this.globalEnabled = enabled;
  }

  private shouldLog(category: string, level: LogLevel): boolean {
    if (!this.globalEnabled) {
      return false;
    }

    const categoryConfig = this.categoryConfigs.get(category);
    if (categoryConfig?.enabled === false) {
      return false;
    }

    const categoryLevel = categoryConfig?.level || this.globalLevel;
    const levelPriority: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };

    return levelPriority[level] >= levelPriority[categoryLevel];
  }

  private addToBuffer(entry: LogEntry): void {
    this.ringBuffer.push(entry);
    if (this.ringBuffer.length > this.maxSize) {
      this.ringBuffer.shift();
    }
    this.listeners.forEach(listener => listener(entry));
  }

  log(level: LogLevel, category: string, message: string, data?: any): void {
    if (!this.shouldLog(category, level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      category,
      message,
      data
    };
    this.addToBuffer(entry);
    console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](
      `[${category}] ${message}`,
      data || ''
    );
  }

  debug(category: string, message: string, data?: any): void {
    this.log('debug', category, message, data);
  }

  info(category: string, message: string, data?: any): void {
    this.log('info', category, message, data);
  }

  warn(category: string, message: string, data?: any): void {
    this.log('warn', category, message, data);
  }

  error(category: string, message: string, data?: any): void {
    this.log('error', category, message, data);
  }

  getRecentLogs(count: number = 10, categoryFilter?: string): LogEntry[] {
    let logs = this.ringBuffer.slice(-count);
    if (categoryFilter) {
      logs = logs.filter(log => log.category === categoryFilter);
    }
    return logs;
  }

  getAllLogs(categoryFilter?: string): LogEntry[] {
    let logs = [...this.ringBuffer];
    if (categoryFilter) {
      logs = logs.filter(log => log.category === categoryFilter);
    }
    return logs;
  }

  subscribe(listener: (entry: LogEntry) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  clear(): void {
    this.ringBuffer = [];
  }
}

export const logger = Logger.getInstance(100);
