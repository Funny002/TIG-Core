import type { Bounding, Point, Shape, Size } from './Shape';
/** 四叉树配置选项接口 */
export interface QuadTreeOptions {
    size: Size;
    point: Point;
    minSize: number;
    maxDepth: number;
    splitChildren: number;
}
/** 四叉树状态接口（用于序列化/调试） */
export interface QuadTreeState {
    x: number;
    y: number;
    width: number;
    height: number;
    bounds: Bounding;
    children: Record<string, any>[];
    childrenNode: QuadTreeState[];
}
/** 形状在树中的索引记录 */
interface ShapeIndex {
    node: QuadTree;
    index: number;
}
/**
 * 四叉树实现类
 * 用于空间划分，高效管理二维空间中的形状（碰撞检测、范围查询等）
 * 特性：
 * - 动态分裂：当节点内形状数量超过阈值时分裂为四个子节点
 * - 自动合并：当子节点形状数量减少时，合并回父节点
 * - 深度控制：通过最大深度防止过度递归
 */
export declare class QuadTree {
    private readonly x;
    private readonly y;
    private readonly width;
    private readonly height;
    private readonly minSize;
    private readonly centerX;
    private readonly centerY;
    private readonly splitChildren;
    private readonly maxDepth;
    private parent;
    private readonly indexMap;
    private isSplit;
    private disableSplit;
    private children;
    private childrenNode;
    private readonly bounds;
    private readonly boundsList;
    constructor(options?: Partial<QuadTreeOptions>, indexMap?: WeakMap<Shape, ShapeIndex>);
    /** 创建子节点（私有构造函数逻辑） */
    private createChild;
    /**
     * 确定形状所属的子节点象限
     * @param shape - 目标形状
     * @returns 象限索引（0-3）或 -1（不属于任何子节点，跨越象限边界）
     */
    private getIndex;
    /**
     * 将形状添加到当前节点，并记录索引信息
     */
    private insertPush;
    /**
     * 尝试分裂当前节点
     */
    private split;
    /**
     * 尝试合并子节点（当形状总数低于阈值时）
     */
    private tryMerge;
    /**
     * 获取当前节点的序列化状态（主要用于调试和可视化）
     */
    getState(): QuadTreeState;
    /**
     * 插入形状到四叉树
     * @param shape - 目标形状
     */
    insert(shape: Shape): void;
    /**
     * 从树中移除形状
     * @param shape - 目标形状
     */
    remove(shape: Shape): void;
    /**
     * 更新形状在树中的位置
     * 先移除再重新插入
     * @param shape - 目标形状
     */
    update(shape: Shape): void;
    /**
     * 获取当前节点直接存储的形状
     */
    getNodeShapes(): Shape[];
    /**
     * 获取当前节点及其所有后代节点的形状（深度优先遍历）
     */
    getAllShapes(): Shape[];
    /**
     * 检索可能与给定形状发生碰撞的候选形状
     * @param shape - 目标形状
     * @param out - 可选的结果数组（复用可减少分配，调用方需保证初始为空）
     * @returns 候选形状数组
     */
    retrieve(shape: Shape, out?: Shape[]): Shape[];
    /**
     * 查询与给定形状边界相交的所有形状（碰撞候选）
     * @param shape - 目标形状
     * @param out - 可选的结果数组（复用可减少分配）
     * @returns 边界相交的形状数组
     */
    query(shape: Shape, out?: Shape[]): Shape[];
    /**
     * 检测与给定形状实际发生碰撞的形状
     * @param shape - 目标形状
     * @returns 碰撞形状数组（通过 shape.collision 判定）
     */
    collide(shape: Shape): Shape[];
    /**
     * 清空整个四叉树
     */
    clear(): void;
}
export {};
