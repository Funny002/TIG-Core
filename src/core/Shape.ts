import { bitmapCollide, getPixel, Listener, Watch } from '../lib';
import { Quadtree } from './Quadtree';

export class Point {
  public x: number;
  public y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

export type ShapeListener = { graphics: Shape, value?: number }

export type ShapeKeys = 'click' | 'contextmenu' | 'dblclick' | 'mousemove' | 'mousedown' | 'mouseup';

export abstract class Shape {
  // TODO: 位图
  private _bitmap?: ImageData = undefined;
  get bitmap() {
    return this._bitmap;
  }

  // TODO: 子项
  protected _children: (Shape | Point)[] = [];
  get children(): (Shape | Point)[] {
    return this._children;
  }

  // TODO: 位置 - X
  @Watch<number>(function (value) {
    this['listener']?.publish('left', { graphics: this, value });
  }) public left: number = 0;

  // TODO: 位置 - Y
  @Watch<number>(function (value) {
    this['listener']?.publish('top', { graphics: this, value });
  }) public top: number = 0;

  // TODO: 监听器
  private listener: Listener<ShapeListener | MouseEvent> = new Listener();

  // TODO: 图形
  protected graphs: HTMLCanvasElement = document.createElement('canvas');
  protected context: CanvasRenderingContext2D = this.graphs.getContext('2d');

  constructor() {
    Object.defineProperty(this, '_bitmap', { enumerable: false });
    Object.defineProperty(this, 'listener', { enumerable: false });
    Object.defineProperty(this, '_children', { enumerable: false });
  }

  // TODO: 索引
  public index: number = -1;
  // TODO: 可见
  public visible: boolean = true;
  // TODO: 可选
  public selected: boolean = true;
  // TODO: 父级
  public parent?: Shape | Quadtree = undefined;

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

  // TODO: 图形绘画，由子类实现
  abstract draw(content: CanvasRenderingContext2D): void

  // TODO: 绘画最新的图像并处理成位图
  public update() {
    const { width, height } = this.size;
    this.graphs.width = width;
    this.graphs.height = height;
    this.context = this.graphs.getContext('2d', { willReadFrequently: true });
    this.context.clearRect(0, 0, width, height);
    this.draw(this.context);
    try {
      this._bitmap = this.context.getImageData(0, 0, width, height);
    } catch (e) {
      this._bitmap = undefined;
    }
    this.listener.publish('update', { graphics: this });
  }

  // TODO: 通知
  public publish(key: ShapeKeys, event: MouseEvent) {
    this.listener.publish(key, event);
  }

  // TODO: 监听
  public on(key: 'top' | 'left' | 'update' | ShapeKeys, listener: (value: any) => void) {
    this.listener.subscribe(key, listener);
  }

  // TODO: 取消监听
  public off(key: 'top' | 'left' | 'update' | ShapeKeys, listener: (value: any) => void) {
    this.listener.unsubscribe(key, listener);
  }

  // TODO: 根据索引添加子项
  public addChild(shape: Shape | Point, index?: number) {
    index = index ?? this.children.length;
    this.children.splice(index, 0, shape);
    this.update();
  }

  // TODO: 移除子图形
  public removeChild(index: number): (Shape | Point) | undefined {
    if (index >= 0 && index < this._children.length) {
      return this.children.splice(index, 1)[0];
    }
    return undefined;
  }

  // TODO: 移除删除
  public remove() {
    this.graphs.remove();
    this.parent?.removeChild(this.index);
  }

  // TODO: 判断当前点是否在图形内
  public isPointInShape(x: number, y: number): Shape | undefined {
    if (!this.selected) return undefined;
    const { top, left, right, bottom } = this.bounding;
    if (x < left || x > right || y < top || y > bottom) return undefined;
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

  private updateChildrenIndexes(index: number) {
    const count = this.children.length;
    for (let i = index; i < count; i++) {
      this.children[i].index = i;
    }
  }

  public addChild(shape: Shape, index?: number) {
    index = index ?? this.children.length;
    shape.parent = this;
    super.addChild(shape, index);
    this.updateChildrenIndexes(index);
    shape.on('top', this.update);
    shape.on('left', this.update);
    shape.on('update', this.update);
  }

  public removeChild(index: number): Shape | undefined {
    const child = super.removeChild(index) as Shape | undefined;
    if (child) {
      child.index = -1;
      child.parent = undefined;
    }
    return child;
  }

  public isPointInShape(x: number, y: number): Shape | undefined {
    if (!this.selected) return undefined;
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
