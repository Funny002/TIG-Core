import { EngineLogger } from '../Logger';
import { Shape } from '../Core';
import { CanvasStyle } from '../Lib';
import { boundsIntersect, computeBounds, pointInPolygon } from '../Lib';
import type { CanvasStyleConfig } from '../Lib';
import type { Bounding, Point, Size } from '../Core';
import type { Circle } from './Circle';

/** 多边形选项接口 */
export interface PolygonOptions {
  x: number;                         // 锚点坐标
  y: number;                         // 锚点坐标
  vertices: Point[];                 // 顶点（相对锚点的坐标）
  visible: boolean;                  // 是否可见
  style: Partial<CanvasStyleConfig>; // 样式配置
}

/**
 * 多边形形状
 * @extends Shape
 */
export class Polygon extends Shape {
  public readonly type: string = 'polygon';
  private points: Point[];           // 相对锚点的顶点
  public readonly style: CanvasStyle;

  /** 紧凑包围盒（由绝对顶点计算） */
  protected computeBounds(): Bounding {
    return computeBounds(this.absolutePoints, this.point);
  }

  /** 尺寸由顶点决定（只读） */
  get size(): Size {
    const bounds = this.bounds;
    return { width: bounds.width, height: bounds.height };
  }

  /** 中心点 X（紧凑包围盒中心） */
  get centerX(): number {
    return this.bounds.left + this.bounds.width / 2;
  }

  /** 中心点 Y（紧凑包围盒中心） */
  get centerY(): number {
    return this.bounds.top + this.bounds.height / 2;
  }

  /** 宽度为只读，由顶点决定 */
  set width(_: number) {
    EngineLogger.warn('Polygon width 是只读属性，由顶点决定');
  }

  /** 高度为只读，由顶点决定 */
  set height(_: number) {
    EngineLogger.warn('Polygon height 是只读属性，由顶点决定');
  }

  /** 获取顶点（相对坐标副本） */
  get vertices(): Point[] {
    return this.points.map((v) => ({ ...v }));
  }

  /** 设置顶点（相对坐标） */
  set vertices(value: Point[]) {
    this.points = value.map((v) => ({ ...v }));
    this.invalidateBounds();
    this.emit('size-changed', { width: this.width, height: this.height });
  }

  /** 获取绝对坐标顶点 */
  get absolutePoints(): Point[] {
    return this.points.map((v) => ({ x: this.x + v.x, y: this.y + v.y }));
  }

  constructor(config: Partial<PolygonOptions> = {}) {
    super({ x: config.x ?? 0, y: config.y ?? 0 });
    this.points = (config.vertices ?? []).map((v) => ({ ...v }));
    this.visible = config.visible ?? true;
    this.style = new CanvasStyle(config.style ?? {});
  }

  /** 移动多边形（平移锚点即可，相对顶点不变） */
  protected paint(ctx: CanvasRenderingContext2D): void {
    const abs = this.absolutePoints;
    if (abs.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(abs[0].x, abs[0].y);
    for (let i = 1; i < abs.length; i += 1) {
      ctx.lineTo(abs[i].x, abs[i].y);
    }
    ctx.closePath();
    this.style.apply(ctx);
    this.style.drawFill(ctx);
    this.style.drawStroke(ctx);
  }

  collision(other: Shape): boolean {
    if (!boundsIntersect(this.bounds, other.bounds)) return false;

    if (other.type === 'polygon' || other.type === 'triangle') {
      const b = (other as Polygon).absolutePoints;
      return this.absolutePoints.some((p) => pointInPolygon(p, b)) ||
        b.some((p) => pointInPolygon(p, this.absolutePoints));
    }

    if (other.type === 'circle') {
      const circle = other as Circle;
      return pointInPolygon(circle.center, this.absolutePoints) ||
        this.absolutePoints.some((p) => Math.hypot(p.x - circle.centerX, p.y - circle.centerY) <= circle.radius);
    }

    // 矩形、线段等：包围盒已相交，近似判定为碰撞
    return true;
  }

  getState(): Record<string, any> {
    return {
      name: 'Polygon',
      ...super.getState(),
      vertices: this.vertices,
      absolutePoints: this.absolutePoints,
      vertexCount: this.points.length,
      style: this.style.getConfig(),
    };
  }
}
