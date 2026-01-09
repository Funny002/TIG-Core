// import { Shape, Point, Size } from '../Shape';
//
// export class Path extends Shape {
//   private _commands: (string | number)[];
//   private _currentPoint: Point;
//
//   constructor(startPoint: Point) {
//     super(startPoint);
//     this._commands = ['M', startPoint.x, startPoint.y];
//     this._currentPoint = startPoint;
//   }
//
//   get size(): Size {
//     const bounds = this.bounds;
//     return {
//       width: bounds.width,
//       height: bounds.height,
//     };
//   }
//
//   set size(value: Size) {
//     // 路径size是只读的，由路径命令决定
//     console.warn('Path size is read-only, determined by path commands');
//   }
//
//   get commands(): (string | number)[] {
//     return [...this._commands];
//   }
//
//
//   get bounds() {
//     const points = this.getAllPoints();
//
//     if (points.length === 0) {
//       return {
//         top: this.y,
//         left: this.x,
//         right: this.x,
//         bottom: this.y,
//         width: 0,
//         height: 0,
//       };
//     }
//
//     let minX = points[0].x;
//     let maxX = points[0].x;
//     let minY = points[0].y;
//     let maxY = points[0].y;
//
//     for (let i = 1; i < points.length; i++) {
//       const p = points[i];
//       minX = Math.min(minX, p.x);
//       maxX = Math.max(maxX, p.x);
//       minY = Math.min(minY, p.y);
//       maxY = Math.max(maxY, p.y);
//     }
//
//     return {
//       top: minY,
//       left: minX,
//       right: maxX,
//       bottom: maxY,
//       width: maxX - minX,
//       height: maxY - minY,
//     };
//   }
//
//
//   moveTo(point: Point): Path {
//     this._commands.push('M', point.x, point.y);
//     this._currentPoint = point;
//     this.emit('size-changed', { width: this.width, height: this.height });
//     return this;
//   }
//
//
//   lineTo(point: Point): Path {
//     this._commands.push('L', point.x, point.y);
//     this._currentPoint = point;
//     this.emit('size-changed', { width: this.width, height: this.height });
//     return this;
//   }
//
//   bezierCurveTo(cp1: Point, cp2: Point, point: Point): Path {
//     this._commands.push('C', cp1.x, cp1.y, cp2.x, cp2.y, point.x, point.y);
//     this._currentPoint = point;
//     this.emit('size-changed', { width: this.width, height: this.height });
//     return this;
//   }
//
//   quadraticCurveTo(cp: Point, point: Point): Path {
//     this._commands.push('Q', cp.x, cp.y, point.x, point.y);
//     this._currentPoint = point;
//     this.emit('size-changed', { width: this.width, height: this.height });
//     return this;
//   }
//
//   closePath(): Path {
//     this._commands.push('Z');
//     this.emit('size-changed', { width: this.width, height: this.height });
//     return this;
//   }
//
//
//   private getAllPoints(): Point[] {
//     const points: Point[] = [];
//     let currentPoint: Point = { x: 0, y: 0 };
//
//     for (let i = 0; i < this._commands.length; i++) {
//       const cmd = this._commands[i];
//
//       if (cmd === 'M' || cmd === 'L') {
//         const x = this._commands[++i] as number;
//         const y = this._commands[++i] as number;
//         currentPoint = { x, y };
//         points.push(currentPoint);
//       } else if (cmd === 'C') {
//         // 三次贝塞尔曲线的控制点1
//         const cp1x = this._commands[++i] as number;
//         const cp1y = this._commands[++i] as number;
//         points.push({ x: cp1x, y: cp1y });
//
//         // 三次贝塞尔曲线的控制点2
//         const cp2x = this._commands[++i] as number;
//         const cp2y = this._commands[++i] as number;
//         points.push({ x: cp2x, y: cp2y });
//
//         // 三次贝塞尔曲线的结束点
//         const ex = this._commands[++i] as number;
//         const ey = this._commands[++i] as number;
//         currentPoint = { x: ex, y: ey };
//         points.push(currentPoint);
//       } else if (cmd === 'Q') {
//         // 二次贝塞尔曲线的控制点
//         const cpx = this._commands[++i] as number;
//         const cpy = this._commands[++i] as number;
//         points.push({ x: cpx, y: cpy });
//
//         // 二次贝塞尔曲线的结束点
//         const ex = this._commands[++i] as number;
//         const ey = this._commands[++i] as number;
//         currentPoint = { x: ex, y: ey };
//         points.push(currentPoint);
//       }
//     }
//
//     return points;
//   }
//
//   collision(other: Shape): boolean {
//     const bounds1 = this.bounds;
//     const bounds2 = other.bounds;
//
//     return !(
//         bounds1.right < bounds2.left ||
//         bounds1.left > bounds2.right ||
//         bounds1.bottom < bounds2.top ||
//         bounds1.top > bounds2.bottom
//     );
//   }
//
//   draw(ctx: CanvasRenderingContext2D): void {
//     if (this._commands.length < 3) return;
//
//     ctx.beginPath();
//
//     for (let i = 0; i < this._commands.length; i++) {
//       const cmd = this._commands[i];
//
//       if (cmd === 'M') {
//         const x = this._commands[++i] as number;
//         const y = this._commands[++i] as number;
//         ctx.moveTo(x, y);
//       } else if (cmd === 'L') {
//         const x = this._commands[++i] as number;
//         const y = this._commands[++i] as number;
//         ctx.lineTo(x, y);
//       } else if (cmd === 'C') {
//         const cp1x = this._commands[++i] as number;
//         const cp1y = this._commands[++i] as number;
//         const cp2x = this._commands[++i] as number;
//         const cp2y = this._commands[++i] as number;
//         const ex = this._commands[++i] as number;
//         const ey = this._commands[++i] as number;
//         ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, ex, ey);
//       } else if (cmd === 'Q') {
//         const cpx = this._commands[++i] as number;
//         const cpy = this._commands[++i] as number;
//         const ex = this._commands[++i] as number;
//         const ey = this._commands[++i] as number;
//         ctx.quadraticCurveTo(cpx, cpy, ex, ey);
//       } else if (cmd === 'Z') {
//         ctx.closePath();
//       }
//     }
//
//     ctx.stroke();
//   }
//
//   getState(): Record<string, any> {
//     return {
//       type: 'Path',
//       startPoint: { x: this.x, y: this.y },
//       commands: this.commands,
//       bounds: this.bounds,
//       commandCount: this._commands.length,
//     };
//   }
// }
