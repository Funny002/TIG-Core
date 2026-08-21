/**
 * 获取当前时间戳（优先使用 performance.now()，降级使用 Date.now()）
 */
export declare const getTimestamp: () => number;
/**
 * 防抖函数 - 在最后一次操作后延迟执行
 * @param func - 需要防抖的函数
 * @param delay - 延迟时间（毫秒）
 */
export declare function debounce<T extends (...args: any[]) => any>(func: T, delay?: number): (this: unknown, ...args: Parameters<T>) => void;
/**
 * 节流函数 - 固定时间间隔内只执行一次
 * @param func - 需要节流的函数
 * @param delay - 时间间隔（毫秒）
 */
export declare function throttle<T extends (...args: any[]) => any>(func: T, delay?: number): (this: unknown, ...args: Parameters<T>) => void;
/**
 * 获取值的精确类型（小写形式）
 * @param value - 需要检测的值
 * @returns 类型字符串（如 'object', 'array', 'number' 等）
 */
export declare function getType(value: any): string;
/**
 * 浅合并对象（覆盖模式）
 * @param objects - 需要合并的对象
 */
export declare const shallowMerge: <T extends Record<string, any>>(...objects: Partial<T>[]) => T;
/**
 * 深合并对象（递归合并）
 * @param objects - 需要合并的对象
 * @description
 *  - 对象：递归合并
 *  - 数组：浅拷贝（不合并数组元素）
 *  - 其他类型：直接覆盖
 */
export declare function deepMerge(...objects: Record<string, any>[]): Record<string, any>;
/**
 * 对象选择器
 * @param obj - 源对象
 * @param keys - 需要选择的键
 * @returns 新对象，只包含指定的键
 */
export declare function objectPick(obj: Record<string, any>, keys: string[]): Record<string, any>;
/**
 * 对象过滤器
 * @param obj - 源对象
 * @param keys - 需要排除的键
 * @returns 新对象，排除指定的键
 */
export declare function objectOmit(obj: Record<string, any>, keys: string[]): Record<string, any>;
