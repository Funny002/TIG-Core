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

/** Shape 事件集合 */
export interface ShapeEvents {
  /** 当坐标 (x, y) 发生变化时触发 */
  'point-changed': Point;
  /** 当尺寸 (width, height) 发生变化时触发 */
  'size-changed': Size;
  /** 当调用 move 方法移动形状时触发 */
  'move': Point;
}

/**
 * 形状抽象基类，提供基础的位置、尺寸、层级、旋转和事件管理能力
 * @abstract
 * @extends EventEmitter
 * @fires Shape#point-changed - 当坐标 (x, y) 发生变化时触发
 * @fires Shape#size-changed - 当尺寸 (width, height) 发生变化时触发
 * @fires Shape#move - 当调用 move 方法移动形状时触发
 */
export abstract class Shape extends EventEmitter<ShapeEvents> {
  /** 形状尺寸（子类可直接赋值或覆盖 size 访问器实现动态尺寸） */
  protected _size: Size = { width: 0, height: 0 };

  /** 基础坐标点 */
  protected point: Point;

  /** 包围盒缓存（几何变化时置脏，访问时惰性重算） */
  private _boundsCache: Bounding | null = null;
  private _boundsDirty = true;

  /** 是否可见（不可见时跳过绘制） */
  public visible = true;
  /** 层级，用于控制图形的叠加顺序 */
  public zIndex = 0;
  /** 旋转角度（弧度），围绕形状中心旋转 */
  public rotate = 0;
  /** 关联节点数据，可用于存储自定义信息或 DOM 引用 */
  public node?: unknown = undefined;

  /** 形状类型标识（用于碰撞检测分发，避免子类间循环依赖） */
  public readonly type: string = 'shape';

  // --- 访问器属性 ---
  /** 获取 X 坐标 */
  get x(): number {
    return this.point.x;
  }

  /** 获取 Y 坐标 */
  get y(): number {
    return this.point.y;
  }

  /** 获取尺寸 */
  get size(): Size {
    return this._size;
  }

  /** 获取宽度 */
  get width(): number {
    return this.size.width;
  }

  /** 获取高度 */
  get height(): number {
    return this.size.height;
  }

  /** 获取形状中心点 X 坐标 */
  get centerX(): number {
    return this.point.x + this.size.width / 2;
  }

  /** 获取形状中心点 Y 坐标 */
  get centerY(): number {
    return this.point.y + this.size.height / 2;
  }

  /** 获取形状中心点 */
  get center(): Point {
    return { x: this.centerX, y: this.centerY };
  }

  /**
   * 获取形状的完整边界信息（带缓存，几何变化后惰性重算）
   * 注意：返回的是内部缓存对象（只读），如需独立副本请展开拷贝（如 `{ ...shape.bounds }`）
   * @returns {Bounding} 包含位置、尺寸和四边坐标的边界对象
   */
  get bounds(): Bounding {
    if (this._boundsDirty || this._boundsCache === null) {
      this._boundsCache = this.computeBounds();
      this._boundsDirty = false;
    }
    return this._boundsCache;
  }

  /** 计算包围盒（子类可覆盖以提供紧凑/动态边界） */
  protected computeBounds(): Bounding {
    const { width, height } = this._size;
    return {
      top: this.point.y,
      left: this.point.x,
      width,
      height,
      right: this.point.x + width,
      bottom: this.point.y + height,
    };
  }

  /** 使包围盒缓存失效（几何发生变化时调用） */
  protected invalidateBounds(): void {
    this._boundsDirty = true;
  }

  /**
   * 构造函数
   * @param point - 初始坐标点
   */
  constructor(point: Point = { x: 0, y: 0 }) {
    super();
    this.point = { ...point };
  }

  /** 设置坐标值（带校验与事件） */
  protected setPointValue(key: 'x' | 'y', value: number): void {
    if (!Number.isFinite(value)) {
      EngineLogger.error(`${key} 属性值无效`);
      return;
    }
    if (this.point[key] === value) return;
    this.point[key] = value;
    this.invalidateBounds();
    this.emit('point-changed', { ...this.point });
  }

  /** 设置尺寸值（带校验与事件） */
  protected setSizeValue(key: 'width' | 'height', value: number): void {
    if (!Number.isFinite(value) || value < 0) {
      EngineLogger.error(`${key} 属性值无效（必须为大于等于 0 的有限数字）`);
      return;
    }
    if (this.size[key] === value) return;
    this.size[key] = value;
    this.invalidateBounds();
    this.emit('size-changed', { width: this.width, height: this.height });
  }

  /** 设置 Y 坐标，验证通过后触发 point-changed 事件 */
  set y(value: number) {
    this.setPointValue('y', value);
  }

  /** 设置 X 坐标，验证通过后触发 point-changed 事件 */
  set x(value: number) {
    this.setPointValue('x', value);
  }

  /** 设置宽度，验证通过后触发 size-changed 事件 */
  set width(value: number) {
    this.setSizeValue('width', value);
  }

  /** 设置高度，验证通过后触发 size-changed 事件 */
  set height(value: number) {
    this.setSizeValue('height', value);
  }

  /**
   * 移动形状到相对位置
   * @param dx - X轴偏移量
   * @param dy - Y轴偏移量
   * @fires Shape#move - 移动后触发，携带新坐标
   */
  move(dx: number, dy: number): void {
    if (!Number.isFinite(dx) || !Number.isFinite(dy)) return;
    this.point.x += dx;
    this.point.y += dy;
    this.invalidateBounds();
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
      visible: this.visible,
      zIndex: this.zIndex,
      rotate: this.rotate,
      size: { ...this.size },
      point: { ...this.point },
      bounds: { ...this.bounds },
    };
  }

  /**
   * 绘制形状
   * 统一处理可见性、状态保存/还原以及旋转变换，实际绘制逻辑由子类 paint 实现
   * @param ctx - Canvas 渲染上下文
   */
  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.visible) return;
    ctx.save();
    try {
      // 应用旋转（围绕形状中心）
      if (this.rotate !== 0) {
        ctx.translate(this.centerX, this.centerY);
        ctx.rotate(this.rotate);
        ctx.translate(-this.centerX, -this.centerY);
      }
      this.paint(ctx);
    } finally {
      ctx.restore();
    }
  }

  /**
   * 实际绘制逻辑（上下文已应用旋转变换）
   * @abstract
   * @param ctx - Canvas 渲染上下文
   */
  protected abstract paint(ctx: CanvasRenderingContext2D): void;

  /**
   * 碰撞检测抽象方法
   * @abstract
   * @param other - 另一个形状
   * @returns {boolean} - 是否发生碰撞
   * @throws {Error} - 如果子类未实现
   */
  abstract collision(other: Shape): boolean;
}
