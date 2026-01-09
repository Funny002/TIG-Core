import type { CanvasMouseMoveEvent } from '../src/Core';
import { Core, Shape } from '../src/main';

const canvas = new Core.Canvas({ selectors: '.canvas', width: 600, height: 400 });

const circle = new Shape.Circle({ x: 0, y: 0, width: 100, height: 100, stroke: 'red', lineWidth: 1, lineDash: [10, 2] });

function toPositive(num: number) {
  return num < 0 ? -num : num;
}

canvas.on('mousemove', (e: CanvasMouseMoveEvent) => {
  circle.x = Math.min(e.start.x + e.move.x, e.start.x);
  circle.y = Math.min(e.start.y + e.move.y, e.start.y);
  //
  const width = 0;
  // Math.max(toPositive(e.move.y), toPositive(e.move.x));
  circle.height = width || toPositive(e.move.y);
  circle.width = width || toPositive(e.move.x);
  //
  canvas.clear();
  circle.draw(canvas.context);
});
