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
  private bounding: { top: number; left: number; bottom: number; width: number; right: number; height: number };

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

  // TODO: 插入元素
  public insert(shape: Shape): void {
    const { top, left, right, bottom } = shape.bounding;
    if (right > this.bounding.left || left > this.bounding.right || top > this.bounding.bottom || bottom > this.bounding.top) return;
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

  // TODO:  子项调用删除
  public removeChild(index: number) {
    const shape = this.root.splice(index, 1)[0];
    shape.parent = undefined;
    shape.index = -1;
    this.destroy = setTimeout(() => this.parent.removeQuadtreeChild(this));
  }

  // TODO: 子项调用删除节点
  public removeQuadtreeChild(child: Quadtree) {
    const index = this.children.indexOf(child);
    delete this.children[index]; // 删除节点
    this.children.filter(Boolean).length === 0 && (this.divided = false); // 如果没有子节点，就不是分裂状态
    this.root.length === 0 && this.parent && this.parent.removeQuadtreeChild(this); // 如果没有子节点，就删除自己
  };

  // TODO: 图形检测 - 获取全部匹配的图形
  public isPointInShape(x: number, y: number): Shape[] | undefined {
    const { top, left, right, bottom } = this.bounding;
    const target: Shape[] = [];
    if (x < left || x > right || y < bottom || y > top) return target;
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
}
