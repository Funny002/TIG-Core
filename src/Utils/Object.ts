/**
 * 获取当前时间戳（优先使用 performance.now()，降级使用 Date.now()）
 */
export const getTimestamp = (): number =>
  typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();

/**
 * 防抖函数 - 在最后一次操作后延迟执行
 * @param func - 需要防抖的函数
 * @param delay - 延迟时间（毫秒）
 */
export function debounce<T extends (...args: any[]) => any>(func: T, delay = 300) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return function (this: unknown, ...args: Parameters<T>) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * 节流函数 - 固定时间间隔内只执行一次
 * @param func - 需要节流的函数
 * @param delay - 时间间隔（毫秒）
 */
export function throttle<T extends (...args: any[]) => any>(func: T, delay = 300) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return function (this: unknown, ...args: Parameters<T>) {
    if (timer) return;
    func.apply(this, args);
    timer = setTimeout(() => (timer = null), delay);
  };
}

/**
 * 获取值的精确类型（小写形式）
 * @param value - 需要检测的值
 * @returns 类型字符串（如 'object', 'array', 'number' 等）
 */
export function getType(value: any): string {
  return Object.prototype.toString.call(value).slice(8, -1).toLowerCase();
}

/**
 * 浅合并对象（覆盖模式）
 * @param objects - 需要合并的对象
 */
export const shallowMerge = <T extends Record<string, any>>(...objects: Partial<T>[]): T =>
  Object.assign({}, ...objects) as T;

/**
 * 深合并对象（递归合并）
 * @param objects - 需要合并的对象
 * @description
 *  - 对象：递归合并
 *  - 数组：浅拷贝（不合并数组元素）
 *  - 其他类型：直接覆盖
 */
export function deepMerge(...objects: Record<string, any>[]): Record<string, any> {
  return objects.reduce((prev, next) => {
    for (const [key, value] of Object.entries(next)) {
      const prevType = getType(prev[key]);
      const nextType = getType(value);

      if (prevType === nextType && nextType === 'object') {
        // 递归合并对象
        prev[key] = deepMerge(prev[key], value);
      } else if (nextType === 'array') {
        // 数组浅拷贝（不深拷贝数组元素）
        prev[key] = [...value];
      } else {
        // 基本类型或类型不匹配时直接覆盖
        prev[key] = value;
      }
    }
    return prev;
  }, {} as Record<string, any>);
}

/**
 * 对象选择器
 * @param obj - 源对象
 * @param keys - 需要选择的键
 * @returns 新对象，只包含指定的键
 */
export function objectPick(obj: Record<string, any>, keys: string[]): Record<string, any> {
  return keys.reduce((prev, key): Record<string, any> => {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      prev[key] = obj[key];
    }
    return prev;
  }, {} as Record<string, any>);
}

/**
 * 对象过滤器
 * @param obj - 源对象
 * @param keys - 需要排除的键
 * @returns 新对象，排除指定的键
 */
export function objectOmit(obj: Record<string, any>, keys: string[]): Record<string, any> {
  return Object.keys(obj).reduce((prev, key): Record<string, any> => {
    if (!keys.includes(key)) {
      prev[key] = obj[key];
    }
    return prev;
  }, {} as Record<string, any>);
}
