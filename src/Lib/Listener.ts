export type EventListener<T> = (data: T) => void;

// TODO: 监听器
export class Listener<T = any> {
  // TODO: 主题
  private topics: { [key: string]: EventListener<T>[] } = {};

  // TODO: 订阅
  public subscribe(topic: string, listener: EventListener<T>) {
    if (!this.topics[topic]) {
      this.topics[topic] = [];
    }
    this.topics[topic].push(listener);
  }

  // TODO: 取消订阅
  public unsubscribe(topic: string, listener: EventListener<T>) {
    const topicListeners = this.topics[topic];
    if (topicListeners) {
      const index = topicListeners.indexOf(listener);
      if (index !== -1) {
        topicListeners.splice(index, 1);
      }
    }
  }

  // TODO: 发布
  public publish(topic: string, data: T) {
    const topicListeners = this.topics[topic];
    if (topicListeners) {
      topicListeners.forEach((listener) => listener(data));
    }
  }
}
