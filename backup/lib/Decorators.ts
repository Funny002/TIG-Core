// TODO: 监听器
export function Watch<T, U = any>(listener?: (this: U, value: T, lestValue: T) => void) {
  return function (target: any, name: string) {
    const keys = Symbol(name);

    Object.defineProperty(target, keys, {
      value: target[name],
      writable: true,
      enumerable: false,
    });

    function get() {
      return this[keys];
    }

    function set(value: T) {
      const last = this[keys];
      this[keys] = value;
      listener && listener.call(this, value, last);
    }

    Object.defineProperty(target, name, { get, set });
  };
}
