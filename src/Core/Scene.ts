import { Canvas } from './Canvas';
import { CollisionSystem } from './CollisionSystem';
import { Engine } from './Engine';
import { SceneRenderer } from './SceneRenderer';
import type { EngineConfig } from './Engine';
import type { QuadTreeOptions } from './QuadTree';
import type { Shape } from './Shape';

/** 场景选项接口 */
export interface SceneOptions {
  /** 画布实例 */
  canvas: Canvas;
  /** 引擎配置（固定时间步长） */
  engine?: Partial<EngineConfig>;
  /** 四叉树配置 */
  quadtree?: Partial<QuadTreeOptions>;
  /** 物理更新回调（固定步长触发） */
  onUpdate?: (timestep: number, scene: Scene) => void;
  /** 渲染回调（在绘制图形之前调用，用于背景/自定义绘制） */
  onRender?: (alpha: number, scene: Scene) => void;
  /** 碰撞回调（每对碰撞形状触发一次） */
  onCollide?: (a: Shape, b: Shape, scene: Scene) => void;
}

/**
 * 场景类
 * 将画布、固定时间步长引擎、空间索引与图形集合整合为一个可运行的游戏循环。
 *
 * 架构：场景由三个低耦合模块组合而成
 * - `Engine`：固定时间步长循环；
 * - `CollisionSystem`：四叉树空间索引 + 碰撞检测；
 * - `SceneRenderer`：按 zIndex 排序绘制。
 *
 * - 物理更新以固定步长执行（修正高刷加速问题）；
 * - 每个物理步重建空间索引并进行碰撞检测；
 * - 渲染时按 zIndex 排序绘制。
 */
export class Scene {
  public readonly canvas: Canvas;
  public readonly engine: Engine;
  public readonly collisionSystem: CollisionSystem;
  public readonly renderer: SceneRenderer;

  private readonly options: SceneOptions;
  private readonly shapes: Shape[] = [];
  private readonly shapeSet: Set<Shape> = new Set();
  private collisions = 0;
  private readonly resizeHandler: () => void;

  constructor(options: SceneOptions) {
    this.canvas = options.canvas;
    this.options = options;
    this.engine = new Engine(options.engine);
    this.collisionSystem = new CollisionSystem({
      point: { x: 0, y: 0 },
      size: { width: this.canvas.width, height: this.canvas.height },
      ...options.quadtree,
    });
    this.renderer = new SceneRenderer(this.canvas);

    this.engine.setCallbacks({
      onUpdate: (timestep) => this.update(timestep),
      onRender: (alpha) => this.render(alpha),
    });

    // 画布尺寸变化时重建空间索引
    this.resizeHandler = () => {
      this.collisionSystem.setBounds(
        { width: this.canvas.width, height: this.canvas.height },
        { x: 0, y: 0 },
      );
    };
    this.canvas.on('resize', this.resizeHandler);
  }

  /** 图形列表（只读副本） */
  get shapeList(): Shape[] {
    return [...this.shapes];
  }

  /** 图形数量 */
  get count(): number {
    return this.shapes.length;
  }

  /** 上一物理步检测到的碰撞对数 */
  get collisionCount(): number {
    return this.collisions;
  }

  /** 添加图形 */
  add(shape: Shape): this {
    if (!this.shapeSet.has(shape)) {
      this.shapeSet.add(shape);
      this.shapes.push(shape);
    }
    return this;
  }

  /** 移除图形 */
  remove(shape: Shape): this {
    if (this.shapeSet.has(shape)) {
      this.shapeSet.delete(shape);
      const index = this.shapes.indexOf(shape);
      if (index !== -1) this.shapes.splice(index, 1);
    }
    return this;
  }

  /** 是否包含图形 */
  has(shape: Shape): boolean {
    return this.shapeSet.has(shape);
  }

  /** 清空图形 */
  clear(): this {
    this.shapes.length = 0;
    this.shapeSet.clear();
    return this;
  }

  /** 启动游戏循环 */
  start(): void {
    this.engine.start();
  }

  /** 停止游戏循环 */
  stop(): void {
    this.engine.stop();
  }

  /** 销毁场景 */
  destroy(): void {
    this.stop();
    this.canvas.off('resize', this.resizeHandler);
    this.clear();
  }

  /** 物理更新：用户逻辑 -> 重建空间索引 -> 碰撞检测 */
  private update(timestep: number): void {
    this.options.onUpdate?.(timestep, this);

    this.collisionSystem.rebuild(this.shapes);
    this.collisions = this.collisionSystem.detect(this.shapes, (a, b) => {
      this.options.onCollide?.(a, b, this);
    });
  }

  /** 渲染：清屏 -> 用户绘制 -> 按 zIndex 排序绘制图形 */
  private render(alpha: number): void {
    this.canvas.clear();
    this.options.onRender?.(alpha, this);
    this.renderer.draw(this.shapes);
  }
}
