export type EventListener<T> = (data: T) => void;

export class Listener<T = any> {
  private topics: { [key: string]: EventListener<T>[] } = {};

  public subscribe(topic: string, listener: EventListener<T>) {
    if (!this.topics[topic]) {
      this.topics[topic] = [];
    }
    this.topics[topic].push(listener);
  }
  
  public unsubscribe(topic: string, listener: EventListener<T>) {
    const topicListeners = this.topics[topic];
    if (topicListeners) {
      const index = topicListeners.indexOf(listener);
      if (index !== -1) {
        topicListeners.splice(index, 1);
      }
    }
  }

  public publish(topic: string, data: T) {
    const topicListeners = this.topics[topic];
    if (topicListeners) {
      topicListeners.forEach((listener) => listener(data));
    }
  }
}
