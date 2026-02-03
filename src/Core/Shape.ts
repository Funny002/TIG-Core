import { EngineLogger } from '../Logger';
import { EventEmitter } from '../Lib';

/**
 * 二维点坐标接口
 * @interface Point
 * @property {number} x - X轴坐标
 * @property {number} y - Y轴坐标
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * 尺寸接口
 * @interface Size
 * @property {number} width - 宽度
 * @property {number} height - 高度
 */
export interface Size {
  width: number;
  height: number;
}

/**
 * 形状边界信息接口
 * @interface Bounding
 * @property {number} top - 上边界坐标（y）
 * @property {number} left - 左边界坐标（x）
 * @property {number} right - 右边界坐标（x + width）
 * @property {number} bottom - 下边界坐标（y + height）
 * @property {number} width - 宽度（right - left）
 * @property {number} height - 高度（bottom - top）
 */
export interface Bounding {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

/**
 * 形状抽象基类，提供基础的位置、尺寸和事件管理能力
 * @abstract
 * @extends EventEmitter
 * @fires Shape#point-changed - 当坐标(x, y)发生变化时触发
 * @fires Shape#size-changed - 当尺寸(width, height)发生变化时触发
 * @fires Shape#move - 当调用move方法移动形状时触发
 */
export abstract class Shape extends EventEmitter {
  /** 抽象尺寸属性，必须由子类实现 */
  abstract readonly size: Size;

  /** 基础坐标点 */
  protected point: Point;

  /** 关联节点数据，可用于存储自定义信息或DOM引用 */
  public node?: any = undefined;

  // --- 访问器属性 ---
  /** 获取X坐标 */
  get x(): number {
    return this.point.x;
  }

  /** 获取Y坐标 */
  get y(): number {
    return this.point.y;
  }

  /** 获取宽度 */
  get width(): number {
    return this.size.width;
  }

  /** 获取高度 */
  get height(): number {
    return this.size.height;
  }

  /**
   * 获取形状的完整边界信息（实时计算）
   * @returns {Bounding} 包含位置、尺寸和四边坐标的边界对象
   */
  get bounds(): Bounding {
    return {
      top: this.point.y,
      left: this.point.x,
      width: this.size.width,
      height: this.size.height,
      // 计算得出的右边界和下边界
      right: this.point.x + this.size.width,
      bottom: this.point.y + this.size.height,
    };
  };

  /**
   * 构造函数
   * @param point - 初始坐标点
   */
  constructor(point: Point) {
    super();
    this.point = point;
  }

  /**
   * 验证属性值的有效性
   * @param key - 属性名（x, y, width, height）
   * @param value - 目标值
   * @returns {boolean} - 是否允许设置（必须是有限数字且不等于当前值）
   */
  protected handlerValue(key: 'x' | 'y' | 'width' | 'height', value: number): boolean {
    if (!Number.isFinite(value)) return EngineLogger.error(`${key} 属性值无效`), false;
    return this[key] !== value;
  }

  /** 设置Y坐标，验证通过后触发point-changed事件 */
  set y(value: number) {
    if (!this.handlerValue('y', value)) return;
    this.point.y = value;
    this.emit('point-changed', { ...this.point });
  }

  /** 设置X坐标，验证通过后触发point-changed事件 */
  set x(value: number) {
    if (!this.handlerValue('x', value)) return;
    this.point.x = value;
    this.emit('point-changed', { ...this.point });
  }

  /** 设置宽度，验证通过后触发size-changed事件 */
  set width(value: number) {
    if (!this.handlerValue('width', value)) return;
    this.size.width = value;
    this.emit('size-changed', { width: this.width, height: this.height });
  }

  /** 设置高度，验证通过后触发size-changed事件 */
  set height(value: number) {
    if (!this.handlerValue('height', value)) return;
    this.size.height = value;
    this.emit('size-changed', { width: this.width, height: this.height });
  }

  /**
   * 移动形状到相对位置
   * @param dx - X轴偏移量
   * @param dy - Y轴偏移量
   * @fires Shape#move - 移动后触发，携带新坐标
   */
  move(dx: number, dy: number) {
    this.point.x += dx;
    this.point.y += dy;
    this.emit('move', { x: this.x, y: this.y });
  }

  /**
   * 获取当前状态
   * @returns {Record<string, any>} - 状态对象
   */
  getState(): Record<string, any> {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      size: { ...this.size },
      point: { ...this.point },
      bounds: { ...this.bounds },
    };
  };

  /**
   * 碰撞检测抽象方法
   * @abstract
   * @param other - 另一个形状
   * @returns {boolean} - 是否发生碰撞
   * @throws {Error} - 如果子类未实现
   */
  abstract collision(other: Shape): boolean;

  /**
   * 绘制形状抽象方法
   * @abstract
   * @param ctx - Canvas渲染上下文
   * @throws {Error} - 如果子类未实现
   */
  abstract draw(ctx: CanvasRenderingContext2D): void;
}
