// TODO: 监听器
export function Watch<T, U = any>(listener?: (this: U, value: T, lestValue: T) => void) {
  return function (target: any, name: string) {
    let data: T = target[name];
    let lest: T = data;

    function get() {
      return data;
    }

    function set(value: T) {
      lest = data;
      data = value;
      listener && listener.call(this, data, lest);
    }

    Object.defineProperty(target, name, { get, set });
  };
}
