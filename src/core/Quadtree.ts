import { Shape } from './Shape';

// TODO: 四叉树
export class Quadtree {
  // TODO: 根节点
  protected root: Shape[] = [];

  // TODO: 是否分裂
  private divided: boolean = false;

  // TODO: 最大节点数
  private readonly maxNode: number;

  // TODO: 最大容量
  private readonly capacity: number;

  // TODO: 中心点
  private readonly vertical: number;

  // TODO: 中心点
  private readonly horizontal: number;

  // TODO: 父节点
  public parent?: Quadtree = undefined;

  // TODO: 销毁定时器
  private destroy?: NodeJS.Timeout = null;

  // TODO: 子节点
  protected children: Array<Quadtree> = [];

  // TODO: 包围盒
  private readonly bounding: { top: number; left: number; bottom: number; width: number; right: number; height: number };

  constructor(left: number, top: number, width: number, height: number, capacity = 3, maxNode = 10) {
    this.maxNode = maxNode;
    this.capacity = capacity;
    this.vertical = left + width / 2;
    this.horizontal = top + height / 2;
    this.bounding = { top, left, width, height, right: left + width, bottom: top + height };
  }

  // TODO: 获取元素所在的象限,  0，1，2，3
  protected getIndex(shape: Shape): -1 | 0 | 1 | 2 | 3 {
    const { vertical, horizontal } = this;
    if (shape.bounding.bottom < horizontal && shape.bounding.right < vertical) return 0;
    if (shape.bounding.left > vertical && shape.bounding.bottom < horizontal) return 1;
    if (shape.bounding.top > horizontal && shape.bounding.right < vertical) return 2;
    if (shape.bounding.top > horizontal && shape.bounding.left > vertical) return 3;
    return -1;
  }

  // TODO: 创建子节点
  private createChildren(index: 0 | 1 | 2 | 3) {
    if (!this.children[index]) {
      const width = this.bounding.width / 2;
      const height = this.bounding.height / 2;
      const left = this.bounding.left + (index % 2) * width;
      const top = this.bounding.top + Math.floor(index / 2) * height;
      this.children[index] = new Quadtree(left, top, width, height, this.maxNode - 1);
    }
    return this.children[index];
  }

  // TODO: 图形盒检测
  public hasScope(shape: Shape) {
    const { top, left, right, bottom } = shape.bounding;
    if (right < this.bounding.left) return false;
    if (left > this.bounding.right) return false;
    if (top > this.bounding.bottom) return false;
    if (bottom < this.bounding.top) return false;
    return true;
  }

  // TODO: 插入元素
  public insert(shape: Shape): void {
    if (!this.hasScope(shape)) return;
    if (this.destroy) {
      clearTimeout(this.destroy);
      this.destroy = null;
    }
    shape.parent = this;
    shape.index = this.root.length;
    if (!this.divided) {
      this.root.push(shape);
      if (this.root.length > this.capacity) {
        this.divided = true;
        const children = this.root.splice(0, this.root.length);
        for (const shape of children) {
          this.insert(shape);
        }
      }
    } else {
      const index = this.getIndex(shape);
      // TODO: 如果元素不在象限内，直接插入根节点, 或者象限已经达到最大值
      if (index === -1 || !this.maxNode) {
        this.root.push(shape);
      } else {
        this.createChildren(index).insert(shape);
      }
    }
  }

  // TODO: 更新子项索引
  private updateChildrenIndexes(index: number) {
    const count = this.root.length;
    for (let i = index; i < count; i++) {
      this.root[i].index = i;
    }
  }

  // TODO:  子项调用删除
  public removeChild(index: number) {
    const shape = this.root.splice(index, 1)[0];
    shape.parent = undefined;
    shape.index = -1;
    this.updateChildrenIndexes(index);
    // 没有子节点，分裂状态关闭
    if (this.children.filter(Boolean).length === 0) (this.divided = false);
    // 父节点没有元素，且没有子节点，申请销毁
    if (!this.root.length && this.divided) (this.destroy = setTimeout(() => this.parent?.removeQuadtreeChild(this), 500));
  }

  // TODO: 子项调用删除节点
  public removeQuadtreeChild(child: Quadtree) {
    const index = this.children.indexOf(child);
    delete this.children[index];
    // 没有子节点，分裂状态关闭
    if (this.children.filter(Boolean).length === 0) (this.divided = false);
    // 父节点没有元素，且没有子节点，申请销毁
    if (!this.root.length && this.divided) (this.destroy = setTimeout(() => this.parent?.removeQuadtreeChild(this), 500));
  };

  // TODO: 图形检测 - 获取全部匹配的图形
  public isPointInShape(x: number, y: number): Shape[] {
    const { top, left, right, bottom } = this.bounding;
    if (x < left || x > right || y < top || y > bottom) return [];
    const target: Shape[] = [];
    const { root, vertical, horizontal } = this;
    for (const shape of root) {
      if (shape.visible && shape.isPointInShape(x, y)) {
        target.push(shape);
      }
    }
    let index: number;
    if (x < vertical) {
      index = y < horizontal ? 0 : 2;
    } else {
      index = y < horizontal ? 1 : 3;
    }
    return target.concat(this.children[index] ? this.children[index].isPointInShape(x, y) : []);
  }

  // TODO: 图形检测 - 获取碰撞的图形
  public crashDetection(shape: Shape): Shape[] {
    if (!this.hasScope(shape)) return [];
    const target: Shape[] = [];
    for (const child of this.root) {
      if (child.crashDetection(shape)) {
        target.push(child);
      }
    }
    for (const tree of this.children.filter(Boolean)) {
      target.push(...tree.crashDetection(shape));
    }
    return target;
  }

  // TODO: 绘画
  public draw(content: CanvasRenderingContext2D) {
    this.root.forEach((shape) => shape.startDraw(content));
    this.children.filter(Boolean).forEach((tree) => tree.draw(content));
  }
}
