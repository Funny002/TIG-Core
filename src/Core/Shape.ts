import { EngineLogger } from '../Logger';
import { EventEmitter } from '../Lib';

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface ShapeBoundary {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export abstract class Shape extends EventEmitter {
  abstract size: Size;
  protected point: Point;

  get x(): number {
    return this.point.x;
  }

  get y(): number {
    return this.point.y;
  }

  get width(): number {
    return this.size.width;
  }

  get height(): number {
    return this.size.height;
  }

  get bounds(): ShapeBoundary {
    return {
      top: this.point.y,
      left: this.point.x,
      width: this.size.width,
      height: this.size.height,
      //
      right: this.point.x + this.size.width,
      bottom: this.point.y + this.size.height,
    };
  };

  constructor(point: Point) {
    super();
    this.point = point;
  }

  protected handlerValue(key: 'x' | 'y' | 'width' | 'height', value: number) {
    const state = Number.isFinite(value) && this[key] !== value;
    if (!state) EngineLogger.error(`${key} 属性值无效`);
    return state;
  }

  set y(value: number) {
    if (!this.handlerValue('y', value)) return;
    this.point.y = value;
    this.emit('point-changed', { x: this.x, y: this.y });
  }

  set x(value: number) {
    if (!this.handlerValue('x', value)) return;
    this.point.x = value;
    this.emit('point-changed', { x: this.x, y: this.y });
  }

  set width(value: number) {
    if (!this.handlerValue('width', value)) return;
    this.size.width = value;
    this.emit('size-changed', { width: this.width, height: this.height });
  }

  set height(value: number) {
    if (!this.handlerValue('height', value)) return;
    this.size.height = value;
    this.emit('size-changed', { width: this.width, height: this.height });
  }

  move(dx: number, dy: number) {
    this.point.x += dx;
    this.point.y += dy;
    this.emit('move', { x: this.x, y: this.y });
  }

  abstract collision(other: Shape): boolean;

  abstract draw(ctx: CanvasRenderingContext2D): void;
}
