import type { CanvasStyleConfig } from '../Lib';
import type { Point, Size } from '../Core';
//
import { CanvasStyle } from '../Lib';
import { Shape } from '../Core';

export interface CircleOptions {
  x: number;                         // 起始坐标
  y: number;                         // 起始坐标
  width: number;                     // 宽度
  height: number;                    // 高度
  visible: boolean;                  // 是否可见
  style: Partial<CanvasStyleConfig>; // 样式配置
}

export class Circle extends Shape {
  readonly size: Size;
  private readonly style: CanvasStyle;

  get centerX() {
    return this.x + this.size.width / 2;
  }

  get centerY() {
    return this.y + this.size.height / 2;
  }

  get center(): Point {
    return { x: this.centerX, y: this.centerY };
  }

  public visible: boolean = true;

  constructor(config: Partial<CircleOptions>) {
    super({ x: config.x || 0, y: config.y || 0 });
    //
    this.visible = config.visible ?? true;
    this.style = new CanvasStyle(config.style || {});
    this.size = { width: config.width || 0, height: config.height || 0 };
  }

  collision(shape: Shape): boolean {
    console.log('collision', shape);
    // // 简单的圆形碰撞检测
    // if (other instanceof Circle) {
    //   const dx = this.centerX - other.centerX;
    //   const dy = this.centerY - other.centerY;
    //   const distance = Math.sqrt(dx * dx + dy * dy);
    //   const radius1 = Math.min(this.size.width, this.size.height) / 2;
    //   const radius2 = Math.min(other.size.width, other.size.height) / 2;
    //   return distance < radius1 + radius2;
    // }
    // // 可以扩展其他形状的碰撞检测
    // console.warn('碰撞检测仅支持 Circle 之间');
    return false;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.visible) return;
    // 保存状态
    ctx.save();
    try {
      const { centerY, centerX } = this;
      const radiusX = this.size.width / 2;
      const radiusY = this.size.height / 2;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
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
      name: 'Circle',
      ...super.getState(),
      visible: this.visible,
      style: this.style.getConfig(),
    };
  }
}
