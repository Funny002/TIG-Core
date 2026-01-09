// import { Shape, Point, Size } from '../Shape';
//
// export class Line extends Shape {
//   private _end: Point;
//
//   constructor(start: Point, end: Point) {
//     super(start);
//     this._end = end;
//   }
//
//   get size(): Size {
//     const minX = Math.min(this.x, this._end.x);
//     const maxX = Math.max(this.x, this._end.x);
//     const minY = Math.min(this.y, this._end.y);
//     const maxY = Math.max(this.y, this._end.y);
//
//     return {
//       width: maxX - minX,
//       height: maxY - minY,
//     };
//   }
//
//   set size(value: Size) {
//     // 线条的size是只读的，由起点和终点决定
//     console.warn('Line size is read-only, determined by start and end points');
//   }
//
//   get end(): Point {
//     return this._end;
//   }
//
//   set end(value: Point) {
//     const oldEnd = { ...this._end };
//     this._end = value;
//
//     // 如果终点变化，触发size-changed事件
//     if (oldEnd.x !== value.x || oldEnd.y !== value.y) {
//       this.emit('size-changed', { width: this.width, height: this.height });
//     }
//   }
//
//   get length(): number {
//     const dx = this._end.x - this.x;
//     const dy = this._end.y - this.y;
//     return Math.sqrt(dx * dx + dy * dy);
//   }
//
//   get angle(): number {
//     return Math.atan2(this._end.y - this.y, this._end.x - this.x);
//   }
//
//   get bounds() {
//     const minX = Math.min(this.x, this._end.x);
//     const maxX = Math.max(this.x, this._end.x);
//     const minY = Math.min(this.y, this._end.y);
//     const maxY = Math.max(this.y, this._end.y);
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
//   collision(other: Shape): boolean {
//     // 检测起点是否在形状内
//     const startInShape =
//         this.x >= other.bounds.left &&
//         this.x <= other.bounds.right &&
//         this.y >= other.bounds.top &&
//         this.y <= other.bounds.bottom;
//
//     // 检测终点是否在形状内
//     const endInShape =
//         this._end.x >= other.bounds.left &&
//         this._end.x <= other.bounds.right &&
//         this._end.y >= other.bounds.top &&
//         this._end.y <= other.bounds.bottom;
//
//     return startInShape || endInShape;
//   }
//
//   draw(ctx: CanvasRenderingContext2D): void {
//     ctx.beginPath();
//     ctx.moveTo(this.x, this.y);
//     ctx.lineTo(this._end.x, this._end.y);
//     ctx.stroke();
//   }
//
//   getState(): Record<string, any> {
//     return {
//       type: 'Line',
//       start: { x: this.x, y: this.y },
//       end: this._end,
//       length: this.length,
//       angle: this.angle,
//       bounds: this.bounds,
//     };
//   }
// }
