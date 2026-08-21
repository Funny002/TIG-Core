import { EngineLogger } from '../Logger';
import { Shape } from '../Core';
import { CanvasStyle } from '../Lib';
import { boundsIntersect, circleRectCollide } from '../Lib';
import type { CanvasStyleConfig } from '../Lib';
import type { Circle } from './Circle';

/** 矩形选项接口 */
export interface RectangleOptions {
  x: number;                           // 坐标
  y: number;                           // 坐标
  width: number;                       // 宽度
  height: number;                      // 高度
  visible: boolean;                    // 是否可见
  rounds: number | number[];           // 圆角半径（数字或 [左上,右上,右下,左下]）
  style: Partial<CanvasStyleConfig>;   // 样式配置
}

/**
 * 矩形形状
 * @extends Shape
 */
export class Rectangle extends Shape {
  public readonly type = 'rectangle';
  public readonly style: CanvasStyle;
  private __rounds: number | number[] = 0;

  /** 获取圆角半径 */
  get rounds(): number | number[] {
    return this.__rounds;
  }

  /** 设置圆角半径（校验并规范化） */
  set rounds(value: number | number[]) {
    const clamp = (v: number): boolean => {
      if (!Number.isFinite(v)) {
        EngineLogger.warn(`Rectangle rounds 值必须为数字，当前值: ${v}`);
        return false;
      }
      if (v < 0) {
        EngineLogger.warn(`Rectangle rounds 值不能小于 0，当前值: ${v}`);
        return false;
      }
      return true;
    };

    if (Array.isArray(value)) {
      if (value.length > 4) {
        EngineLogger.warn(`Rectangle rounds 数组长度不能超过 4，当前值: ${value}`);
        return;
      }
      const list = [
        value[0] ?? 0,
        value[1] ?? value[0] ?? 0,
        value[2] ?? value[0] ?? 0,
        value[3] ?? value[1] ?? value[0] ?? 0,
      ];
      if (list.every(clamp)) {
        this.__rounds = [...list];
      }
    } else if (clamp(value)) {
      this.__rounds = value;
    }
  }

  constructor(config: Partial<RectangleOptions> = {}) {
    super({ x: config.x ?? 0, y: config.y ?? 0 });
    this._size = { width: config.width ?? 0, height: config.height ?? 0 };
    this.rounds = config.rounds ?? 0;
    this.visible = config.visible ?? true;
    this.style = new CanvasStyle(config.style ?? {});
  }

  /** 获取规范化后的四角圆角半径数组 */
  private getNormalizedRounds(): number[] {
    if (Array.isArray(this.__rounds)) {
      return [...this.__rounds];
    }
    return [this.__rounds, this.__rounds, this.__rounds, this.__rounds];
  }

  protected paint(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    ctx.roundRect(this.x, this.y, this._size.width, this._size.height, this.getNormalizedRounds());
    this.style.apply(ctx);
    this.style.drawFill(ctx);
    this.style.drawStroke(ctx);
  }

  collision(other: Shape): boolean {
    switch (other.type) {
      case 'circle':
        return circleRectCollide((other as Circle).centerX, (other as Circle).centerY, (other as Circle).radius, this.bounds);
      case 'rectangle':
        return boundsIntersect(this.bounds, other.bounds);
      case 'line':
        // 线段与矩形：退化为包围盒检测
        return boundsIntersect(this.bounds, other.bounds);
      default:
        return boundsIntersect(this.bounds, other.bounds);
    }
  }

  getState(): Record<string, any> {
    return {
      name: 'Rectangle',
      ...super.getState(),
      rounds: this.rounds,
      style: this.style.getConfig(),
    };
  }
}
