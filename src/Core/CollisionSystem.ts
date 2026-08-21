import { QuadTree } from './QuadTree';
import type { QuadTreeOptions } from './QuadTree';
import type { Point, Shape, Size } from './Shape';

/**
 * 碰撞系统（空间索引）
 *
 * 封装四叉树空间索引与碰撞检测逻辑，与场景编排、渲染解耦。
 * 使用稳定 id 对碰撞对去重（每对仅报告一次），复用候选缓冲避免分配。
 */
export class CollisionSystem {
  private quadtree: QuadTree;
  private readonly config: Partial<QuadTreeOptions>;
  private readonly idMap: WeakMap<Shape, number> = new WeakMap();
  private readonly candidateBuffer: Shape[] = [];
  private idCounter = 0;

  constructor(config: Partial<QuadTreeOptions> = {}) {
    this.config = config;
    this.quadtree = new QuadTree(config);
  }

  /** 更新空间索引边界（画布尺寸变化时调用） */
  setBounds(size: Size, point: Point = { x: 0, y: 0 }): void {
    this.quadtree = new QuadTree({ ...this.config, size, point });
  }

  /** 依据图形集合重建空间索引 */
  rebuild(shapes: readonly Shape[]): void {
    this.quadtree.clear();
    for (const shape of shapes) this.quadtree.insert(shape);
  }

  /**
   * 检测图形集合中的碰撞（每对仅报告一次）
   * @returns 碰撞对数
   */
  detect(shapes: readonly Shape[], onCollide?: (a: Shape, b: Shape) => void): number {
    let collisions = 0;
    if (!onCollide) return 0;

    for (const shape of shapes) {
      const a = this.idOf(shape);
      const candidates = this.quadtree.query(shape, this.candidateBuffer);
      for (const other of candidates) {
        // 仅当对方 id 更小时报告，避免重复计数（无需额外去重集合）
        if (this.idOf(other) > a) continue;
        if (shape.collision(other) || other.collision(shape)) {
          collisions += 1;
          onCollide(shape, other);
        }
      }
    }

    return collisions;
  }

  /** 为形状分配稳定 id */
  private idOf(shape: Shape): number {
    let id = this.idMap.get(shape);
    if (id === undefined) {
      id = this.idCounter++;
      this.idMap.set(shape, id);
    }
    return id;
  }
}
