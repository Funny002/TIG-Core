import type { Bounding, Point, Shape, Size } from './Shape';
import { EngineLogger } from '../Logger';

/** 四叉树配置选项接口 */
export interface QuadTreeOptions {
  size: Size;          // 四叉树区域尺寸
  point: Point;        // 四叉树起始坐标
  minSize: number;     // 最小节点尺寸（防止无限分割）
  maxDepth: number;    // 最大递归深度
  splitChildren: number; // 触发节点分裂的子元素数量阈值
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
export class QuadTree {
  // 基础属性
  private readonly x: number;          // 节点左上角 x 坐标
  private readonly y: number;          // 节点左上角 y 坐标
  private readonly width: number;      // 节点宽度
  private readonly height: number;     // 节点高度
  private readonly minSize: number;    // 最小尺寸限制（避免无限分割）

  // 中心点坐标（用于分裂时创建子节点）
  private readonly centerX: number;
  private readonly centerY: number;

  // 配置参数
  private readonly splitChildren: number;  // 分裂阈值
  private readonly maxDepth: number;       // 最大递归深度

  // 树结构关系
  private parent: QuadTree | null = null;  // 父节点
  private readonly indexMap: WeakMap<Shape, ShapeIndex>; // 形状 -> 节点索引映射（树内共享）

  // 状态标志
  private isSplit = false;          // 是否已分裂
  private disableSplit = false;     // 是否禁用分裂（达到深度/尺寸限制）

  // 存储数据
  private children: Shape[] = [];           // 当前节点存储的形状
  private childrenNode: QuadTree[] = [];    // 四个子节点（未分裂时为空）

  // 节点边界（用于快速碰撞检测）
  private readonly bounds: Bounding;
  // 子节点边界数组（按象限顺序：左上、右上、左下、右下）
  private readonly boundsList: [Bounding, Bounding, Bounding, Bounding];

  constructor(options: Partial<QuadTreeOptions> = {}, indexMap?: WeakMap<Shape, ShapeIndex>) {
    // 初始化节点参数
    this.x = options.point?.x ?? 0;
    this.y = options.point?.y ?? 0;
    this.minSize = options.minSize ?? 10;
    this.maxDepth = options.maxDepth ?? 10;
    this.splitChildren = options.splitChildren ?? 50;
    this.width = Math.round(options.size?.width ?? 0);
    this.height = Math.round(options.size?.height ?? 0);

    // 计算中心点（用于分裂）
    this.centerX = Math.floor(this.width / 2);
    this.centerY = Math.floor(this.height / 2);

    // 验证最小尺寸（防止无效分割）
    if (this.width < this.minSize || this.height < this.minSize) {
      const msg = `四叉树尺寸不能小于 minSize(${this.minSize})`;
      EngineLogger.error(msg);
      throw new Error(msg);
    }

    // 共享索引映射（仅根节点创建，子节点复用）
    this.indexMap = indexMap ?? new WeakMap<Shape, ShapeIndex>();

    // 计算当前节点边界
    this.bounds = {
      top: this.y,
      left: this.x,
      width: this.width,
      height: this.height,
      right: this.x + this.width,
      bottom: this.y + this.height,
    };

    // 计算四个子节点的边界（象限划分）
    this.boundsList = [
      // 左上象限
      { width: this.centerX, height: this.centerY, left: this.x, right: this.x + this.centerX, top: this.y, bottom: this.y + this.centerY },
      // 右上象限
      { width: this.width - this.centerX, height: this.centerY, left: this.x + this.centerX, right: this.x + this.width, top: this.y, bottom: this.y + this.centerY },
      // 左下象限
      { width: this.centerX, height: this.height - this.centerY, left: this.x, right: this.x + this.centerX, top: this.y + this.centerY, bottom: this.y + this.height },
      // 右下象限
      { width: this.width - this.centerX, height: this.height - this.centerY, left: this.x + this.centerX, right: this.x + this.width, top: this.y + this.centerY, bottom: this.y + this.height },
    ];
  }

  /** 创建子节点（私有构造函数逻辑） */
  private createChild(bounds: Bounding, depth: number): QuadTree {
    const child = new QuadTree({
      point: { x: bounds.left, y: bounds.top },
      size: { width: bounds.width, height: bounds.height },
      minSize: this.minSize,
      maxDepth: depth,
      splitChildren: this.splitChildren,
    }, this.indexMap);
    child.parent = this;
    return child;
  }

  /**
   * 确定形状所属的子节点象限
   * @param shape - 目标形状
   * @returns 象限索引（0-3）或 -1（不属于任何子节点，跨越象限边界）
   */
  private getIndex(shape: Shape): -1 | 0 | 1 | 2 | 3 {
    const { top, left, right, bottom } = shape.bounds;
    const bl = this.boundsList;
    for (let i = 0; i < 4; i += 1) {
      const b = bl[i];
      if (left >= b.left && top >= b.top && right <= b.right && bottom <= b.bottom) {
        return i as 0 | 1 | 2 | 3;
      }
    }
    return -1;
  }

  /**
   * 将形状添加到当前节点，并记录索引信息
   */
  private insertPush(shape: Shape): void {
    this.indexMap.set(shape, { node: this, index: this.children.length });
    this.children.push(shape);
  }

  /**
   * 尝试分裂当前节点
   */
  private split(): void {
    if (this.isSplit || this.disableSplit) return;

    this.isSplit = true;
    const childDepth = Math.max(this.maxDepth - 1, 0);

    for (const bounds of this.boundsList) {
      this.childrenNode.push(this.createChild(bounds, childDepth));
    }

    // 将当前节点中的形状重新插入到子节点
    const shapes = this.children.splice(0);
    for (const shape of shapes) {
      this.insert(shape);
    }
  }

  /**
   * 尝试合并子节点（当形状总数低于阈值时）
   */
  private tryMerge(): void {
    if (!this.isSplit) return;

    const totalShapes = this.getAllShapes().length;
    // 低于阈值的 1/4 时合并，形成滞后避免频繁分裂/合并
    if (totalShapes < Math.ceil(this.splitChildren / 4)) {
      // 收集所有后代形状
      const shapes = this.getAllShapes();
      this.childrenNode = [];
      this.isSplit = false;

      // 重新挂载到当前节点
      this.children = [];
      for (const shape of shapes) {
        this.insertPush(shape);
      }

      // 递归向上合并
      this.parent?.tryMerge();
    }
  }

  /**
   * 获取当前节点的序列化状态（主要用于调试和可视化）
   */
  getState(): QuadTreeState {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      bounds: { ...this.bounds },
      children: this.children.map((item) => item.getState?.() ?? {}),
      childrenNode: this.childrenNode.map((item) => item.getState()),
    };
  }

  /**
   * 插入形状到四叉树
   * @param shape - 目标形状
   */
  public insert(shape: Shape): void {
    // 若已分裂且形状完全属于某个子节点，递归插入
    if (this.isSplit) {
      const index = this.getIndex(shape);
      if (index >= 0) {
        this.childrenNode[index].insert(shape);
        return;
      }
    }

    // 否则存储在当前节点
    this.insertPush(shape);

    // 未分裂时检查是否需要分裂
    if (!this.isSplit && !this.disableSplit) {
      // 达到深度/尺寸限制则禁用分裂
      this.disableSplit = this.maxDepth <= 0 || this.centerX <= this.minSize || this.centerY <= this.minSize;
      if (!this.disableSplit && this.children.length >= this.splitChildren) {
        this.split();
      }
    }
  }

  /**
   * 从树中移除形状
   * @param shape - 目标形状
   */
  public remove(shape: Shape): void {
    const record = this.indexMap.get(shape);
    if (!record) return;

    const { node, index } = record;

    // 验证索引有效性（防止重复移除）
    if (index < 0 || index >= node.children.length || node.children[index] !== shape) return;

    node.children.splice(index, 1);
    this.indexMap.delete(shape);

    // 更新后续形状的索引
    for (let i = index; i < node.children.length; i += 1) {
      const s = node.children[i];
      const rec = this.indexMap.get(s);
      if (rec) rec.index = i;
    }

    // 检查是否需要合并子节点
    node.tryMerge();
  }

  /**
   * 更新形状在树中的位置
   * 先移除再重新插入
   * @param shape - 目标形状
   */
  public update(shape: Shape): void {
    const record = this.indexMap.get(shape);
    if (record) {
      this.remove(shape);
      this.insert(shape);
    }
  }

  /**
   * 获取当前节点直接存储的形状
   */
  public getNodeShapes(): Shape[] {
    return [...this.children];
  }

  /**
   * 获取当前节点及其所有后代节点的形状（深度优先遍历）
   */
  public getAllShapes(): Shape[] {
    const shapes: Shape[] = [...this.children];
    if (this.isSplit) {
      for (const node of this.childrenNode) {
        shapes.push(...node.getAllShapes());
      }
    }
    return shapes;
  }

  /**
   * 检索可能与给定形状发生碰撞的候选形状
   * @param shape - 目标形状
   * @param out - 可选的结果数组（复用可减少分配，调用方需保证初始为空）
   * @returns 候选形状数组
   */
  public retrieve(shape: Shape, out: Shape[] = []): Shape[] {
    if (this.isSplit) {
      const index = this.getIndex(shape);
      if (index >= 0) {
        this.childrenNode[index].retrieve(shape, out);
      } else {
        // 跨越象限边界：收集所有子节点
        for (const node of this.childrenNode) {
          node.retrieve(shape, out);
        }
      }
    }

    // 加入当前节点存储的形状
    for (let i = 0; i < this.children.length; i += 1) {
      out.push(this.children[i]);
    }
    return out;
  }

  /**
   * 查询与给定形状边界相交的所有形状（碰撞候选）
   * @param shape - 目标形状
   * @param out - 可选的结果数组（复用可减少分配）
   * @returns 边界相交的形状数组
   */
  public query(shape: Shape, out: Shape[] = []): Shape[] {
    out.length = 0;
    const bounds = shape.bounds;
    this.retrieve(shape, out);

    let w = 0;
    for (let i = 0; i < out.length; i += 1) {
      const other = out[i];
      if (other === shape) continue;
      const b = other.bounds;
      if (bounds.right < b.left || bounds.left > b.right || bounds.bottom < b.top || bounds.top > b.bottom) continue;
      out[w++] = other;
    }
    out.length = w;
    return out;
  }

  /**
   * 检测与给定形状实际发生碰撞的形状
   * @param shape - 目标形状
   * @returns 碰撞形状数组（通过 shape.collision 判定）
   */
  public collide(shape: Shape): Shape[] {
    return this.query(shape).filter((other) => shape.collision(other));
  }

  /**
   * 清空整个四叉树
   */
  public clear(): void {
    if (this.isSplit) {
      // 递归清空子节点
      this.childrenNode.forEach((node) => node.clear());
      this.childrenNode = [];
      this.isSplit = false;
    }

    // 清除形状的索引记录
    for (const shape of this.children) {
      this.indexMap.delete(shape);
    }
    this.children = [];
  }
}
