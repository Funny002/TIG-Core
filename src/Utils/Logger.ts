import { mergeObj } from './Object';
import * as dayjs from 'dayjs';

export enum LoggerLevel {
  Log = 'Log',
  Warn = 'Warn',
  Info = 'Info',
  Error = 'Error',
  Debug = 'Debug',
  Time = 'Time',
}

export interface LoggerOptions {
  prefix: string,
  timestamp: boolean,
  level: LoggerLevel;
  color: { [key in LoggerLevel]: string };
}

export class Logger {
  private config: LoggerOptions;
  private timers: Map<string, number> = new Map();

  constructor(config: Partial<LoggerOptions> = {}) {
    this.config = mergeObj({
      prefix: '',
      timestamp: true,
      level: LoggerLevel.Log,
      color: {
        [LoggerLevel.Log]: 'color: #35495e',
        [LoggerLevel.Warn]: 'color: #ffa726',
        [LoggerLevel.Info]: 'color: #42a5f5',
        [LoggerLevel.Error]: 'color: #ef5350',
        [LoggerLevel.Debug]: 'color: #7e57c2',
        [LoggerLevel.Time]: 'color: #26a69a',
      } as const,
    }, config);
  }

  private shouldLog(level: LoggerLevel): boolean {
    const levelPriority = {
      [LoggerLevel.Error]: 5,
      [LoggerLevel.Warn]: 4,
      [LoggerLevel.Info]: 3,
      [LoggerLevel.Log]: 2,
      [LoggerLevel.Debug]: 1,
      [LoggerLevel.Time]: 0,
    };

    const currentPriority = levelPriority[level];
    const configPriority = levelPriority[this.config.level];

    return currentPriority >= configPriority;
  }

  public setLevel(level: LoggerLevel) {
    this.config.level = level;
  }

  private formatMessage(level: LoggerLevel, ...args: any[]): { prefix: string, args: any[], color: string, level: LoggerLevel } {
    const parts: string[] = [];

    if (this.config.prefix) {
      parts.push(`[${this.config.prefix}]`);
    }

    parts.push(`[${level.toUpperCase()}]`);

    if (this.config.timestamp) {
      parts.push(dayjs().format('YYYY-MM-DD hh:mm:ss'));
    }

    const prefix = parts.join(' ');

    return { prefix, args, level, color: this.config.color[level] };
  }

  log(...args: any[]): void {
    if (!this.shouldLog(LoggerLevel.Log)) return;
    const formatted = this.formatMessage(LoggerLevel.Log, ...args);
    console.log(`%c${formatted.prefix}`, formatted.color, ...formatted.args);
  }

  warn(...args: any[]): void {
    if (!this.shouldLog(LoggerLevel.Warn)) return;
    const formatted = this.formatMessage(LoggerLevel.Warn, ...args);
    console.warn(`%c${formatted.prefix}`, formatted.color, ...formatted.args);
  }

  info(...args: any[]): void {
    if (!this.shouldLog(LoggerLevel.Info)) return;
    const formatted = this.formatMessage(LoggerLevel.Info, ...args);
    console.info(`%c${formatted.prefix}`, formatted.color, ...formatted.args);
  }

  error(...args: any[]): void {
    if (!this.shouldLog(LoggerLevel.Error)) return;
    const formatted = this.formatMessage(LoggerLevel.Error, ...args);
    console.error(`%c${formatted.prefix}`, formatted.color, ...formatted.args);
  }

  debug(...args: any[]): void {
    if (!this.shouldLog(LoggerLevel.Debug)) return;
    const formatted = this.formatMessage(LoggerLevel.Debug, ...args);
    console.debug(`%c${formatted.prefix}`, formatted.color, ...formatted.args);
  }

  time(label: string): void {
    if (!this.shouldLog(LoggerLevel.Time)) return;

    if (this.timers.has(label)) {
      this.warn(`Timer '${label}' already exists. Overwriting...`);
    }

    this.timers.set(label, performance.now());

    if (this.shouldLog(LoggerLevel.Log)) {
      const formatted = this.formatMessage(LoggerLevel.Time, `Timer '${label}' started`);
      console.log(`%c${formatted.prefix}`, formatted.color, ...formatted.args);
    }
  }

  timeEnd(label: string): number | undefined {
    if (!this.shouldLog(LoggerLevel.Time)) return;

    const startTime = this.timers.get(label);
    if (!startTime) {
      this.error(`Timer '${label}' does not exist`);
      return;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    this.timers.delete(label);

    const formatted = this.formatMessage(LoggerLevel.Time, `${label}: ${duration.toFixed(2)}ms`);
    console.log(`%c${formatted.prefix}`, formatted.color, ...formatted.args);

    return duration;
  }

  clear(): void {
    console.clear();
  }

  table(data: any, columns?: string[]): void {
    if (!this.shouldLog(LoggerLevel.Log)) return;
    console.table(data, columns);
  }

  group(label: string, collapsed: boolean = false): void {
    if (!this.shouldLog(LoggerLevel.Log)) return;

    if (collapsed) {
      console.groupCollapsed(label);
    } else {
      console.group(label);
    }
  }

  groupEnd(): void {
    console.groupEnd();
  }
}
