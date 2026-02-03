// import type { CanvasStyleConfig } from '../Lib';
// import type { Point, Size } from '../Core';
// import { EngineLogger } from '../Logger';
// import { CanvasStyle } from '../Lib';
// import { Shape } from '../Core';
// import { linearBezier } from '../Utils';
//
// export interface TriangleOptions {
//   x: number;                           // 坐标
//   y: number;                           // 坐标
//   width: number;                       // 宽度
//   height: number;                      // 高度
//   visible: boolean;                    // 是否可见
//   rounds: number | number[];           // 圆角宽度
//   style: Partial<CanvasStyleConfig>;   // 样式配置
// }
//
// export class Triangle extends Shape {
//   readonly size: Size;
//   private readonly style: CanvasStyle;
//
//   public visible: boolean = true;
//
//   private __rounds: number | number[] = 0;
//
//   get centerX() {
//     return this.x + this.size.width / 2;
//   }
//
//   get centerY() {
//     return this.y + this.size.height / 2;
//   }
//
//   get center(): Point {
//     return { x: this.centerX, y: this.centerY };
//   }
//
//   get rounds(): number | number[] {
//     return this.__rounds;
//   }
//
//   set rounds(value: number | number[]) {
//     const clamp = (value: number): boolean => {
//       if (!Number.isFinite(value)) return EngineLogger.warn(`Triangle rounds 值必须为数字，当前值: ${value}`), false;
//       if (value < 0) return EngineLogger.warn(`Triangle rounds 值不能小于 0，当前值: ${value}`), false;
//       return true;
//     };
//     if (Array.isArray(value)) {
//       if (value.length !== 3) {
//         EngineLogger.warn(`Triangle rounds 值必须为数字数组长度为 3，当前值: ${value}`);
//       } else if (value.find((value) => !clamp(value))) {
//         this.__rounds = [...value];
//       }
//     } else if (!clamp(value)) {
//       EngineLogger.warn(`Triangle rounds 值必须为数字或数字数组，当前值: ${value}`);
//     } else {
//       this.__rounds = value;
//     }
//   }
//
//   constructor(config: Partial<TriangleOptions>) {
//     super({ x: config.x || 0, y: config.y || 0 });
//     //
//     this.__rounds = config.rounds ?? 0;
//     this.visible = config.visible ?? true;
//     this.style = new CanvasStyle(config.style || {});
//     this.size = { width: config.width || 0, height: config.height || 0 };
//   }
//
//   collision(shape: Shape): boolean {
//     console.log('collision', shape);
//     // // 简单的圆形碰撞检测
//     // if (other instanceof Rectangle) {
//     //   const dx = this.centerX - other.centerX;
//     //   const dy = this.centerY - other.centerY;
//     //   const distance = Math.sqrt(dx * dx + dy * dy);
//     //   const radius1 = Math.min(this.size.width, this.size.height) / 2;
//     //   const radius2 = Math.min(other.size.width, other.size.height) / 2;
//     //   return distance < radius1 + radius2;
//     // }
//     // // 可以扩展其他形状的碰撞检测
//     // console.warn('碰撞检测仅支持 Rectangle 之间');
//     return false;
//   }
//
//   private getRounds(p0: Point, p1: Point, p2: Point, rounds: number) {
//     const k1 = Math.hypot(p0.x - p1.x, p0.y - p1.y) / (Math.PI + 1);
//     const k2 = Math.hypot(p1.x - p2.x, p1.y - p2.y) / (Math.PI + 1);
//     const k3 = Math.hypot(p2.x - p0.x, p2.y - p0.y) / (Math.PI + 1);
//     console.log('Rounds', [p0, p1, p2], [k1, k2, k3], rounds);
//     return Math.min(rounds, k1, k2, k3);
//   }
//
//   draw(ctx: CanvasRenderingContext2D): void {
//     if (!this.visible) return;
//     // 保存状态
//     ctx.save();
//     try {
//       // ctx.beginPath();
//       // const centerX = this.centerX;
//       // const { top, left, right, bottom } = this.bounds;
//       // const rounds = Array.isArray(this.__rounds) ? this.__rounds : [this.__rounds, this.__rounds, this.__rounds];
//       // // 顶点
//       // const p0 = { x: centerX, y: top };
//       // const p1 = { x: right, y: bottom };
//       // const p2 = { x: left, y: bottom };
//       // // 边长中心点
//       // const k1 = linearBezier(p0, p1, 0.5); // (p0 -> p1) * 0.5t
//       // const k2 = linearBezier(p1, p2, 0.5); // (p1 -> p2) * 0.5t
//       // const k3 = linearBezier(p2, p0, 0.5); // (p2 -> p0) * 0.5t
//       // //
//       // ctx.moveTo(k1.x, k1.y);
//       // ctx.arcTo(p1.x, p1.y, k2.x, k2.y, this.getRounds(k1, p1, k2, rounds[1]));
//       // ctx.arcTo(p2.x, p2.y, k3.x, k3.y, this.getRounds(k2, p2, k3, rounds[2]));
//       // ctx.arcTo(p0.x, p0.y, k1.x, k1.y, this.getRounds(k3, p0, k1, rounds[0]));
//       // ctx.closePath();
//       // 绘画三角形
//       // 绘制填充和边框;
//       this.style.apply(ctx);
//       this.style.drawFill(ctx);
//       this.style.drawStroke(ctx);
//       //
//       ctx.fillStyle = 'red';
//       ctx.moveTo(p0.x, p0.y);
//       ctx.lineTo(p1.x, p1.y);
//       ctx.lineTo(p2.x, p2.y);
//       ctx.closePath();
//       ctx.stroke();
//     } finally {
//       ctx.restore();
//     }
//   }
//
//   getState(): Record<string, any> {
//     return {
//       name: 'Triangle',
//       ...super.getState(),
//       rounds: this.rounds,
//       visible: this.visible,
//       style: this.style.getConfig(),
//     };
//   }
// }
