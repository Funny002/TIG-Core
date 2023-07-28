import { Shape } from '@core/Shape';

export class Line extends Shape {
  draw() {
    // this.context.beginPath();
    // this.context.moveTo(this.points[0].x, this.points[0].y);
    // for (let i = 1; i < this.points.length; i++) {
    //   this.context.lineTo(this.points[i].x, this.points[i].y);
    // }
    // this.context.stroke();
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
