import { bitmapCollide, getPixel } from '../lib/collides';
import { Listener } from '../lib/Listener';
import { throttle } from '../utils/limit';
import { Watch } from '../lib/Decorators';
import { Quadtree } from './Quadtree';
import { Style } from '../lib/Style';

export class Point {
  public x: number;
  public y: number;
  public parent?: Shape;
  public index: number = -1;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  // TODO: 移除当前点
  remove(): void {
    this.parent && this.parent.removeChild(this.index);
  }
}

export type ShapeListener = { graphics: Shape, value?: number }

export abstract class Shape {
  @Watch<number>(function (value) {
    this['listener']?.publish('top', { graphics: this, value });
  }) public top: number = 0;
  @Watch<number>(function (value) {
    this['listener']?.publish('left', { graphics: this, value });
  }) public left: number = 0;
  private _bitmap?: ImageData = undefined;
  protected _children: (Shape | Point)[] = [];
  private listener: Listener<ShapeListener> = new Listener();
  protected graphs: HTMLCanvasElement = document.createElement('canvas');
  //
  public index: number = -1;
  public visible: boolean = true;
  public selected: boolean = true;
  public dragging: boolean = false;
  public readonly style: Style = new Style();
  public parent?: Shape | Quadtree = undefined;
  public click?: (event: MouseEvent) => boolean;
  public dblclick?: (event: MouseEvent) => boolean;
  public readonly update: (status?: boolean) => void;
  public contextmenu?: (event: MouseEvent) => boolean;

  // TODO: 监听
  public on(key: 'top' | 'left' | 'update', listener: (value: any) => void) {
    this.listener.subscribe(key, listener);
  }

  // TODO: 取消监听
  public off(key: 'top' | 'left' | 'update', listener: (value: any) => void) {
    this.listener.unsubscribe(key, listener);
  }

  // TODO: 大小
  get size() {
    let width = 0;
    let height = 0;
    for (const child of this.children as Point[]) {
      width = Math.max(width, child.x);
      height = Math.max(height, child.y);
    }
    return { width, height };
  }

  // TODO: 图形边界
  get bounding() {
    const { top, left, size: { width, height } } = this;
    return { top, left, width, height, right: left + width, bottom: top + height };
  }

  // TODO: 位图
  get bitmap() {
    return this._bitmap;
  }

  // TODO: 子项
  get children(): (Shape | Point)[] {
    return this._children;
  }

  protected constructor(timeout = 10) {
    this.update = throttle(this.handleBitmap.bind(this), timeout);
  }

  // TODO: 图形绘画，由子类实现
  abstract draw(content: CanvasRenderingContext2D): void

  // TODO: 绘画最新的图像并处理成位图
  private handleBitmap() {
    const { width, height } = this.size;
    this.graphs.width = width;
    this.graphs.height = height;
    const content = this.graphs.getContext('2d');
    content.clearRect(0, 0, width, height);
    //
    this.draw(content);
    try {
      this._bitmap = content.getImageData(0, 0, width, height);
    } catch (e) {
      console.warn('无法获取位图');
    }
    this.listener.publish('update', { graphics: this });
  }

  // TODO: 更新子图形的索引
  protected updateChildrenIndexes(index: number) {
    for (let i = index; i < this._children.length; i++) {
      this._children[i].index = i;
    }
  }

  // TODO: 根据索引添加子项
  public addChild(shape: Shape | Point, index?: number) {
    shape.parent = this;
    index = index ?? this.children.length;
    this.children.splice(index, 0, shape);
    this.updateChildrenIndexes(index);
    this.update();
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
    this.parent && this.parent.removeChild?.(this.index);
  }

  // TODO: 判断当前点是否在图形内
  public isPointInShape(x: number, y: number): Shape | undefined {
    const { top, left, right, bottom } = this.bounding;
    if (x < left || y < top || x > right || y > bottom) return undefined;
    if (this.bitmap) {
      const pixel = getPixel(this.bitmap, x - left, y - top);
      if (pixel.length === 4) {
        if (pixel[3] !== 0) return this;
      }
    }
    return undefined;
  }

  // TODO: 图形碰撞检测
  public crashDetection(shape: Shape) {
    return bitmapCollide(this, shape);
  }

  // TODO: 开始绘画
  public startDraw(context: CanvasRenderingContext2D) {
    context.save();
    context.translate(this.left, this.top);
    context.drawImage(this.graphs, 0, 0);
    context.restore();
  }
}

export abstract class ShapeItem extends Shape {
  get children() {
    return this._children as Point[];
  }

  public addChild(child: Point, index?: number) {
    super.addChild(child, index);
  }
}

export class ShapeGroup extends Shape {
  public through: boolean = true;

  constructor(through = true) {
    super();
    this.through = through;
  }

  get children() {
    return this._children as Shape[];
  }

  get size() {
    let [width, height] = [0, 0];
    for (const child of this.children) {
      width = Math.max(child.bounding.right, width);
      height = Math.max(child.bounding.bottom, height);
    }
    return { width, height };
  }

  public addChild(shape: Shape, index?: number) {
    super.addChild(shape, index);
    shape.on('top', this.update);
    shape.on('left', this.update);
    shape.on('update', this.update);
  }

  public isPointInShape(x: number, y: number): Shape | undefined {
    if (!this.through) return super.isPointInShape(x, y);
    ;[x, y] = [x - this.left, y - this.top];
    for (let i = this.children.length - 1; i >= 0; i--) {
      const child = this.children[i];
      if (child.visible) {
        const shape = child.isPointInShape(x, y);
        if (shape) return shape;
      }
    }
    return undefined;
  }

  public draw(ctx: CanvasRenderingContext2D) {
    ctx.translate(this.left, this.top);
    for (const child of this.children) {
      if (child.visible) child.startDraw(ctx);
    }
  }
}
