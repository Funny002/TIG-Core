import { Shape } from '../Core';
import { CanvasStyle } from '../Lib';
import { boundsIntersect, circleCollide, circleRectCollide, pointToSegmentDistance } from '../Lib';
import type { CanvasStyleConfig } from '../Lib';
import type { Line } from './Line';
import type { Rectangle } from './Rectangle';

/** 圆形（椭圆）选项接口 */
export interface CircleOptions {
  x: number;                         // 起始坐标
  y: number;                         // 起始坐标
  width: number;                     // 宽度（直径）
  height: number;                    // 高度（直径）
  visible: boolean;                  // 是否可见
  style: Partial<CanvasStyleConfig>; // 样式配置
}

/**
 * 圆形（支持椭圆）形状
 * @extends Shape
 */
export class Circle extends Shape {
  public readonly type = 'circle';
  public readonly style: CanvasStyle;

  /** X 轴半径 */
  get radiusX(): number {
    return this._size.width / 2;
  }

  /** Y 轴半径 */
  get radiusY(): number {
    return this._size.height / 2;
  }

  /** 近似半径（用于碰撞检测，取两轴半径均值） */
  get radius(): number {
    return (this.radiusX + this.radiusY) / 2;
  }

  constructor(config: Partial<CircleOptions> = {}) {
    super({ x: config.x ?? 0, y: config.y ?? 0 });
    this._size = { width: config.width ?? 0, height: config.height ?? 0 };
    this.visible = config.visible ?? true;
    this.style = new CanvasStyle(config.style ?? {});
  }

  protected paint(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    ctx.ellipse(this.centerX, this.centerY, this.radiusX, this.radiusY, 0, 0, Math.PI * 2);
    this.style.apply(ctx);
    this.style.drawFill(ctx);
    this.style.drawStroke(ctx);
  }

  collision(other: Shape): boolean {
    switch (other.type) {
      case 'circle': {
        const circle = other as Circle;
        return circleCollide(this.centerX, this.centerY, this.radius, circle.centerX, circle.centerY, circle.radius);
      }
      case 'rectangle':
        return circleRectCollide(this.centerX, this.centerY, this.radius, (other as Rectangle).bounds);
      case 'line':
        return pointToSegmentDistance(this.center, (other as Line).start, (other as Line).end) <= this.radius;
      default:
        // 多边形等其他形状退化为包围盒检测
        return boundsIntersect(this.bounds, other.bounds);
    }
  }

  getState(): Record<string, any> {
    return {
      name: 'Circle',
      ...super.getState(),
      radiusX: this.radiusX,
      radiusY: this.radiusY,
      style: this.style.getConfig(),
    };
  }
}
