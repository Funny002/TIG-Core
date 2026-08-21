/** 日志级别枚举 */
export declare enum LoggerLevel {
    Log = "Log",// 普通日志
    Warn = "Warn",// 警告日志
    Info = "Info",// 信息日志
    Error = "Error",// 错误日志
    Debug = "Debug",// 调试日志
    Time = "Time"
}
/** 日志配置选项接口 */
export interface LoggerOptions {
    prefix: string;
    timestamp: boolean;
    level: LoggerLevel;
    color: {
        [key in LoggerLevel]: string;
    };
}
/**
 * 日志记录器类
 * 提供分级日志、时间戳、颜色输出以及计时能力
 */
export declare class Logger {
    private readonly config;
    private readonly timers;
    /** 构造函数，接受部分配置选项 */
    constructor(config?: Partial<LoggerOptions>);
    /** 判断是否应该记录指定级别的日志 */
    private shouldLog;
    /** 设置日志级别 */
    setLevel(level: LoggerLevel): void;
    /** 获取当前日志级别 */
    getLevel(): LoggerLevel;
    /** 格式化日志消息前缀 */
    private formatPrefix;
    /** 普通日志 */
    log(...args: any[]): void;
    /** 警告日志 */
    warn(...args: any[]): void;
    /** 信息日志 */
    info(...args: any[]): void;
    /** 错误日志 */
    error(...args: any[]): void;
    /** 调试日志 */
    debug(...args: any[]): void;
    /** 开始计时 */
    time(label: string): void;
    /** 结束计时并返回耗时 */
    timeEnd(label: string): number | undefined;
    /** 清空控制台 */
    clear(): void;
    /** 输出表格数据 */
    table(data: any, columns?: string[]): void;
    /** 创建分组 */
    group(label: string, collapsed?: boolean): void;
    /** 结束分组 */
    groupEnd(): void;
}
