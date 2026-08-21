/** 事件监听器类型定义 */
export type EventListener<T = any> = (data: T) => void;
/**
 * 事件监听器类
 * 实现发布/订阅模式，用于管理事件的订阅、取消订阅和发布
 */
export declare class Listener<Events extends Record<string, any> = Record<string, any>> {
    /** 存储所有主题及其对应的监听器列表 */
    private topics;
    /** 订阅主题 */
    on<K extends keyof Events>(topic: K, listener: EventListener<Events[K]>): void;
    /** 取消订阅主题 */
    off<K extends keyof Events>(topic: K, listener: EventListener<Events[K]>): void;
    /** 发布主题事件 */
    emits<K extends keyof Events>(topic: K, data: Events[K]): void;
    /** 订阅主题一次 */
    once<K extends keyof Events>(topic: K, listener: EventListener<Events[K]>): void;
    /** 清空所有主题的监听器 */
    clear(): void;
}
/**
 * 事件发射器抽象基类
 * 为子类提供 on/once/off/emit/clear 事件能力
 */
export declare abstract class EventEmitter<Events extends Record<string, any> = Record<string, any>> {
    private listener;
    on<K extends keyof Events>(topic: K, listener: EventListener<Events[K]>): void;
    once<K extends keyof Events>(topic: K, listener: EventListener<Events[K]>): void;
    off<K extends keyof Events>(topic: K, listener: EventListener<Events[K]>): void;
    emit<K extends keyof Events>(topic: K, data: Events[K]): void;
    clear(): void;
}
