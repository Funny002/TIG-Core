import { Point, ShapeItem } from '../core/Shape';
import { Watch } from './Decorators';

export class Line extends ShapeItem {
  @Watch<number>(function () {
    this.update();
  }) public width: number = 1;

  constructor(width = 1) {
    super();
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

export class Rect extends ShapeItem {
  @Watch<number>(function () {
    this.update();
  }) public width: number;

  @Watch<number>(function () {
    this.update();
  }) public height: number;

  constructor(start: Point, width: number = 1, height: number = 1) {
    super();
    this.width = width;
    this.height = height;
    this.addChild(start);
  }

  get size() {
    return { width: this.width, height: this.height };
  }

  addChild(child: Point, index?: number) {
    this.removeChild(0);
    super.addChild(child, index);
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
  public radius: number = 1;
  public startAngle: number = 0;
  public endAngle: number = 2 * Math.PI;

  constructor(start: Point, radius: number = 1, startAngle: number = 0, endAngle: number = 2 * Math.PI) {
    super();
    this.addChild(start);
    this.radius = radius;
    this.endAngle = endAngle;
    this.startAngle = startAngle;
  }

  addChild(child: Point, index?: number) {
    this.removeChild(0);
    super.addChild(child, index);
  }

  draw(ctx: CanvasRenderingContext2D) {
    const { x, y } = this.children[0];
    const { radius, startAngle, endAngle, left, top } = this;
    ctx.beginPath();
    ctx.arc(x, y, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.stroke();
  }
}

export class Ellipse extends ShapeItem {
  public rotation: number = 0;
  public startAngle: number = 0;
  public endAngle: number = 2 * Math.PI;

  constructor(center: Point, radius: Point, rotation: number = 0, startAngle: number = 0, endAngle: number = 2 * Math.PI) {
    super();
    this.addChild('center', center);
    this.addChild('radius', radius);
    this.rotation = rotation;
    this.endAngle = endAngle;
    this.startAngle = startAngle;
  }

  // @ts-ignore
  addChild(keys: 'center' | 'radius', point: Point) {
    const index = keys === 'center' ? 0 : 1;
    this.removeChild(index);
    super.addChild(point, index);
  }

  draw(ctx: CanvasRenderingContext2D) {
    const { rotation, startAngle, endAngle } = this;
    const [center, radius] = this.children;
    ctx.beginPath();
    ctx.ellipse(center.x, center.y, radius.x, radius.y, rotation, startAngle, endAngle);
    ctx.closePath();
    ctx.stroke();
  }
}
