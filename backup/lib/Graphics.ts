import { Point, ShapeItem } from '../core/Shape';
import { Watch } from './Decorators';

// TODO: 线
export class Line extends ShapeItem {
  // TODO: 线宽
  @Watch<number>(function () {
    this.update();
  }) public width: number = 1;

  constructor(top: number, left: number, width = 1) {
    super();
    this.top = top;
    this.left = left;
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

// TODO: 矩形
export class Rect extends ShapeItem {
  // TODO: 宽
  @Watch<number>(function () {
    this.update();
  }) public width: number;

  // TODO: 高
  @Watch<number>(function () {
    this.update();
  }) public height: number;

  // TODO: 圆角
  @Watch<number>(function () {
    this.update();
  }) public radii: number | number[];

  constructor(top: number, left: number, width: number = 1, height: number = 1, radii: number | number[] = 0) {
    super();
    this.radii = 0;
    this.top = top;
    this.left = left;
    this.width = width;
    this.height = height;
    this.addChild(new Point(0, 0));
  }

  get size() {
    return { width: this.width, height: this.height };
  }

  addChild(child: Point, index?: number) {
    this.removeChild(0);
    super.addChild(child, index);
  }

  draw(ctx: CanvasRenderingContext2D) {
    const { width, height, radii } = this;
    // ctx.fillRect(0, 0, width, height);
    ctx.roundRect(0, 0, width, height, radii);
    ctx.fill();
  }
}

// TODO: 圆
export class Circle extends ShapeItem {
  // TODO: 半径
  public radius: number = 1;

  // TODO: 起始角度
  public startAngle: number = 0;

  // TODO: 结束角度
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

// TODO: 椭圆
export class Ellipse extends ShapeItem {
  // TODO: 旋转
  public rotation: number = 0;

  // TODO: 起始角度
  public startAngle: number = 0;

  // TODO: 结束角度
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
