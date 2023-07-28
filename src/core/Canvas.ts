import { Point, Shape, ShapeGroup } from '@core/Shape';
import { mergeObjects } from '@utils/object';
import { throttle } from '@utils/limit';

export interface CanvasOptions {
  width: number;
  height: number;
}

export class Canvas {
  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;
  //
  private selected?: Shape;
  private points = {
    start: new Point(0, 0),
    selected: new Point(0, 0),
  };
  private options: CanvasOptions;
  private __graphics: ShapeGroup = new ShapeGroup();

  constructor(selectors: string | HTMLCanvasElement, options?: Partial<CanvasOptions>) {
    this.canvas = typeof selectors === 'string' ? document.querySelector(selectors) : selectors;
    this.options = mergeObjects({}, options || {});
    this.canvas.width = this.options.width;
    this.canvas.height = this.options.height;
    this.context = this.canvas.getContext('2d');
    // 事件监听
    this.canvas.addEventListener('mousemove', throttle(this.onMouseMove.bind(this), 100));
    this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
    //
    this.canvas.addEventListener('click', this.onClick.bind(this));
    this.canvas.addEventListener('dblclick', this.onDoubleClick.bind(this));
    this.canvas.addEventListener('contextmenu', this.onContextMenu.bind(this));
  }

  get graphics() {
    return this.__graphics;
  }

  private onMouseMove({ offsetX: oX, offsetY: oY }: MouseEvent) {
    if (!this.selected || !this.selected.dragging) return;
    const { x: cX, y: cY } = this.points.start;
    const { x: sX, y: sY } = this.points.start;
    this.selected.left = cX + (sX - oX);
    this.selected.top = cY + (sY - oY);
    console.log('onMouseMove');
  }

  private onMouseDown({ offsetX, offsetY }: MouseEvent) {
    this.points.start = new Point(offsetX, offsetY);
    this.selected = this.graphics.isPointInShape(offsetX, offsetY);
    if (this.selected) this.points.selected = new Point(this.selected.left, this.selected.top);
    console.log('onMouseDown');
  }

  private onMouseUp(event: MouseEvent) {
    // 有节流处理需要在移动最后一次
    this.onMouseMove(event);
    this.selected = undefined;
    console.log('onMouseUp');
  }

  private onClick(event: MouseEvent) {
    console.log('click', event);
  }

  private onDoubleClick(event: MouseEvent) {
    console.log('dblclick', event);
  }

  private onContextMenu(event: MouseEvent) {
    console.log('contextmenu', event);
  }

  public add(graphics: Shape) {
    this.__graphics.add(graphics);
  }

  public draw() {
    this.graphics.draw(this.context);
  }

  on() {
  }

  off() {
  }
}
