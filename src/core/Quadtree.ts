import { Shape } from './Shape';

export class Quadtree {
  protected root: Shape[] = [];
  private divided: boolean = false;
  private readonly maxNode: number;
  private readonly capacity: number;
  private readonly vertical: number;
  private readonly horizontal: number;
  public parent?: Quadtree = undefined;
  private destroy?: NodeJS.Timeout = null;
  protected children: Array<Quadtree> = [];
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
    this.destroy = setTimeout(() => this.parent?.removeQuadtreeChild(this), 1000);
  }

  // TODO: 子项调用删除节点
  public removeQuadtreeChild(child: Quadtree) {
    const index = this.children.indexOf(child);
    delete this.children[index]; // 删除节点
    if (this.children.filter(Boolean).length === 0) (this.divided = false); // 如果没有子节点，就不是分裂状态
    if (this.root.length === 0) this.parent?.removeQuadtreeChild(this); // 如果没有子节点，就删除自己
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
    if (!this.hasScope(shape)) return;
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
