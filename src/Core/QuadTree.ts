import type { Bounding, Point, Shape, Size } from './Shape';
import { EngineLogger } from '../Logger';

// 四叉树配置选项接口
export interface QuadTreeOptions {
  size: Size;          // 四叉树区域尺寸
  point: Point;        // 四叉树起始坐标
  minSize: number;     // 最小节点尺寸（防止无限分割）
  maxDepth: number;    // 最大递归深度
  mergeTimer: number;  // 合并子节点的延迟时间（毫秒）
  splitChildren: number; // 触发节点分裂的子元素数量阈值
}

// 四叉树状态接口（用于序列化）
export interface QuadTreeState {
  x: number;
  y: number;
  width: number;
  height: number;
  bounds: Bounding;          // 节点边界
  childrenNode: QuadTreeState[]; // 子节点状态
  children: Record<string, any>[]; // 存储的形状数据（通常仅用于调试）
}

// 常量定义
export const QuadTreeName = 'quadTree';       // 形状绑定的四叉树实例属性名
export const QuadTreeIndex = 'quadTreeIndex'; // 形状在节点中的索引属性名

/**
 * 四叉树实现类
 * 用于空间划分，高效管理二维空间中的形状（碰撞检测、查询等）
 * 特性：
 * - 动态分裂：当节点内形状数量超过阈值时分裂为四个子节点
 * - 自动合并：当子节点形状数量减少时，延迟合并回父节点
 * - 深度控制：通过最大深度防止过度递归
 */
export class QuadTree {
  // 基础属性
  private readonly x: number;          // 节点左上角x坐标
  private readonly y: number;          // 节点左上角y坐标
  private readonly width: number;      // 节点宽度
  private readonly height: number;     // 节点高度
  private readonly minSize: number;    // 最小尺寸限制（避免无限分割）

  // 中心点坐标（用于分裂时创建子节点）
  private readonly centerX: number;
  private readonly centerY: number;

  // 配置参数
  private readonly splitChildren: number = 50; // 分裂阈值（默认50个形状）
  protected maxDepth: number = 10;             // 最大递归深度（默认10）
  protected mergeTimer: number = 300;          // 合并延迟（默认300ms）

  // 状态标志
  protected isSplit: boolean = false;         // 是否已分裂
  private disableSplit: boolean = false;      // 是否禁用分裂（达到深度/尺寸限制）
  private mergeTimerId: number | undefined;   // 合并定时器ID

  // 树结构关系
  protected root: QuadTree | undefined;       // 根节点（仅根节点有效）
  protected parent: QuadTree | undefined;     // 父节点

  // 存储数据
  protected children: Shape[] = [];           // 当前节点存储的形状
  protected childrenNode: QuadTree[] = [];    // 四个子节点（未分裂时为空）

  // 节点边界（用于快速碰撞检测）
  private readonly bounds: Bounding;
  // 子节点边界数组（按象限顺序：左上、右上、左下、右下）
  private readonly boundsList: [Bounding, Bounding, Bounding, Bounding];

  constructor(options: Partial<QuadTreeOptions> = {}) {
    // 初始化节点参数
    this.x = options.point?.x || 0;
    this.y = options.point?.y || 0;
    this.minSize = options.minSize || 10;
    this.maxDepth = options.maxDepth || 10;
    this.mergeTimer = options.mergeTimer || 300;
    this.splitChildren = options.splitChildren || 50;
    this.width = Math.round(options.size?.width || 0);
    this.height = Math.round(options.size?.height || 0);

    // 计算中心点（用于分裂）
    this.centerX = Math.floor(this.width / 2);
    this.centerY = Math.floor(this.height / 2);

    // 验证最小尺寸（防止无效分割）
    const msg = `最小尺寸不能小于${this.minSize}`;
    if (this.width < this.minSize || this.height < this.minSize) {
      EngineLogger.error(msg);
      throw new Error(msg);
    }

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

  /**
   * 确定形状所属的子节点象限
   * @param shape - 目标形状
   * @returns 象限索引（0-3）或-1（不属于任何子节点）
   */
  protected getIndex(shape: Shape): -1 | 0 | 1 | 2 | 3 {
    const { top, left, right, bottom } = shape.bounds;

    // 检查形状是否完全包含在指定边界内
    function isBounds(bounds: Bounding): boolean {
      return left >= bounds.left && top >= bounds.top && right <= bounds.right && bottom <= bounds.bottom;
    }

    // 遍历四个象限边界，寻找匹配的子节点
    for (const [key, value] of Object.entries(this.boundsList)) {
      if (isBounds(value)) return Number(key) as 0 | 1 | 2 | 3;
    }

    return -1; // 形状跨越多个象限或超出范围
  }

  /**
   * 检查形状是否存在越界行为
   * 注意：此方法仅在父节点插入时使用（处理越界形状）
   */
  private isOutRange(shape: Shape) {
    const { top, left, right, bottom } = shape.bounds;
    return left > this.bounds.left && right > this.bounds.right && top > this.bounds.top && bottom > this.bounds.bottom;
  }

  /**
   * 将形状添加到当前节点
   * 并在形状上记录节点信息（用于快速查找）
   */
  private insertPush(shape: Shape): void {
    if (!shape.node) shape.node = {};
    shape.node[QuadTreeIndex] = this.children.length;
    shape.node[QuadTreeName] = this;
    this.children.push(shape);
  }

  /**
   * 取消待处理的合并操作
   */
  private cancelMerge() {
    if (this.mergeTimerId) {
      clearTimeout(this.mergeTimerId);
      this.mergeTimerId = undefined;
    }
  }

  /**
   * 检查是否需要合并子节点（延迟执行）
   * 当前节点分裂后，如果子节点形状总数低于阈值，则触发合并
   */
  private checkMerge() {
    if (!this.isSplit) return;
    this.cancelMerge();

    // 延迟执行合并检查
    this.mergeTimerId = setTimeout(() => {
      if (!this.isSplit) return;

      // 收集所有子节点中的形状
      const shapes = this.getAllShapes();

      // 取消所有子节点的合并计时（避免重复）
      this.childrenNode.forEach(node => node.cancelMerge());

      // 如果总形状数低于阈值（分裂阈值的1/3），则合并子节点
      if (shapes.length < Math.round(this.splitChildren / 3)) {
        this.children = shapes;
        // 更新形状的节点引用
        for (let i = 0, leng = shapes.length; i < leng; i += 1) {
          shapes[i].node[QuadTreeName] = this;
          shapes[i].node[QuadTreeIndex] = i;
        }
        // 重置子节点
        this.childrenNode = [];
        this.isSplit = false;
      }

      // 尝试合并父节点
      this.parent?.checkMerge();
    }, this.mergeTimer);
  }

  /**
   * 获取当前节点的序列化状态
   * 主要用于调试和可视化
   */
  getState(): QuadTreeState {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      bounds: this.bounds,
      children: this.children.map(item => item.getState?.() || {}), // 要求形状实现getState
      childrenNode: this.childrenNode.map(item => item.getState()),
    };
  }

  /**
   * 插入形状到四叉树
   * 自动处理越界、分裂和合并
   */
  public insert(shape: Shape): void {
    // 如果形状超出当前节点范围且存在父节点，交给父节点处理
    if (this.parent && this.isOutRange(shape)) {
      this.parent.insert(shape);
    }
    // 若已分裂，尝试放入子节点
    else if (this.isSplit) {
      const index = this.getIndex(shape);
      if (index >= 0 && this.childrenNode[index]) {
        this.childrenNode[index].insert(shape);
      } else {
        // 无法放入子节点（跨越边界），存储在当前节点
        this.insertPush(shape);
      }
      this.checkMerge(); // 检查是否需要合并子节点
    }
    // 未分裂状态：检查是否需要分裂
    else {
      // 检查是否达到分裂条件（深度/尺寸限制）
      if (!this.disableSplit) {
        this.disableSplit = this.maxDepth <= 0 || this.centerX <= this.minSize || this.centerY <= this.minSize;
      }

      // 触发分裂：形状数量超过阈值且未达到限制
      if (!this.disableSplit && this.children.length >= this.splitChildren) {
        this.isSplit = true;
        const data = {
          parent: this,
          mergeTimer: this.mergeTimer,
          splitChildren: this.splitChildren,
          maxDepth: Math.max(this.maxDepth - 1, 0), // 深度减1
        };

        // 创建四个子节点（象限）
        for (const item of this.boundsList) {
          const quadTree = new QuadTree({
            ...data,
            point: { x: item.left, y: item.top },
            size: { width: item.width, height: item.height },
          });
          quadTree.root = this.root || this; // 传递根节点引用
          quadTree.parent = this;
          this.childrenNode.push(quadTree);
        }

        // 将当前节点中的形状重新插入到子节点
        for (const shape of this.children.splice(0)) {
          this.insert(shape);
        }
      }
      // 未达到分裂条件，直接存储
      else {
        this.insertPush(shape);
      }
    }
  }

  /**
   * 从树中移除形状
   * 更新索引并检查合并
   */
  public remove(shape: Shape) {
    const quadTree = shape.node && shape.node[QuadTreeName];
    if (!quadTree) return;

    const index = shape.node[QuadTreeIndex];
    // 验证索引有效性（防止重复移除）
    if (index === undefined || index < 0 || index >= quadTree.children.length || quadTree.children[index] !== shape) return;

    // 移除形状
    const spliceShape = quadTree.children.splice(index, 1)[0];
    delete spliceShape.node[QuadTreeName];
    delete spliceShape.node[QuadTreeIndex];

    // 更新后续形状的索引
    for (let i = index, leng = quadTree.children.length; i < leng; i += 1) {
      quadTree.children[i].node[QuadTreeIndex] = i;
    }

    // 检查是否需要合并子节点
    quadTree.checkMerge();
  }

  /**
   * 更新形状在树中的位置
   * 先移除再重新插入
   */
  public update(shape: Shape) {
    const quadTree: QuadTree | undefined = shape.node && shape.node[QuadTreeName];
    if (quadTree) {
      quadTree.remove(shape);
      quadTree.insert(shape); // 重新插入（可能进入不同节点）
    }
  }

  /**
   * 获取当前节点下的所有形状（包括子节点）
   * 注意：不包含子节点中的子节点（仅直接后代）
   */
  public getNodeShapes(): Shape[] {
    let shapes: Shape[] = [];
    if (this.isSplit) {
      for (const node of this.childrenNode) {
        // 递归获取子节点中的所有形状
        shapes.push(...node.getAllShapes());
      }
    }
    return shapes;
  }

  /**
   * 获取当前节点及其所有后代节点的形状
   * 深度优先遍历
   */
  public getAllShapes(): Shape[] {
    return [...this.children].concat(this.getNodeShapes());
  }

  /**
   * 清空整个四叉树
   * 取消合并计时器并重置所有状态
   */
  public clear() {
    this.cancelMerge();
    if (this.isSplit) {
      // 递归清空子节点
      this.childrenNode.forEach(node => node.clear());
      this.childrenNode = [];
      this.isSplit = false;
    }
    // 清除形状的节点引用
    for (const shape of this.children) {
      delete shape.node[QuadTreeName];
      delete shape.node[QuadTreeIndex];
    }
    this.children = [];
    this.parent?.checkMerge();
  }
}
