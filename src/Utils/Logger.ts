import { shallowMerge } from './Object';
import dayjs from 'dayjs';

// 日志级别枚举
export enum LoggerLevel {
  Log = 'Log',      // 普通日志
  Warn = 'Warn',    // 警告日志
  Info = 'Info',    // 信息日志
  Error = 'Error',  // 错误日志
  Debug = 'Debug',  // 调试日志
  Time = 'Time',    // 时间日志（用于计时）
}

// 日志配置选项接口
export interface LoggerOptions {
  prefix: string,        // 日志前缀
  timestamp: boolean,    // 是否显示时间戳
  level: LoggerLevel;    // 日志级别
  color: { [key in LoggerLevel]: string };  // 各级别对应的颜色
}

// 日志记录器类
export class Logger {
  private config: LoggerOptions;  // 日志配置
  private timers: Map<string, number> = new Map();  // 计时器映射

  // 构造函数，接受部分配置选项
  constructor(config: Partial<LoggerOptions> = {}) {
    // 合并默认配置和用户配置
    this.config = shallowMerge({
      prefix: '',  // 默认前缀为空
      timestamp: true,  // 默认显示时间戳
      level: LoggerLevel.Log,  // 默认日志级别为Log
      color: {
        [LoggerLevel.Log]: 'color: #35495e',    // 深蓝色
        [LoggerLevel.Warn]: 'color: #ffa726',   // 橙色
        [LoggerLevel.Info]: 'color: #42a5f5',   // 蓝色
        [LoggerLevel.Error]: 'color: #ef5350',  // 红色
        [LoggerLevel.Debug]: 'color: #7e57c2',  // 紫色
        [LoggerLevel.Time]: 'color: #26a69a',   // 青绿色
      } as const,
    }, config);
  }

  // 判断是否应该记录指定级别的日志
  private shouldLog(level: LoggerLevel): boolean {
    // 日志级别优先级映射（数字越大优先级越高）
    const levelPriority = {
      [LoggerLevel.Error]: 5,  // 错误级别最高
      [LoggerLevel.Warn]: 4,
      [LoggerLevel.Info]: 3,
      [LoggerLevel.Log]: 2,
      [LoggerLevel.Debug]: 1,  // 调试级别最低
      [LoggerLevel.Time]: 0,
    };

    const currentPriority = levelPriority[level];  // 当前日志级别的优先级
    const configPriority = levelPriority[this.config.level];  // 配置级别的优先级

    // 如果当前级别优先级大于等于配置级别，则记录
    return currentPriority >= configPriority;
  }

  // 设置日志级别
  public setLevel(level: LoggerLevel) {
    this.config.level = level;
  }

  // 格式化日志消息
  private formatMessage(level: LoggerLevel, ...args: any[]): {
    prefix: string,  // 格式化后的前缀
    args: any[],     // 原始参数
    color: string,   // 颜色样式
    level: LoggerLevel  // 日志级别
  } {
    const parts: string[] = [];

    // 添加前缀（如果配置了）
    if (this.config.prefix) {
      parts.push(`[${this.config.prefix}]`);
    }

    // 添加日志级别（大写）
    parts.push(`[${level.toUpperCase()}]`);

    // 如果配置了时间戳，添加当前时间
    if (this.config.timestamp) {
      parts.push(dayjs().format('YYYY-MM-DD hh:mm:ss'));
    }

    const prefix = parts.join(' ');  // 组合所有前缀部分

    return { prefix, args, level, color: this.config.color[level] };
  }

  // 普通日志
  log(...args: any[]): void {
    if (!this.shouldLog(LoggerLevel.Log)) return;  // 检查是否应该记录
    const formatted = this.formatMessage(LoggerLevel.Log, ...args);
    console.log(`%c${formatted.prefix}`, formatted.color, ...formatted.args);
  }

  // 警告日志
  warn(...args: any[]): void {
    if (!this.shouldLog(LoggerLevel.Warn)) return;
    const formatted = this.formatMessage(LoggerLevel.Warn, ...args);
    console.warn(`%c${formatted.prefix}`, formatted.color, ...formatted.args);
  }

  // 信息日志
  info(...args: any[]): void {
    if (!this.shouldLog(LoggerLevel.Info)) return;
    const formatted = this.formatMessage(LoggerLevel.Info, ...args);
    console.info(`%c${formatted.prefix}`, formatted.color, ...formatted.args);
  }

  // 错误日志
  error(...args: any[]): void {
    if (!this.shouldLog(LoggerLevel.Error)) return;
    const formatted = this.formatMessage(LoggerLevel.Error, ...args);
    console.error(`%c${formatted.prefix}`, formatted.color, ...formatted.args);
  }

  // 调试日志
  debug(...args: any[]): void {
    if (!this.shouldLog(LoggerLevel.Debug)) return;
    const formatted = this.formatMessage(LoggerLevel.Debug, ...args);
    console.debug(`%c${formatted.prefix}`, formatted.color, ...formatted.args);
  }

  // 开始计时
  time(label: string): void {
    if (!this.shouldLog(LoggerLevel.Time)) return;

    // 如果计时器已存在，发出警告
    if (this.timers.has(label)) {
      this.warn(`Timer '${label}' already exists. Overwriting...`);
    }

    // 记录开始时间
    this.timers.set(label, performance.now());

    // 如果配置允许，输出计时开始信息
    if (this.shouldLog(LoggerLevel.Log)) {
      const formatted = this.formatMessage(LoggerLevel.Time, `Timer '${label}' started`);
      console.log(`%c${formatted.prefix}`, formatted.color, ...formatted.args);
    }
  }

  // 结束计时并返回耗时
  timeEnd(label: string): number | undefined {
    if (!this.shouldLog(LoggerLevel.Time)) return;

    const startTime = this.timers.get(label);
    if (!startTime) {
      this.error(`Timer '${label}' does not exist`);
      return;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;  // 计算耗时

    this.timers.delete(label);  // 删除计时器

    // 输出计时结果
    const formatted = this.formatMessage(LoggerLevel.Time, `${label}: ${duration.toFixed(2)}ms`);
    console.log(`%c${formatted.prefix}`, formatted.color, ...formatted.args);

    return duration;
  }

  // 清空控制台
  clear(): void {
    console.clear();
  }

  // 输出表格数据
  table(data: any, columns?: string[]): void {
    if (!this.shouldLog(LoggerLevel.Log)) return;
    console.table(data, columns);
  }

  // 创建分组
  group(label: string, collapsed: boolean = false): void {
    if (!this.shouldLog(LoggerLevel.Log)) return;

    if (collapsed) {
      console.groupCollapsed(label);  // 折叠分组
    } else {
      console.group(label);  // 展开分组
    }
  }

  // 结束分组
  groupEnd(): void {
    console.groupEnd();
  }
}
