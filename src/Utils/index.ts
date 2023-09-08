// TODO: 获取时间
export const getTime = () => window.performance?.now() || Date.now();

// TODO: 防抖
export function debounce(func: any, timeout = 300) {
  let state: NodeJS.Timeout;
  return function (...args: any[]) {
    if (state) clearTimeout(state);
    state = setTimeout(() => func(...args), timeout);
  };
}

// TODO: 节流
export function throttle(func: any, timeout = 300) {
  let state: NodeJS.Timeout;
  return function (...args: any[]) {
    if (state) return;
    func(...args);
    state = setTimeout(() => state = undefined, timeout);
  };
}

// TODO: 类型判断
export function typeOf(value: any) {
  return Object.prototype.toString.call(value).slice(8, -1).toLowerCase();
}

// TODO: 对象合并
export function mergeObjs(...args: { [key: string]: any }[]) {
  return Object.assign({}, ...args);
}

// TODO: 对象合并 - 深度
export function mergeObjsDeep(...args: { [key: string]: any }[]) {
  return args.reduce((prev, next) => {
    for (const [key, value] of Object.entries(next)) {
      const [prevType, nextType] = [typeOf(prev[key]), typeOf(value)];
      if (prevType === nextType && nextType === 'object') {
        prev[key] = mergeObjsDeep(prev[key], value);
      } else if (nextType === 'array') {
        prev[key] = [].concat(value);
      } else {
        prev[key] = value;
      }
    }
    return prev;
  }, {});
}

// TODO: 像素比
export function getRatio(context: CanvasRenderingContext2D) {
  return (window.devicePixelRatio || 1) / (
    (!context && 1) ||
    context['backingStorePixelRatio'] ||
    context['webkitBackingStorePixelRatio'] ||
    context['mozBackingStorePixelRatio'] ||
    context['msBackingStorePixelRatio'] ||
    context['oBackingStorePixelRatio'] ||
    context['backingStorePixelRatio'] ||
    1
  );
}
