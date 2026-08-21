import { EngineLogger } from '../Logger';
import { Shape } from '../Core';
import { CanvasStyle } from '../Lib';
import { boundsIntersect, pointToSegmentDistance, segmentIntersect } from '../Lib';
import type { CanvasStyleConfig } from '../Lib';
import type { Bounding, Point, Size } from '../Core';
import type { Circle } from './Circle';

/** 线段选项接口 */
export interface LineOptions {
  x: number;                         // 起始坐标
  y: number;                         // 起始坐标
  endPoint: Point;                   // 结束坐标
  visible: boolean;                  // 是否可见
  style: Partial<CanvasStyleConfig>; // 样式配置
}

/**
 * 线段形状
 * @extends Shape
 */
export class Line extends Shape {
  public readonly type = 'line';
  private endPoint: Point;
  public readonly style: CanvasStyle;

  get endX(): number {
    return this.endPoint.x;
  }

  get endY(): number {
    return this.endPoint.y;
  }

  /** 起始点 */
  get start(): Point {
    return { x: this.x, y: this.y };
  }

  /** 结束点 */
  get end(): Point {
    return { x: this.endX, y: this.endY };
  }

  /** 线段尺寸（由起止点计算） */
  get size(): Size {
    return {
      width: Math.abs(this.endX - this.x),
      height: Math.abs(this.endY - this.y),
    };
  }

  /** 线段紧凑包围盒（由起止点计算，支持任意方向） */
  protected computeBounds(): Bounding {
    const minX = Math.min(this.x, this.endX);
    const maxX = Math.max(this.x, this.endX);
    const minY = Math.min(this.y, this.endY);
    const maxY = Math.max(this.y, this.endY);
    return {
      top: minY,
      left: minX,
      right: maxX,
      bottom: maxY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  /** 宽度为只读，由起止点决定 */
  set width(_: number) {
    EngineLogger.warn('Line width 是只读属性，由起止点坐标决定');
  }

  /** 高度为只读，由起止点决定 */
  set height(_: number) {
    EngineLogger.warn('Line height 是只读属性，由起止点坐标决定');
  }

  constructor(config: Partial<LineOptions> = {}) {
    super({ x: config.x ?? 0, y: config.y ?? 0 });
    this.visible = config.visible ?? true;
    this.style = new CanvasStyle(config.style ?? {});
    this.endPoint = config.endPoint
      ? { ...config.endPoint }
      : { x: config.x ?? 0, y: config.y ?? 0 };
  }

  /** 设置结束点 X 坐标 */
  set endX(value: number) {
    if (!Number.isFinite(value)) {
      EngineLogger.error('endX 值无效');
      return;
    }
    if (this.endPoint.x === value) return;
    this.endPoint.x = value;
    this.invalidateBounds();
    this.emit('point-changed', { ...this.point });
  }

  /** 设置结束点 Y 坐标 */
  set endY(value: number) {
    if (!Number.isFinite(value)) {
      EngineLogger.error('endY 值无效');
      return;
    }
    if (this.endPoint.y === value) return;
    this.endPoint.y = value;
    this.invalidateBounds();
    this.emit('point-changed', { ...this.point });
  }

  /** 设置起始点 */
  setStartPoint(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  /** 设置结束点 */
  setEndPoint(x: number, y: number): void {
    this.endX = x;
    this.endY = y;
  }

  /** 同时设置起始点与结束点 */
  setPoint(start: Point, end: Point): void {
    this.setStartPoint(start.x, start.y);
    this.setEndPoint(end.x, end.y);
  }

  /** 移动线段（同时平移起止点） */
  move(dx: number, dy: number): void {
    if (!Number.isFinite(dx) || !Number.isFinite(dy)) return;
    this.point.x += dx;
    this.point.y += dy;
    this.endPoint.x += dx;
    this.endPoint.y += dy;
    this.invalidateBounds();
    this.emit('move', { x: this.x, y: this.y });
  }

  protected paint(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.endX, this.endY);
    this.style.apply(ctx);
    this.style.drawStroke(ctx);
  }

  collision(other: Shape): boolean {
    switch (other.type) {
      case 'line':
        return segmentIntersect(this.start, this.end, (other as Line).start, (other as Line).end);
      case 'circle':
        return pointToSegmentDistance((other as Circle).center, this.start, this.end) <= (other as Circle).radius;
      default:
        // 矩形、多边形等退化为包围盒检测
        return boundsIntersect(this.bounds, other.bounds);
    }
  }

  getState(): Record<string, any> {
    return {
      name: 'Line',
      ...super.getState(),
      endPoint: { ...this.endPoint },
      style: this.style.getConfig(),
    };
  }
}
