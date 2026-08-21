import dayjs from 'dayjs';
import { shallowMerge } from './Object';

/** 日志级别枚举 */
export enum LoggerLevel {
  Log = 'Log',      // 普通日志
  Warn = 'Warn',    // 警告日志
  Info = 'Info',    // 信息日志
  Error = 'Error',  // 错误日志
  Debug = 'Debug',  // 调试日志
  Time = 'Time',    // 时间日志（用于计时）
}

/** 日志级别优先级（数字越大优先级越高） */
const LEVEL_PRIORITY: Record<LoggerLevel, number> = {
  [LoggerLevel.Error]: 5,
  [LoggerLevel.Warn]: 4,
  [LoggerLevel.Info]: 3,
  [LoggerLevel.Log]: 2,
  [LoggerLevel.Debug]: 1,
  [LoggerLevel.Time]: 0,
};

/** 日志配置选项接口 */
export interface LoggerOptions {
  prefix: string;                              // 日志前缀
  timestamp: boolean;                          // 是否显示时间戳
  level: LoggerLevel;                          // 日志级别
  color: { [key in LoggerLevel]: string };     // 各级别对应的颜色
}

const DEFAULT_OPTIONS: LoggerOptions = {
  prefix: '',
  timestamp: true,
  level: LoggerLevel.Log,
  color: {
    [LoggerLevel.Log]: '#35495e',
    [LoggerLevel.Warn]: '#ffa726',
    [LoggerLevel.Info]: '#42a5f5',
    [LoggerLevel.Error]: '#ef5350',
    [LoggerLevel.Debug]: '#7e57c2',
    [LoggerLevel.Time]: '#26a69a',
  },
};

/**
 * 日志记录器类
 * 提供分级日志、时间戳、颜色输出以及计时能力
 */
export class Logger {
  private readonly config: LoggerOptions;           // 日志配置
  private readonly timers: Map<string, number> = new Map(); // 计时器映射

  /** 构造函数，接受部分配置选项 */
  constructor(config: Partial<LoggerOptions> = {}) {
    this.config = shallowMerge(DEFAULT_OPTIONS, config);
  }

  /** 判断是否应该记录指定级别的日志 */
  private shouldLog(level: LoggerLevel): boolean {
    return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[this.config.level];
  }

  /** 设置日志级别 */
  public setLevel(level: LoggerLevel): void {
    this.config.level = level;
  }

  /** 获取当前日志级别 */
  public getLevel(): LoggerLevel {
    return this.config.level;
  }

  /** 格式化日志消息前缀 */
  private formatPrefix(level: LoggerLevel): { prefix: string; color: string } {
    const parts: string[] = [];

    if (this.config.prefix) parts.push(`[${this.config.prefix}]`);
    parts.push(`[${level.toUpperCase()}]`);
    if (this.config.timestamp) parts.push(dayjs().format('YYYY-MM-DD hh:mm:ss'));

    return { prefix: parts.join(' '), color: this.config.color[level] };
  }

  /** 普通日志 */
  log(...args: any[]): void {
    if (!this.shouldLog(LoggerLevel.Log)) return;
    const { prefix, color } = this.formatPrefix(LoggerLevel.Log);
    console.log(`%c${prefix}`, `color: ${color}`, ...args);
  }

  /** 警告日志 */
  warn(...args: any[]): void {
    if (!this.shouldLog(LoggerLevel.Warn)) return;
    const { prefix, color } = this.formatPrefix(LoggerLevel.Warn);
    console.warn(`%c${prefix}`, `color: ${color}`, ...args);
  }

  /** 信息日志 */
  info(...args: any[]): void {
    if (!this.shouldLog(LoggerLevel.Info)) return;
    const { prefix, color } = this.formatPrefix(LoggerLevel.Info);
    console.info(`%c${prefix}`, `color: ${color}`, ...args);
  }

  /** 错误日志 */
  error(...args: any[]): void {
    if (!this.shouldLog(LoggerLevel.Error)) return;
    const { prefix, color } = this.formatPrefix(LoggerLevel.Error);
    console.error(`%c${prefix}`, `color: ${color}`, ...args);
  }

  /** 调试日志 */
  debug(...args: any[]): void {
    if (!this.shouldLog(LoggerLevel.Debug)) return;
    const { prefix, color } = this.formatPrefix(LoggerLevel.Debug);
    console.debug(`%c${prefix}`, `color: ${color}`, ...args);
  }

  /** 开始计时 */
  time(label: string): void {
    if (!this.shouldLog(LoggerLevel.Time)) return;

    if (this.timers.has(label)) {
      this.warn(`Timer '${label}' already exists. Overwriting...`);
    }
    this.timers.set(label, performance.now());

    const { prefix, color } = this.formatPrefix(LoggerLevel.Time);
    console.log(`%c${prefix}`, `color: ${color}`, `Timer '${label}' started`);
  }

  /** 结束计时并返回耗时 */
  timeEnd(label: string): number | undefined {
    if (!this.shouldLog(LoggerLevel.Time)) return undefined;

    const startTime = this.timers.get(label);
    if (startTime === undefined) {
      this.error(`Timer '${label}' does not exist`);
      return undefined;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(label);

    const { prefix, color } = this.formatPrefix(LoggerLevel.Time);
    console.log(`%c${prefix}`, `color: ${color}`, `${label}: ${duration.toFixed(2)}ms`);

    return duration;
  }

  /** 清空控制台 */
  clear(): void {
    console.clear();
  }

  /** 输出表格数据 */
  table(data: any, columns?: string[]): void {
    if (!this.shouldLog(LoggerLevel.Log)) return;
    console.table(data, columns);
  }

  /** 创建分组 */
  group(label: string, collapsed = false): void {
    if (!this.shouldLog(LoggerLevel.Log)) return;
    if (collapsed) console.groupCollapsed(label);
    else console.group(label);
  }

  /** 结束分组 */
  groupEnd(): void {
    console.groupEnd();
  }
}
