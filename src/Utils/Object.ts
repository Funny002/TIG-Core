/**
 * 获取当前时间戳（优先使用 performance.now()，降级使用 Date.now()）
 */
export const getTimestamp = () => window.performance?.now() || Date.now();

/**
 * 防抖函数 - 在最后一次操作后延迟执行
 * @param {Function} func - 需要防抖的函数
 * @param {number} [delay=300] - 延迟时间（毫秒）
 */
export function debounce<T extends (...args: any[]) => any>(func: T, delay: number = 300) {
  let timer: number;
  return function (...args: Parameters<T>) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
}

/**
 * 节流函数 - 固定时间间隔内只执行一次
 * @param {Function} func - 需要节流的函数
 * @param {number} [delay=300] - 时间间隔（毫秒）
 */
export function throttle<T extends (...args: any[]) => any>(func: T, delay: number = 300) {
  let timer: number | null = null;
  return function (...args: Parameters<T>) {
    if (timer) return;
    func(...args);
    timer = setTimeout(() => (timer = null), delay);
  };
}

/**
 * 获取值的精确类型（小写形式）
 * @param {any} value - 需要检测的值
 * @returns {string} 类型字符串（如 'object', 'array', 'number' 等）
 */
export function getType(value: any): string {
  return Object.prototype.toString.call(value).slice(8, -1).toLowerCase();
}

/**
 * 浅合并对象（覆盖模式）
 * @param {...Object} objects - 需要合并的对象
 */
export const shallowMerge = (...objects: Record<string, any>[]) => Object.assign({}, ...objects);

/**
 * 深合并对象（递归合并）
 * @param {...Object} objects - 需要合并的对象
 * @description
 *  - 对象：递归合并
 *  - 数组：浅拷贝（不合并数组元素）
 *  - 其他类型：直接覆盖
 */
export function deepMerge(...objects: Record<string, any>[]) {
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
 * @param {Object} obj - 源对象
 * @param {string[]} keys - 需要选择的键
 * @returns {Object} 新对象，只包含指定的键
 */
export function objectPick(obj: Record<string, any>, keys: string[]): Record<string, any> {
  return keys.reduce((prev, key): Record<string, any> => {
    if (obj.hasOwnProperty(key)) {
      prev[key] = obj[key];
    }
    return prev;
  }, {} as Record<string, any>);
}

/**
 * 对象过滤器
 * @param {Object} obj - 源对象
 * @param {string[]} keys - 需要排除的键
 * @returns {Object} 新对象，排除指定的键
 */
export function objectOmit(obj: Record<string, any>, keys: string[]): Record<string, any> {
  return Object.keys(obj).reduce((prev, key): Record<string, any> => {
    if (!keys.includes(key)) {
      prev[key] = obj[key];
    }
    return prev;
  }, {} as Record<string, any>);
}
