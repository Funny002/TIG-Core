// import { Shape, Point, Size } from '../Shape';
//
// export class Rectangle extends Shape {
//   protected _size: Size;
//   constructor(point: Point, size: Size) {
//     super(point);
//     this._size = size;
//   }
//   get size(): Size {
//     return this._size;
//   }
//   set size(value: Size) {
//     const oldWidth = this._size.width;
//     const oldHeight = this._size.height;
//     if (this.handlerValue('width', value.width)) {
//       this._size.width = value.width;
//     }
//     if (this.handlerValue('height', value.height)) {
//       this._size.height = value.height;
//     }
//     if (oldWidth !== this._size.width || oldHeight !== this._size.height) {
//       this.emit('size-changed', { width: this.width, height: this.height });
//     }
//   }
//   get center(): Point {
//     return {
//       x: this.x + this.width / 2,
//       y: this.y + this.height / 2,
//     };
//   }
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
//   draw(ctx: CanvasRenderingContext2D): void {
//     ctx.beginPath();
//     ctx.rect(this.x, this.y, this.width, this.height);
//     ctx.stroke();
//   }
//   getState(): Record<string, any> {
//     return {
//       type: 'Rectangle',
//       position: { x: this.x, y: this.y },
//       size: this.size,
//       bounds: this.bounds,
//       center: this.center,
//     };
//   }
// }
