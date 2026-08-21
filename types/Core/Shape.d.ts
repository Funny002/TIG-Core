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
export declare abstract class Shape extends EventEmitter<ShapeEvents> {
    /** 形状尺寸（子类可直接赋值或覆盖 size 访问器实现动态尺寸） */
    protected _size: Size;
    /** 基础坐标点 */
    protected point: Point;
    /** 包围盒缓存（几何变化时置脏，访问时惰性重算） */
    private _boundsCache;
    private _boundsDirty;
    /** 是否可见（不可见时跳过绘制） */
    visible: boolean;
    /** 层级，用于控制图形的叠加顺序 */
    zIndex: number;
    /** 旋转角度（弧度），围绕形状中心旋转 */
    rotate: number;
    /** 关联节点数据，可用于存储自定义信息或 DOM 引用 */
    node?: unknown;
    /** 形状类型标识（用于碰撞检测分发，避免子类间循环依赖） */
    readonly type: string;
    /** 获取 X 坐标 */
    get x(): number;
    /** 获取 Y 坐标 */
    get y(): number;
    /** 获取尺寸 */
    get size(): Size;
    /** 获取宽度 */
    get width(): number;
    /** 获取高度 */
    get height(): number;
    /** 获取形状中心点 X 坐标 */
    get centerX(): number;
    /** 获取形状中心点 Y 坐标 */
    get centerY(): number;
    /** 获取形状中心点 */
    get center(): Point;
    /**
     * 获取形状的完整边界信息（带缓存，几何变化后惰性重算）
     * 注意：返回的是内部缓存对象（只读），如需独立副本请展开拷贝（如 `{ ...shape.bounds }`）
     * @returns {Bounding} 包含位置、尺寸和四边坐标的边界对象
     */
    get bounds(): Bounding;
    /** 计算包围盒（子类可覆盖以提供紧凑/动态边界） */
    protected computeBounds(): Bounding;
    /** 使包围盒缓存失效（几何发生变化时调用） */
    protected invalidateBounds(): void;
    /**
     * 构造函数
     * @param point - 初始坐标点
     */
    constructor(point?: Point);
    /** 设置坐标值（带校验与事件） */
    protected setPointValue(key: 'x' | 'y', value: number): void;
    /** 设置尺寸值（带校验与事件） */
    protected setSizeValue(key: 'width' | 'height', value: number): void;
    /** 设置 Y 坐标，验证通过后触发 point-changed 事件 */
    set y(value: number);
    /** 设置 X 坐标，验证通过后触发 point-changed 事件 */
    set x(value: number);
    /** 设置宽度，验证通过后触发 size-changed 事件 */
    set width(value: number);
    /** 设置高度，验证通过后触发 size-changed 事件 */
    set height(value: number);
    /**
     * 移动形状到相对位置
     * @param dx - X轴偏移量
     * @param dy - Y轴偏移量
     * @fires Shape#move - 移动后触发，携带新坐标
     */
    move(dx: number, dy: number): void;
    /**
     * 获取当前状态
     * @returns {Record<string, any>} - 状态对象
     */
    getState(): Record<string, any>;
    /**
     * 绘制形状
     * 统一处理可见性、状态保存/还原以及旋转变换，实际绘制逻辑由子类 paint 实现
     * @param ctx - Canvas 渲染上下文
     */
    draw(ctx: CanvasRenderingContext2D): void;
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
