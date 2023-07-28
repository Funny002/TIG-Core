import { Style } from '@core/Style';

export class Point {
  public x: number;
  public y: number;
  public index: number;
  public parent?: Shape;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.index = -1;
  }

  remove(): void {
    this.parent && this.parent.removeChild(this.index);
  }
}

export abstract class Shape {
  public parent?: Shape;
  public top: number = 0;
  public left: number = 0;
  public index: number = -1;
  public visible: boolean = true;
  public dragging: boolean = false;
  public selected: boolean = false;
  public readonly: boolean = false;
  public style: Style = new Style();
  protected __children: (Shape | Point)[] = [];

  get children(): (Shape | Point)[] {
    return this.__children;
  }

  add(shape: (Shape | Point)) {
    shape.index = this.children.length;
    this.__children.push(shape);
    shape.parent = this;
  }

  removeChild(index: number): (Shape | Point) | undefined {
    if (index >= 0 && index < this.__children.length) {
      const value = this.__children.splice(index, 1)[0];
      value.parent = undefined;
      this.updateChildrenIndexes(index);
      return value;
    }
    return undefined;
  }

  updateChildrenIndexes(index: number) {
    const long = this.children.length;
    for (let i = index; i < long; i++) {
      this.__children[i].index = index;
    }
  }

  get size() {
    let width = 0;
    let height = 0;
    for (const child of this.children as Point[]) {
      width = Math.max(width, child.x);
      height = Math.max(height, child.y);
    }
    return { width, height };
  }

  // 有条件的可以去实现方法
  isPointInShape(x: number, y: number): Shape | undefined {
    return undefined;
  }

  abstract draw(context: CanvasRenderingContext2D): void;
}

export class ShapeGroup extends Shape {
  get size() {
    let width = 0;
    let height = 0;
    for (const child of this.children as Shape[]) {
      width += child.left + child.size.width;
      height += child.top + child.size.height;
    }
    return { width, height };
  }

  add(shape: Shape) {
    super.add(shape);
  }

  isPointInShape(x: number, y: number): Shape | undefined {
    const list = this.children as Shape[];
    for (let i = list.length - 1; i >= 0; i--) {
      const { visible, selected, isPointInShape } = list[i];
      if (visible && selected) {
        const shape = isPointInShape(x, y);
        if (shape) return shape;
      }
    }
    return undefined;
  }

  draw(context: CanvasRenderingContext2D) {
    for (const child of (this.children as Shape[])) {
      if (child.visible) child.draw(context);
    }
  }
}