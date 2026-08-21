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
export declare class Scene {
    readonly canvas: Canvas;
    readonly engine: Engine;
    readonly collisionSystem: CollisionSystem;
    readonly renderer: SceneRenderer;
    private readonly options;
    private readonly shapes;
    private readonly shapeSet;
    private collisions;
    private readonly resizeHandler;
    constructor(options: SceneOptions);
    /** 图形列表（只读副本） */
    get shapeList(): Shape[];
    /** 图形数量 */
    get count(): number;
    /** 上一物理步检测到的碰撞对数 */
    get collisionCount(): number;
    /** 添加图形 */
    add(shape: Shape): this;
    /** 移除图形 */
    remove(shape: Shape): this;
    /** 是否包含图形 */
    has(shape: Shape): boolean;
    /** 清空图形 */
    clear(): this;
    /** 启动游戏循环 */
    start(): void;
    /** 停止游戏循环 */
    stop(): void;
    /** 销毁场景 */
    destroy(): void;
    /** 物理更新：用户逻辑 -> 重建空间索引 -> 碰撞检测 */
    private update;
    /** 渲染：清屏 -> 用户绘制 -> 按 zIndex 排序绘制图形 */
    private render;
}
