import { bitmapCollide, getPixel } from '../lib/collides';
import { Listener } from '../lib/Listener';
import { throttle } from '../utils/limit';
import { Style } from '../lib/Style';

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

  // TODO: 移除当前点
  remove(): void {
    this.parent && this.parent.removeChild(this.index);
  }
}

export type ShapeListener = { graphics?: Shape, value: number }

export abstract class Shape {
  private _top: number = 0;
  private _left: number = 0;
  private _bitmap?: ImageData = undefined;
  protected _children: (Shape | Point)[] = [];
  private listener: Listener<ShapeListener> = new Listener();
  protected graphs: HTMLCanvasElement = document.createElement('canvas');
  //
  public index: number = -1;
  public visible: boolean = true;
  public selected: boolean = true;
  public parent?: Shape = undefined;
  public readonly style: Style = new Style();
  public click?: (event: MouseEvent) => boolean;
  public dblclick?: (event: MouseEvent) => boolean;
  public readonly update: (status?: boolean) => void;
  public contextmenu?: (event: MouseEvent) => boolean;

  get top() {
    return this._top;
  }

  get left() {
    return this._left;
  }

  set top(value: number) {
    this._top = value;
    this.listener.publish('top', { graphics: this, value });
  }

  set left(value: number) {
    this._left = value;
    this.listener.publish('left', { graphics: this, value });
  }

  public on(key: 'top' | 'left', listener: (value: any) => void) {
    this.listener.subscribe(key, listener);
  }

  public off(key: 'top' | 'left', listener: (value: any) => void) {
    this.listener.unsubscribe(key, listener);
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

  get bounding() {
    const { top, left, size: { width, height } } = this;
    return { top, left, width, height, right: left + width, bottom: top + height };
  }

  get bitmap() {
    return this._bitmap;
  }

  get children(): (Shape | Point)[] {
    return this._children;
  }

  protected constructor() {
    this.update = throttle(this.handleBitmap.bind(this), 10);
  }

  // TODO: 图形绘画，由子类实现
  abstract draw(content: CanvasRenderingContext2D): void

  // TODO: 绘画最新的图像并，处理成位图
  private handleBitmap() {
    const { width, height } = this.size;
    this.graphs.width = width;
    this.graphs.height = height;
    const content = this.graphs.getContext('2d');
    content.clearRect(0, 0, width, height);
    //
    this.draw(content);
    this.style.draw(content);
    this._bitmap = content.getImageData(0, 0, width, height);
  }

  // TODO: 添加子形状或者点 - 向后添加
  public push(shape: Shape | Point): void {
    shape.index = this.children.length;
    this.children.push(shape);
    shape.parent = this;
    this.update();
  }

  // TODO: 添加子形状或者点 - 向前添加
  public unshift(shape: Shape | Point): void {
    shape.parent = this;
    this.children.unshift(shape);
    this.updateChildrenIndexes(0);
    this.update();
  }

  // TODO: 销毁当前图形，状态为 true 则递归销毁子图形
  public destroy(status = false) {
    this.graphs.remove();
    for (const child of this.children) {
      if (status && !(child instanceof Point)) child.destroy(status);
      child.parent = undefined;
      child.index = -1;
    }
    this._children = [];
  }

  // TODO: 移除当前图形
  public remove() {
    this.destroy();
    this.parent && this.parent.removeChild(this.index);
  }

  // TODO: 移除子图形
  public removeChild(index: number): (Shape | Point) | undefined {
    if (index >= 0 && index < this._children.length) {
      const child = this._children.splice(index, 1)[0];
      if (!(child instanceof Point)) child.destroy();
      this.updateChildrenIndexes(index);
      child.parent = undefined;
      this.update();
      return child;
    }
    return undefined;
  }

  // TODO: 更新子图形的索引
  public updateChildrenIndexes(index: number) {
    for (let i = index; i < this._children.length; i++) {
      this._children[i].index = i;
    }
  }

  // TODO: 判断当前点是否在图形内
  public isPointInShape(x: number, y: number): Shape | undefined {
    const { top, left, right, bottom } = this.bounding;
    if (x < left && x > right && y < top && y > bottom) return undefined;
    return (this.bitmap && getPixel(this.bitmap, x - left, y - top)[3] !== 0) ? this : undefined;
  }

  // TODO: 图形碰撞检测
  public crashDetection(shape: Shape) {
    return bitmapCollide(this, shape);
  }

  // TODO: 开始绘画
  public startDraw(context: CanvasRenderingContext2D) {
    context.save();
    context.drawImage(this.graphs, this.left, this.top);
    context.restore();
  }
}

export abstract class ShapeItem extends Shape {
  get children() {
    return this._children as Point[];
  }

  push(shape: Point) {
    super.push(shape);
  }

  unshift(shape: Point) {
    super.unshift(shape);
  }
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

  get children() {
    return this._children as Shape[];
  }

  push(shape: Shape) {
    super.push(shape);
  }

  unshift(shape: Shape) {
    super.unshift(shape);
  }

  isPointInShape(x: number, y: number): Shape | undefined {
    const { top, left, right, bottom } = this.bounding;
    if (x < left && x > right && y < top && y > bottom) return undefined;
    ;[x, y] = [x - left, y - top];
    for (const child of this.children) {
      if (child.visible) {
        const shape = child.isPointInShape(x, y);
        if (shape) return shape;
      }
    }
    return undefined;
  }
  
  draw(ctx: CanvasRenderingContext2D) {
    ctx.translate(this.left, this.top);
    for (const child of (this.children)) {
      if (child.visible) child.startDraw(ctx);
    }
  }
}
