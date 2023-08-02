import { mergeObjects } from '@utils/object';
import { Point, Shape } from '@core/Shape';

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

export abstract class ShapeItem extends Shape {
  get children(): Point[] {
    return this.__children as Point[];
  }
}

export class Line extends ShapeItem {
  public width: number = 1;

  constructor(start: Point, width = 1) {
    super();
    this.add(start);
    this.width = width;
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

export class Circle extends ShapeItem {
  private opt: CircleOptions;

  constructor(start: Point, radius: number, options?: Partial<CircleOptions>) {
    super();
    super.add(start);
    this.opt = mergeObjects({ radius, startAngle: 0, endAngle: 2 * Math.PI }, options || {});
  }

  get radius() {
    return this.opt.radius;
  };

  add() {
    throw new Error('Method not implemented.');
  }

  setOptions(options: Partial<CircleOptions>) {
    this.opt = mergeObjects(this.opt, options);
  }

  setPoint(point: Point) {
    this.removeChild(0);
    super.add(point);
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

export class Rect extends ShapeItem {
  public width: number;
  public height: number;

  constructor(start: Point, width: number, height: number) {
    super();
    super.add(start);
    this.width = width;
    this.height = height;
  }

  add() {
    throw new Error('Method not implemented.');
  }

  setStart(point: Point) {
    this.removeChild(0);
    super.add(point);
  }

  draw(ctx: CanvasRenderingContext2D) {
    const point = this.children[0];
    ctx.beginPath();
    ctx.rect(point.x, point.y, this.width, this.height);
    ctx.closePath();
    ctx.stroke();
  }
}

export class Ellipse extends ShapeItem {
  private opt: EllipseOptions;

  constructor(center: Point, radius: Point, options?: Partial<EllipseOptions>) {
    super();
    super.add(center);
    super.add(radius);
    this.opt = mergeObjects({ rotation: 0, startAngle: 0, endAngle: 2 * Math.PI }, options || {});
  }

  add() {
    throw new Error('Method not implemented.');
  }

  setCenter(point: Point) {
    this.removeChild(0);
    super.addShift(point);
  }

  setRadius(point: Point) {
    this.removeChild(1);
    super.add(point);
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
