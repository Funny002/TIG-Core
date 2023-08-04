import { bitmapCollide, getPixel } from '../lib/collides';
import { BoundingBox } from './LooseOctree';
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

  remove(): void {
    this.parent && this.parent.removeChild(this.index);
  }
}

export abstract class Shape {
  public parent?: Shape;
  private __top: number = 0;
  private __left: number = 0;
  public index: number = -1;
  public visible: boolean = true;
  public selected: boolean = true;
  public dragging: boolean = false;
  public style: Style = new Style();
  public collision?: (shape: Shape) => void;
  public click?: (event: MouseEvent) => boolean;
  public dblclick?: (event: MouseEvent) => boolean;
  public contextmenu?: (event: MouseEvent) => boolean;
  //
  private __bitmap?: ImageData;
  private saveDraw: boolean = false;
  protected __children: (Shape | Point)[] = [];
  private readonly styleCanvas: HTMLCanvasElement;
  private readonly contentCanvas: HTMLCanvasElement;
  public readonly update: (status?: boolean) => void;
  private listener: Listener<{ graphics?: Shape, value: any }> = new Listener();

  get children(): (Shape | Point)[] {
    return this.__children;
  }

  get top() {
    return this.__top;
  }

  set top(value: number) {
    this.__top = value;
    this.listener.publish('top', { graphics: this, value });
  }

  get left() {
    return this.__left;
  }

  set left(value: number) {
    this.__left = value;
    this.listener.publish('left', { graphics: this, value });
  }

  get bitmap() {
    return this.__bitmap;
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

  getBoundingBox() {
    const { top, left, size: { width, height } } = this;
    return new BoundingBox(left, top, left + width, top + height);
  }

  constructor() {
    this.styleCanvas = document.createElement('canvas');
    this.contentCanvas = document.createElement('canvas');
    this.update = throttle(this.handleBitmap.bind(this), 10);
  }

  public on(key: 'top' | 'left' | 'size', listener: (value: any) => void) {
    this.listener.subscribe(key, listener);
  }

  public off(key: 'top' | 'left' | 'size', listener) {
    this.listener.unsubscribe(key, listener);
  }

  abstract draw(context: CanvasRenderingContext2D): void;

  private resetCanvas(key: 'style' | 'content') {
    const keyMap = { style: 'styleCanvas', content: 'contentCanvas' };
    const { width, height } = this.size;
    if (!keyMap[key]) throw new Error('Invalid key type');
    const keys = keyMap[key];
    this[keys].width = width;
    this[keys].height = height;
    this[keys].getContext('2d').clearRect(0, 0, width, height);
  }

  private handleBitmap(status = false) {
    if (this.saveDraw || status) {
      this.resetCanvas('content');
      const context = this.contentCanvas.getContext('2d');
      this.draw(context);
      this.saveDraw = false;
    }
    this.resetCanvas('style');
    const context = this.styleCanvas.getContext('2d');
    context.drawImage(this.contentCanvas, 0, 0);
    this.style.draw(context);
    this.__bitmap = context.getImageData(0, 0, this.size.width, this.size.height);
    this.listener.publish('left', { graphics: this, value: undefined });
  }

  private updateChildrenIndexes(index: number) {
    const long = this.children.length;
    for (let i = index; i < long; i++) {
      this.__children[i].index = index;
    }
  }

  public add(shape: (Shape | Point)) {
    shape.index = this.children.length;
    this.__children.push(shape);
    shape.parent = this;
    this.saveDraw = true;
    this.update();
  }

  public addShift(shape: (Shape | Point)) {
    shape.index = 0;
    shape.parent = this;
    this.__children.unshift(shape);
    this.updateChildrenIndexes(1);
    this.saveDraw = true;
    this.update();
  }

  public removeChild(index: number): (Shape | Point) | undefined {
    if (index >= 0 && index < this.__children.length) {
      const value = this.__children.splice(index, 1)[0];
      value.parent = undefined;
      this.updateChildrenIndexes(index);
      this.update();
      return value;
    }
    return undefined;
  }

  destroy() {
    this.styleCanvas.remove();
    this.contentCanvas.remove();
  }

  remove() {
    this.destroy();
    this.parent && this.parent.removeChild(this.index);
  }

  removeAll() {
    for (let i = this.children.length - 1; i >= 0; i--) {
      this.children[i].parent = undefined;
      this.children[i].index = -1;
    }
    this.__children = [];
    this.update();
  }

  public startDraw(context: CanvasRenderingContext2D) {
    context.save();
    context.drawImage(this.styleCanvas, this.left, this.top);
    context.restore();
  }

  public isPointInShape(x: number, y: number): Shape | undefined {
    [x, y] = [x - this.left, y - this.top]; // 坐标修正
    return (this.bitmap && getPixel(this.bitmap, x, y)[3] !== 0) ? this : undefined;
  }

  public crashDetection(shape: Shape) {
    return bitmapCollide(this, shape);
  }
}

export class ShapeGroup extends Shape {
  constructor() {
    super();
  }

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
    [x, y] = [x - this.left, y - this.top]; // 数值偏差
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

  draw(ctx: CanvasRenderingContext2D) {
    for (const child of (this.children as Shape[])) {
      if (child.visible) child.startDraw(ctx);
    }
  }
}
