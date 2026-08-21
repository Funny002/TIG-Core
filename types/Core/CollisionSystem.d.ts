import type { QuadTreeOptions } from './QuadTree';
import type { Point, Shape, Size } from './Shape';
/**
 * 碰撞系统（空间索引）
 *
 * 封装四叉树空间索引与碰撞检测逻辑，与场景编排、渲染解耦。
 * 使用稳定 id 对碰撞对去重（每对仅报告一次），复用候选缓冲避免分配。
 */
export declare class CollisionSystem {
    private quadtree;
    private readonly config;
    private readonly idMap;
    private readonly candidateBuffer;
    private idCounter;
    constructor(config?: Partial<QuadTreeOptions>);
    /** 更新空间索引边界（画布尺寸变化时调用） */
    setBounds(size: Size, point?: Point): void;
    /** 依据图形集合重建空间索引 */
    rebuild(shapes: readonly Shape[]): void;
    /**
     * 检测图形集合中的碰撞（每对仅报告一次）
     * @returns 碰撞对数
     */
    detect(shapes: readonly Shape[], onCollide?: (a: Shape, b: Shape) => void): number;
    /** 为形状分配稳定 id */
    private idOf;
}
