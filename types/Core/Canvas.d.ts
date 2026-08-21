import { EventEmitter } from '../Lib';
import type { Point } from './Shape';
/**
 * Canvas 配置选项接口
 * @interface CanvasOptions
 * @property {number} width - 画布宽度（CSS 像素）
 * @property {number} height - 画布高度（CSS 像素）
 * @property {number} ratio - 设备像素比（用于高 DPI 屏幕适配）
 * @property {string | HTMLCanvasElement} [selectors] - 可选，CSS 选择器或直接的 canvas 元素
 */
export interface CanvasOptions {
    width: number;
    ratio: number;
    height: number;
    selectors?: string | HTMLCanvasElement;
}
/**
 * 鼠标事件对象接口
 * @interface CanvasMouseEvent
 * @property {Point} start - 鼠标起始位置
 * @property {Point | null} move - 鼠标移动距离（相对起始位置）
 * @property {Point | null} point - 鼠标当前位置
 * @property {MouseEvent | null} event - 原生鼠标事件对象
 */
export interface CanvasMouseEvent {
    start: Point;
    move: Point | null;
    point: Point | null;
    event: MouseEvent | null;
}
/** 鼠标移动事件对象接口（move/point 保证非空） */
export interface CanvasMouseMoveEvent extends CanvasMouseEvent {
    move: Point;
    point: Point;
}
/** Canvas 事件集合 */
export interface CanvasEvents {
    mousedown: CanvasMouseEvent;
    mousemove: CanvasMouseMoveEvent;
    mouseup: CanvasMouseEvent;
    click: MouseEvent;
    dblclick: MouseEvent;
    contextmenu: MouseEvent;
    resize: {
        width: number;
        height: number;
        ratio: number;
    };
    clear: undefined;
}
/**
 * Canvas 封装类，继承 EventEmitter 以支持事件系统
 * 提供画布创建、尺寸管理、事件绑定、位图缓存等功能
 * @class Canvas
 * @extends EventEmitter
 */
export declare class Canvas extends EventEmitter<CanvasEvents> {
    private readonly config;
    readonly canvas: HTMLCanvasElement;
    readonly context: CanvasRenderingContext2D;
    private __cacheBitmap;
    private readonly domListeners;
    /** 获取当前画布宽度（CSS 像素） */
    get width(): number;
    /** 获取当前画布高度（CSS 像素） */
    get height(): number;
    /** 获取当前设备像素比 */
    get ratio(): number;
    /**
     * 构造函数
     * @param config - 部分配置选项，未提供的将使用默认值
     */
    constructor(config?: Partial<CanvasOptions>);
    /**
     * 验证设置值的有效性
     */
    private handlerValue;
    /** 设置画布宽度（CSS 像素） */
    set width(value: number);
    /** 设置画布高度（CSS 像素） */
    set height(value: number);
    /** 设置设备像素比（影响实际渲染像素） */
    set ratio(value: number);
    /**
     * 解析 canvas 元素
     * @param selectors - CSS 选择器或 HTMLCanvasElement
     * @returns {HTMLCanvasElement} 解析后的 canvas 元素
     * @throws 当解析失败时抛出错误
     */
    private resolveCanvasElement;
    /**
     * 添加 DOM 监听器（记录以便销毁时统一移除）
     */
    private addDomListener;
    /**
     * 移除 DOM 监听器
     */
    private removeDomListener;
    /**
     * 绑定 Canvas 交互事件
     * 事件系统会通过 EventEmitter 转发以下事件：
     * - mousedown/mousemove/mouseup: 鼠标按下/移动/释放
     * - click: 单击
     * - dblclick: 双击
     * - contextmenu: 右键菜单
     *
     * 注意：mousemove 事件在鼠标按下后才会触发
     */
    private bindEvents;
    /**
     * 处理画布尺寸/比例变更
     * 1. 清除位图缓存
     * 2. 设置 canvas 物理像素尺寸（width * ratio, height * ratio）
     * 3. 设置 CSS 显示尺寸（width * 1, height * 1）
     * 4. 缩放上下文，使绘图坐标保持为逻辑像素
     * 5. 发出 resize 事件
     */
    private handlerCanvas;
    /**
     * 绘制函数
     * @param func - 绘制函数
     */
    draw(func: (ctx: CanvasRenderingContext2D) => void): void;
    /**
     * 获取当前画布的位图数据（ImageData）
     * 使用缓存机制优化重复读取
     * @returns {ImageData | null} 位图数据或 null（当获取失败时）
     */
    getBitmap(): ImageData | null;
    /**
     * 清空画布
     * 1. 清除位图缓存
     * 2. 清空画布内容
     * 3. 发出 clear 事件
     */
    clear(): void;
    /**
     * 销毁画布
     * 1. 清空内容
     * 2. 清除事件监听
     * 3. 释放资源
     */
    destroy(): void;
}
