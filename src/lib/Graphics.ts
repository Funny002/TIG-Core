import { Point, Shape } from '@core/Shape';

export class Line extends Shape {
  draw(ctx: CanvasRenderingContext2D) {
    const points = [...this.children as Point[]];
    if (points.length < 2) return;
    ctx.beginPath();
    const start = points.shift();
    ctx.moveTo(start.x, start.y);
    for (const point of points) {
      ctx.lineTo(point.x, point.y);
    }
    ctx.stroke();
  }
}

export class Circle extends Shape {
  draw() {
    // this.context.beginPath();
    // this.context.arc(this.points[0].x, this.points[0].y, this.points[1].x, 0, Math.PI * 2);
    // this.context.stroke();
  }
}

export class Rect extends Shape {
  draw() {
    // this.context.beginPath();
    // this.context.rect(this.points[0].x, this.points[0].y, this.points[1].x, this.points[1].y);
    // this.context.stroke();
  }
}

export class Ellipse extends Shape {
  draw() {
    // this.context.beginPath();
    // this.context.ellipse(this.points[0].x, this.points[0].y, this.points[1].x, this.points[1].y, 0, 0, Math.PI * 2);
    // this.context.stroke();
  }
}
