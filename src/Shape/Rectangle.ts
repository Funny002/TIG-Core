import type { CanvasStyleConfig } from '../Lib';
import type { Point, Size } from '../Core';
//
import { EngineLogger } from '../Logger';
import { CanvasStyle } from '../Lib';
import { Shape } from '../Core';

export interface RectangleOptions {
  x: number;                           // 坐标
  y: number;                           // 坐标
  width: number;                       // 宽度
  height: number;                      // 高度
  visible: boolean;                    // 是否可见
  rounds: number | number[];           // 圆角宽度
  style: Partial<CanvasStyleConfig>;   // 样式配置
}

export class Rectangle extends Shape {
  readonly size: Size;
  private readonly style: CanvasStyle;

  public visible: boolean = true;
  private __rounds: number | number[] = 0;

  get centerX() {
    return this.x + this.size.width / 2;
  }

  get centerY() {
    return this.y + this.size.height / 2;
  }

  get center(): Point {
    return { x: this.centerX, y: this.centerY };
  }

  get rounds(): number | number[] {
    return this.__rounds;
  }


  set rounds(value: number | number[]) {
    const clamp = (value: number): boolean => {
      if (!Number.isFinite(value)) {
        EngineLogger.warn(`Rectangle rounds 值必须为数字，当前值: ${value}`);
        return false;
      }
      if (value < 0) {
        EngineLogger.warn(`Rectangle rounds 值不能小于 0，当前值: ${value}`);
        return false;
      }
      return true;
    };

    if (Array.isArray(value)) {
      if (value.length <= 4) {
        const list = [value[0], value[1], value[2] || value[0], value[3] || value[1]];
        if (list.find((value) => !clamp(value))) {
          EngineLogger.warn(`Rectangle rounds 值必须为数字，当前值: ${value}`);
        } else {
          this.__rounds = [...list];
        }
      } else {
        EngineLogger.warn(`Rectangle rounds 值长度不能超过 4，当前值: ${value}`);
      }
    } else {
      if (!clamp(value)) {
        EngineLogger.warn(`Rectangle rounds 值必须为数字，当前值: ${value}`);
      } else {
        this.__rounds = value;
      }
    }
  }

  constructor(config: Partial<RectangleOptions>) {
    super({ x: config.x || 0, y: config.y || 0 });
    //
    this.__rounds = config.rounds ?? 0;
    this.visible = config.visible ?? true;
    this.style = new CanvasStyle(config.style || {});
    this.size = { width: config.width || 0, height: config.height || 0 };
  }

  collision(shape: Shape): boolean {
    console.log('collision', shape);
    // // 简单的圆形碰撞检测
    // if (other instanceof Rectangle) {
    //   const dx = this.centerX - other.centerX;
    //   const dy = this.centerY - other.centerY;
    //   const distance = Math.sqrt(dx * dx + dy * dy);
    //   const radius1 = Math.min(this.size.width, this.size.height) / 2;
    //   const radius2 = Math.min(other.size.width, other.size.height) / 2;
    //   return distance < radius1 + radius2;
    // }
    // // 可以扩展其他形状的碰撞检测
    // console.warn('碰撞检测仅支持 Rectangle 之间');
    return false;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.visible) return;
    // 保存状态
    ctx.save();
    try {
      ctx.beginPath();
      const rounds = Array.isArray(this.__rounds) ? this.__rounds : [this.__rounds, this.__rounds, this.__rounds, this.__rounds];
      ctx.roundRect(this.x, this.y, this.size.width, this.size.height, rounds);
      // 绘制填充和边框
      this.style.apply(ctx);
      this.style.drawFill(ctx);
      this.style.drawStroke(ctx);
    } finally {
      ctx.restore();
    }
  }

  getState(): Record<string, any> {
    return {
      name: 'Rectangle',
      ...super.getState(),
      rounds: this.rounds,
      visible: this.visible,
      style: this.style.getConfig(),
    };
  }
}
