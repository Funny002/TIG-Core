import { Style } from './Style';

export class Point {
  public x: number;
  public y: number;
  public parent?: Paths;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  get index(): number {
    return this.parent?.points.indexOf(this) ?? -1;
  }

  remove() {
    if (this.parent && this.index > -1) {
      this.parent.points.splice(this.index, 1);
    }
  }
}

export abstract class Paths {
  public top = 0;
  public left = 0;
  public parent?: PathsGroup;
  protected __points: Point[] = [];
  public visible: boolean = true; // 是否可见
  public dragged: boolean = false; // 拖拽
  public selected: boolean = false; // 是否选中
  public readonly: boolean = false; // 是否只读
  public style: Style = new Style(); // 样式

  get index() {
    return this.parent?.children.indexOf(this) ?? -1;
  }

  get points() {
    return this.__points;
  }

  get width() {
    let min = Infinity, max = -Infinity;
    for (const point of this.points) {
      Math.min(min, point.x);
      Math.max(max, point.x);
    }
    return max - min;
  }

  get height() {
    let min = Infinity, max = -Infinity;
    for (const point of this.points) {
      Math.min(min, point.y);
      Math.max(max, point.y);
    }
    return max - min;
  }

  addPoint(x: number, y: number) {
    const point = new Point(x, y);
    this.points.push(point);
    point.parent = this;
  }

  remove() {
    if (this.parent && this.index > -1) {
      this.parent.children.splice(this.index, 1);
    }
  }

  removeAll() {
    for (const point of this.points) {
      point.parent = undefined;
    }
    this.__points = [];
  }

  public abstract draw(context: CanvasRenderingContext2D): void;
}

export class PathsGroup extends Paths {
  protected __children: Paths[] = [];

  get children() {
    return this.__children;
  }

  get width() {
    let min = Infinity, max = -Infinity;
    for (const child of this.children) {
      Math.min(min, child.width);
      Math.max(max, child.width);
    }
    return max - min;
  }

  get height() {
    let min = Infinity, max = -Infinity;
    for (const child of this.children) {
      Math.min(min, child.height);
      Math.max(max, child.height);
    }
    return max - min;
  }

  addPaths(paths: Paths) {
    this.__children.push(paths);
    paths.parent = this;
  }

  removeAll() {
    for (const children of this.children) {
      children.parent = undefined;
    }
    this.__children = [];
  }

  draw(context: CanvasRenderingContext2D) {
    for (const child of this.children) {
      child.draw(context);
    }
  }
}
