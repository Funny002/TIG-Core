import { Shape } from '../Core';
import { CanvasStyle } from '../Lib';
import type { Point, Size } from '../Core';
import type { CanvasStyleConfig } from '../Lib';
import { EngineLogger } from '../Logger';

export interface LineOptions {
  x: number;                         // 起始坐标
  y: number;                         // 起始坐标
  endPoint: Point;                   // 结束坐标
  visible: boolean;                  // 是否可见
  style: Partial<CanvasStyleConfig>; // 样式配置
}

export class Line extends Shape {
  public visible: boolean = true;
  private readonly endPoint: Point;
  private readonly style: CanvasStyle;

  // destroy width
  set width(_: any) {
    throw new Error('Line width is read-only');
  }

  // destroy height
  set height(_: any) {
    throw new Error('Line height is read-only');
  }

  get endX() {
    return this.endPoint.x;
  }

  get endY() {
    return this.endPoint.y;
  }

  get size(): Size {
    function toPositive(num: number) {
      return num < 0 ? -num : num;
    }

    return {
      width: toPositive(this.endX - this.x),
      height: toPositive(this.endY - this.y),
    };
  }

  constructor(config: Partial<LineOptions>) {
    super({ x: config.x || 0, y: config.y || 0 });
    //
    this.visible = config.visible ?? true;
    this.style = new CanvasStyle(config.style || {});
    this.endPoint = config.endPoint || { x: config.x || 0, y: config.y || 0 };
    //
    Object.defineProperty(this, 'endPoint', { enumerable: false });
  }

  protected handlerValue(key: 'x' | 'y' | 'width' | 'height' | 'endX' | 'endY', value: number): boolean {
    if (!Number.isFinite(value)) return EngineLogger.error(`${key} 值无效`), false;
    if (this[key] === value) return false;
    return true;
  }

  set endX(value: number) {
    if (!this.handlerValue('endX', value)) return;
    this.endPoint.x = value;
    this.emit('endPoint-changed', { ...this.endPoint });
  }

  set endY(value: number) {
    if (!this.handlerValue('endY', value)) return;
    this.endPoint.y = value;
    this.emit('endPoint-changed', { ...this.endPoint });
  }

  setStartPoint(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  setEndPoint(x: number, y: number) {
    this.endX = x;
    this.endY = y;
  }

  setPoint(start: Point, point: Point) {
    this.setStartPoint(start.x, start.y);
    this.setEndPoint(point.x, point.y);
  }

  collision(shape: Shape): boolean {
    console.log('collision', shape);
    return false;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.visible) return;
    // 保存状态
    ctx.save();
    try {
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.endX, this.endY);
      // 绘制填充和边框
      this.style.apply(ctx);
      this.style.drawStroke(ctx);
    } finally {
      ctx.restore();
    }
  }
}
