/**
 * 事件监听器类型定义
 * @param data 事件传递的数据
 * @returns void
 */
export type EventListener = (data: any) => void;

/**
 * 事件监听器类
 * 实现了发布/订阅模式，用于管理事件的订阅、取消订阅和发布
 */
export class Listener {
  /**
   * 存储所有主题及其对应的监听器列表
   * 键为主题名称，值为该主题下的监听器数组
   */
  private topics: { [key: string]: EventListener[] } = {};

  /**
   * 订阅主题
   * @param topic 主题名称
   * @param listener 事件监听器函数
   */
  public on(topic: string, listener: EventListener) {
    // 如果该主题还没有被订阅过，初始化一个空数组
    if (!this.topics[topic]) {
      this.topics[topic] = [];
    }
    // 将监听器添加到对应主题的监听器数组中
    this.topics[topic].push(listener);
  }

  /**
   * 取消订阅主题
   * @param topic 主题名称
   * @param listener 要移除的事件监听器函数
   */
  public off(topic: string, listener: EventListener) {
    // 获取指定主题的监听器数组
    const topicListeners = this.topics[topic];
    if (topicListeners) {
      // 查找要移除的监听器在数组中的索引
      const index = topicListeners.indexOf(listener);
      // 如果找到，则从数组中移除
      if (index !== -1) {
        topicListeners.splice(index, 1);
      }
    }
  }

  /**
   * 发布主题事件
   * @param topic 主题名称
   * @param data 要传递给监听器的数据
   */
  public emits(topic: string, data?: any) {
    // 获取指定主题的监听器数组
    const topicListeners = this.topics[topic];
    if (topicListeners) {
      // 遍历所有监听器并调用，传递数据
      topicListeners.forEach((listener) => listener(data));
    }
  }

  /**
   * 订阅主题一次
   * @param topic 订阅的主题名称
   * @param listener 监听器函数
   */
  public once(topic: string, listener: EventListener) {
    // 创建一个包装函数，用于在调用监听器后取消订阅
    const onceListener = (data: any) => {
      // 调用原始监听器
      listener(data);
      // 移除监听器
      this.off(topic, onceListener);
    };
    // 订阅主题，使用包装函数
    this.on(topic, onceListener);
  }

  /**
   * 清空所有主题的监听器
   */
  public clear() {
    this.topics = {};
  }
}

export abstract class EventEmitter {
  private listener: Listener = new Listener();

  public on(topic: string, listener: EventListener) {
    this.listener.on(topic, listener);
  }

  public once(topic: string, listener: EventListener) {
    this.listener.once(topic, listener);
  }

  public off(topic: string, listener: EventListener) {
    this.listener.off(topic, listener);
  }

  public emit(topic: string, data?: any) {
    this.listener.emits(topic, data);
  }

  public clear() {
    this.listener.clear();
  }
}
