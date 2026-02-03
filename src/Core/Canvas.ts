import { EngineLogger } from '../Logger';
import { EventEmitter } from '../Lib';
import type { Point } from './Shape.ts';

/**
 * Canvas配置选项接口
 * @interface CanvasOptions
 * @property {number} width - 画布宽度（CSS像素）
 * @property {number} height - 画布高度（CSS像素）
 * @property {number} ratio - 设备像素比（用于高DPI屏幕适配）
 * @property {string | HTMLCanvasElement} [selectors] - 可选，CSS选择器或直接的canvas元素
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
 * @property {Point} [move] - 鼠标移动位置（相对于起始位置）
 * @property {Point} start - 鼠标起始位置
 * @property {MouseEvent} [event] - 原生鼠标事件对象
 */
export interface CanvasMouseEvent {
  start: Point;
  move: null | Point;
  point: null | Point;
  event: null | MouseEvent;
}

/**
 * 鼠标移动事件对象接口
 * @interface CanvasMouseMoveEvent
 * @extends CanvasMouseEvent
 * @property {Point} move - 鼠标移动位置（相对于起始位置）
 */
export interface CanvasMouseMoveEvent extends CanvasMouseEvent {
  move: Point;
}

/**
 * Canvas封装类，继承EventEmitter以支持事件系统
 * 提供画布创建、尺寸管理、事件绑定、位图缓存等功能
 * @class Canvas
 * @extends EventEmitter
 */
export class Canvas extends EventEmitter {
  private readonly config: CanvasOptions;        // 画布配置
  public readonly canvas: HTMLCanvasElement;    // HTMLCanvasElement实例
  public readonly context: CanvasRenderingContext2D; // 2D渲染上下文
  //
  private __cacheBitmap: ImageData | null = null; // 位图缓存（用于性能优化）

  // --- 访问器属性 ---
  /** 获取当前画布宽度（CSS像素） */
  get width() {
    return this.config.width;
  }

  /** 获取当前画布高度（CSS像素） */
  get height() {
    return this.config.height;
  }

  /** 获取当前设备像素比 */
  get ratio() {
    return this.config.ratio;
  }

  /**
   * 验证设置值的有效性
   * @param key - 要设置的属性名
   * @param value - 目标值
   * @returns {boolean} - 是否允许设置
   */
  private handlerValue(key: 'width' | 'height' | 'ratio', value: number): boolean {
    if (!Number.isFinite(value) || value <= 0) return EngineLogger.warn(`${key} 不是有效值 (必须是大于0的有限数字)`), false;
    if (this[key] === value) return false;
    return true;
  }

  /** 设置画布宽度（CSS像素） */
  set width(value: number) {
    if (!this.handlerValue('width', value)) return;
    this.config.width = value;
    this.handlerCanvas();
  }

  /** 设置画布高度（CSS像素） */
  set height(value: number) {
    if (!this.handlerValue('height', value)) return;
    this.config.height = value;
    this.handlerCanvas();
  }

  /** 设置设备像素比（影响实际渲染像素） */
  set ratio(value: number) {
    if (!this.handlerValue('ratio', value)) return;
    this.config.ratio = value;
    this.handlerCanvas();
  }

  /**
   * 构造函数
   * @param config - 部分配置选项，未提供的将使用默认值
   */
  constructor(config: Partial<CanvasOptions> = {}) {
    super();
    // 解析并创建canvas元素
    this.canvas = this.resolveCanvasElement(config.selectors);
    // 合并配置（默认width/height=0, ratio=1）
    this.config = Object.assign({ width: 0, height: 0, ratio: 1 }, config) as CanvasOptions;

    // 获取2D渲染上下文（启用willReadFrequently优化读取性能）
    const ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      const msg = 'Canvas 2D 不支持';
      EngineLogger.error(msg);
      throw new Error(msg);
    }
    this.context = ctx;

    // 绑定事件并初始化画布
    this.bindEvents();
    this.handlerCanvas();
  }

  /**
   * 解析canvas元素
   * @param selectors - CSS选择器或HTMLCanvasElement
   * @returns {HTMLCanvasElement} 解析后的canvas元素
   * @throws 当解析失败时抛出错误
   */
  private resolveCanvasElement(selectors?: string | HTMLCanvasElement): HTMLCanvasElement {
    // 未提供则创建新元素
    if (!selectors) return document.createElement('canvas');

    // 直接传入canvas元素
    if (selectors instanceof HTMLCanvasElement) return selectors;

    // 通过CSS选择器查找
    if (typeof selectors === 'string') {
      const dom = document.querySelector(selectors);
      if (dom instanceof HTMLCanvasElement) return dom;
      const msg = `未找到 canvas 元素: ${selectors}`;
      EngineLogger.error(msg);
      throw new Error(msg);
    }

    // 无效的输入类型
    const msg = 'selectors 必须是 CSS 选择器字符串或 HTMLCanvasElement';
    EngineLogger.error(msg);
    throw new Error(msg);
  }

  /**
   * 绑定Canvas交互事件
   * 事件系统会通过EventEmitter转发以下事件：
   * - mousedown/mousemove/mouseup: 鼠标按下/移动/释放
   * - click: 单击
   * - dblclick: 双击
   * - contextmenu: 右键菜单
   *
   * 注意：mousemove 事件在鼠标按下后才会触发
   */
  private bindEvents() {
    const event: CanvasMouseEvent = { move: null, point: null, event: null, start: { x: 0, y: 0 } };
    // 鼠标按下处理
    const onMouseDown = (e: MouseEvent) => {
      event.event = e;
      event.start = { x: e.offsetX, y: e.offsetY };
      event.point = { x: e.offsetX, y: e.offsetY };
      this.emit('mousedown', event);

      // 鼠标移动处理（仅在按下时监听）
      const onMouseMove = (e: MouseEvent) => {
        event.event = e;
        event.point = { x: e.offsetX, y: e.offsetY };
        event.move = { x: e.offsetX - event.start.x, y: e.offsetY - event.start.y };
        this.emit('mousemove', event);
      };

      // 鼠标释放处理
      const onMouseUp = (e: MouseEvent) => {
        event.event = e;
        event.move = null;
        event.point = null;
        this.emit('mouseup', event);
        // 移除临时事件监听
        this.canvas.removeEventListener('mouseup', onMouseUp);
        this.canvas.removeEventListener('mousemove', onMouseMove);
      };

      // 绑定临时事件
      this.canvas.addEventListener('mouseup', onMouseUp);
      this.canvas.addEventListener('mousemove', onMouseMove);
    };

    // 绑定基础事件
    this.canvas.addEventListener('mousedown', onMouseDown);
    this.canvas.addEventListener('click', (...args) => this.emit('click', ...args));
    this.canvas.addEventListener('dblclick', (...args) => this.emit('dblclick', ...args));
    this.canvas.addEventListener('contextmenu', (...args) => this.emit('contextmenu', ...args));
  }

  /**
   * 处理画布尺寸/比例变更
   * 1. 清除位图缓存
   * 2. 设置canvas物理像素尺寸（width * ratio, height * ratio）
   * 3. 设置CSS显示尺寸（width * 1, height * 1）
   * 4. 发出resize事件
   */
  private handlerCanvas() {
    this.__cacheBitmap = null; // 尺寸变化后缓存失效

    // 设置物理像素尺寸（高DPI适配）
    this.canvas.width = this.width * this.ratio;
    this.canvas.height = this.height * this.ratio;

    // 设置CSS显示尺寸（保持逻辑像素）
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    // 触发resize事件
    this.emit('resize', { width: this.width, height: this.height, ratio: this.ratio });
  }

  /**
   * 绘制函数
   * @param func - 绘制函数
   */
  draw(func: (ctx: CanvasRenderingContext2D) => void) {
    func(this.context);
  }

  /**
   * 获取当前画布的位图数据（ImageData）
   * 使用缓存机制优化重复读取
   * @returns {ImageData | null} 位图数据或null（当获取失败时）
   */
  getBitmap() {
    try {
      if (this.__cacheBitmap) return this.__cacheBitmap;
      // 从整个画布读取像素数据（考虑设备像素比）
      this.__cacheBitmap = this.context.getImageData(0, 0, this.width * this.ratio, this.height * this.ratio);
      return this.__cacheBitmap;
    } catch (e) {
      EngineLogger.error(e);
      return null;
    }
  }

  /**
   * 清空画布
   * 1. 清除位图缓存
   * 2. 清空画布内容
   * 3. 发出clear事件
   */
  clear() {
    this.__cacheBitmap = null;
    // 快照
    this.context.save();
    // 重置
    this.context.resetTransform();
    // 关闭全部路径
    this.context.beginPath();
    // 清空画布
    this.context.clearRect(0, 0, this.width * this.ratio, this.height * this.ratio);
    // 还原
    this.context.restore();
    // 触发事件
    this.emit('clear');
  }

  /**
   * 销毁画布
   * 1. 清空内容
   * 2. 清除事件监听
   * 3. 释放资源
   */
  destroy() {
    this.clear();
    super.clear(); // 清除EventEmitter中的事件监听
  }
}
