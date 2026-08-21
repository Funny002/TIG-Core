/** 事件监听器类型定义 */
export type EventListener<T = any> = (data: T) => void;

/**
 * 事件监听器类
 * 实现发布/订阅模式，用于管理事件的订阅、取消订阅和发布
 */
export class Listener<Events extends Record<string, any> = Record<string, any>> {
  /** 存储所有主题及其对应的监听器列表 */
  private topics: { [K in keyof Events]?: EventListener<Events[K]>[] } = {};

  /** 订阅主题 */
  public on<K extends keyof Events>(topic: K, listener: EventListener<Events[K]>): void {
    const list = this.topics[topic];
    if (list) {
      list.push(listener);
    } else {
      this.topics[topic] = [listener];
    }
  }

  /** 取消订阅主题 */
  public off<K extends keyof Events>(topic: K, listener: EventListener<Events[K]>): void {
    const list = this.topics[topic];
    if (!list) return;
    const index = list.indexOf(listener);
    if (index !== -1) list.splice(index, 1);
  }

  /** 发布主题事件 */
  public emits<K extends keyof Events>(topic: K, data: Events[K]): void {
    const list = this.topics[topic];
    if (!list) return;
    // 拷贝一份，避免在回调中修改监听器列表导致遍历异常
    for (const listener of [...list]) listener(data);
  }

  /** 订阅主题一次 */
  public once<K extends keyof Events>(topic: K, listener: EventListener<Events[K]>): void {
    const onceListener: EventListener<Events[K]> = (data) => {
      listener(data);
      this.off(topic, onceListener);
    };
    this.on(topic, onceListener);
  }

  /** 清空所有主题的监听器 */
  public clear(): void {
    this.topics = {};
  }
}

/**
 * 事件发射器抽象基类
 * 为子类提供 on/once/off/emit/clear 事件能力
 */
export abstract class EventEmitter<Events extends Record<string, any> = Record<string, any>> {
  private listener: Listener<Events> = new Listener<Events>();

  public on<K extends keyof Events>(topic: K, listener: EventListener<Events[K]>): void {
    this.listener.on(topic, listener);
  }

  public once<K extends keyof Events>(topic: K, listener: EventListener<Events[K]>): void {
    this.listener.once(topic, listener);
  }

  public off<K extends keyof Events>(topic: K, listener: EventListener<Events[K]>): void {
    this.listener.off(topic, listener);
  }

  public emit<K extends keyof Events>(topic: K, data: Events[K]): void {
    this.listener.emits(topic, data);
  }

  public clear(): void {
    this.listener.clear();
  }
}
