import { mergeObjects } from '../utils/object';
import { Point, ShapeItem } from '../core/Shape';

interface CircleOptions {
  startAngle: number;
  endAngle: number;
  radius: number;
  width: number;
}

interface EllipseOptions {
  startAngle: number;
  endAngle: number;
  rotation: number;
  width: number;
}

export class Line extends ShapeItem {
  private _width: number = 1;

  constructor(start: Point, width = 1) {
    super();
    this.push(start);
    this._width = width;
  }

  get width() {
    return this._width;
  }

  set width(value: number) {
    this._width = value;
    this.update();
  }

  draw(ctx: CanvasRenderingContext2D) {
    const points = [...this.children];
    if (points.length < 2) return;
    ctx.beginPath();
    ctx.lineWidth = this.width;
    const start = points.shift();
    ctx.moveTo(start.x, start.y);
    for (const point of points) {
      ctx.lineTo(point.x, point.y);
    }
    ctx.stroke();
  }
}

export class Rect extends ShapeItem {
  public _width: number;
  public _height: number;

  get width() {
    return this._width;
  }

  get height() {
    return this._height;
  }

  set width(value: number) {
    this._width = value;
    this.update();
  }

  set height(value: number) {
    this._height = value;
    this.update();
  }

  constructor(start: Point, width: number, height: number) {
    super();
    this._height = height;
    this._width = width;
    super.push(start);
  }

  get size() {
    return { width: this.width, height: this.height };
  }

  push(point: Point) {
    this.removeChild(0);
    super.push(point);
  }

  unshift(shape: Point) {
    super.unshift(shape);
    this.removeChild(1);
  }

  draw(ctx: CanvasRenderingContext2D) {
    const { top, left, width, height } = this;
    ctx.beginPath();
    ctx.rect(left, top, width, height);
    ctx.fill();
    ctx.stroke();
  }
}

export class Circle extends ShapeItem {
  private opt: CircleOptions;

  constructor(start: Point, radius: number, options?: Partial<CircleOptions>) {
    super();
    super.push(start);
    this.opt = mergeObjects({ radius, startAngle: 0, endAngle: 2 * Math.PI }, options || {});
  }

  get radius() {
    return this.opt.radius;
  };

  push() {
    throw new Error('Method not implemented.');
  }

  setOptions(options: Partial<CircleOptions>) {
    this.opt = mergeObjects(this.opt, options);
  }

  setPoint(point: Point) {
    this.removeChild(0);
    super.push(point);
  }

  draw(ctx: CanvasRenderingContext2D) {
    const point = this.children[0];
    const { radius, startAngle, endAngle } = this.opt;
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.stroke();
  }
}

export class Ellipse extends ShapeItem {
  private opt: EllipseOptions;

  constructor(center: Point, radius: Point, options?: Partial<EllipseOptions>) {
    super();
    super.push(center);
    super.push(radius);
    this.opt = mergeObjects({ rotation: 0, startAngle: 0, endAngle: 2 * Math.PI }, options || {});
  }

  push() {
    throw new Error('Method not implemented.');
  }

  setCenter(point: Point) {
    this.removeChild(0);
    super.unshift(point);
  }

  setRadius(point: Point) {
    this.removeChild(1);
    super.push(point);
  }

  setOptions(options: Partial<EllipseOptions>) {
    this.opt = mergeObjects(this.opt, options);
  }

  draw(ctx: CanvasRenderingContext2D) {
    const { rotation, startAngle, endAngle } = this.opt;
    const [center, radius] = this.children;
    ctx.beginPath();
    ctx.ellipse(center.x, center.y, radius.x, radius.y, rotation, startAngle, endAngle);
    ctx.closePath();
    ctx.stroke();
  }
}
