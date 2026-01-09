// import { Shape, Point, Size } from '../Shape';
//
// export class Polygon extends Shape {
//   private _vertices: Point[];
//
//   constructor(center: Point, vertices: Point[]) {
//     super(center);
//     this._vertices = vertices;
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
//     // 多边形size是只读的，由顶点决定
//     console.warn('Polygon size is read-only, determined by vertices');
//   }
//
//   get vertices(): Point[] {
//     return this._vertices.map(v => ({ ...v }));
//   }
//
//   set vertices(value: Point[]) {
//     this._vertices = value.map(v => ({ ...v }));
//     this.emit('size-changed', { width: this.width, height: this.height });
//   }
//
//   get absoluteVertices(): Point[] {
//     return this._vertices.map(v => ({
//       x: this.x + v.x,
//       y: this.y + v.y,
//     }));
//   }
//
//   get bounds() {
//     const vertices = this.absoluteVertices;
//
//     if (vertices.length === 0) {
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
//     let minX = vertices[0].x;
//     let maxX = vertices[0].x;
//     let minY = vertices[0].y;
//     let maxY = vertices[0].y;
//
//     for (let i = 1; i < vertices.length; i++) {
//       const v = vertices[i];
//       minX = Math.min(minX, v.x);
//       maxX = Math.max(maxX, v.x);
//       minY = Math.min(minY, v.y);
//       maxY = Math.max(maxY, v.y);
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
//     const vertices = this.absoluteVertices;
//
//     if (vertices.length < 2) return;
//
//     ctx.beginPath();
//     ctx.moveTo(vertices[0].x, vertices[0].y);
//
//     for (let i = 1; i < vertices.length; i++) {
//       ctx.lineTo(vertices[i].x, vertices[i].y);
//     }
//     ctx.closePath();
//     ctx.stroke();
//   }
//
//   getState(): Record<string, any> {
//     return {
//       type: 'Polygon',
//       center: { x: this.x, y: this.y },
//       vertices: this.vertices,
//       absoluteVertices: this.absoluteVertices,
//       bounds: this.bounds,
//       vertexCount: this._vertices.length,
//     };
//   }
// }
