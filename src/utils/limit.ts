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
