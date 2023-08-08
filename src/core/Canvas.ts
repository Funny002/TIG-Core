import { mergeObjects } from '../utils/object';
import { Listener } from '../lib/Listener';
import { throttle } from '../utils/limit';
import { Point, Shape } from './Shape';
import { Quadtree } from './Quadtree';
import { Watch } from '../lib/Decorators';

export interface CanvasOptions {
  width: number;
  height: number;
  timout: number;
  capacity: number;
  maxTreeNode: number;
}

export type ListenerTypes = 'click' | 'dblclick' | 'contextmenu' | 'mousemove' | 'mousedown' | 'mouseup';

export class Canvas {
  private graphics: Quadtree;
  private selected?: Shape = undefined;
  private readonly options: CanvasOptions;
  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;
  private points = { start: { x: 0, y: 0 }, selected: { x: 0, y: 0 } };
  private listener: Listener<{ graphics?: Shape, event: MouseEvent }> = new Listener();
  
  constructor(selectors: string | HTMLCanvasElement, options?: Partial<CanvasOptions>) {
    this.canvas = typeof selectors === 'string' ? document.querySelector(selectors) : selectors;
    this.options = mergeObjects({ width: 340, height: 300, timout: 0, capacity: 4, maxTreeNode: 10 }, options || {});
    const { width, height, capacity, maxTreeNode, timout } = this.options;
    this.canvas.width = width;
    this.canvas.height = height;
    this.context = this.canvas.getContext('2d');
    this.graphics = new Quadtree(0, 0, width, height, capacity, maxTreeNode);
    // 事件监听
    this.canvas.addEventListener('mousemove', throttle(this.onMouseMove.bind(this), timout));
    this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
    //
    this.canvas.addEventListener('click', this.onClick.bind(this));
    this.canvas.addEventListener('dblclick', this.onDoubleClick.bind(this));
    this.canvas.addEventListener('contextmenu', this.onContextMenu.bind(this));
  }

  private onMouseMove(event: MouseEvent) {
    if (!this.selected) return;
    const { offsetX: oX, offsetY: oY } = event;
    const { x: cX, y: cY } = this.points.start;
    const { x: sX, y: sY } = this.points.selected;
    const [x, y] = [sX + (oX - cX), sY + (oY - cY)];
    if (this.selected.dragging) {
      this.selected.left = x;
      this.selected.top = y;
    }
    this.listener.publish('mousemove', { graphics: this.selected, event });
  }

  private onMouseDown(event: MouseEvent) {
    // const { offsetX, offsetY } = event;
    // this.points.start = new Point(offsetX, offsetY);
    // this.selected = this.graphics.isPointInShape(offsetX, offsetY);
    // console.log('onMouseDown', this.selected);
    // this.listener.publish('mousedown', { graphics: this.selected, event });
    // if (this.selected) this.points.selected = new Point(this.selected.left, this.selected.top);
  }

  private onMouseUp(event: MouseEvent) {
    // 有节流处理需要在移动最后一次
    // this.onMouseMove(event);
    // this.selected = undefined;
    // this.listener.publish('mouseup', { graphics: this.selected, event });
  }

  private onClick(event: MouseEvent) {
    // const graphics = this.graphics.isPointInShape(event.offsetX, event.offsetY);
    // if (!graphics?.click?.(event)) return false;
    // this.listener.publish('click', { graphics, event });
  }

  private onDoubleClick(event: MouseEvent) {
    // const graphics = this.graphics.isPointInShape(event.offsetX, event.offsetY);
    // if (!graphics?.dblclick?.(event)) return false;
    // this.listener.publish('dblclick', { graphics, event });
  }

  private onContextMenu(event: MouseEvent) {
    // const graphics = this.graphics.isPointInShape(event.offsetX, event.offsetY);
    // if (!graphics?.contextmenu?.(event)) return false;
    // this.listener.publish('contextmenu', { graphics, event });
  }

  public add(graphics: Shape) {
    // this._graphics.push(graphics);
  }

  public clearDraw() {
    // const { width, height } = this.canvas;
    // this.context.clearRect(0, 0, width, height);
  }

  public draw() {
    // this.clearDraw();
    // this.graphics.startDraw(this.context);
  }

  public on(key: ListenerTypes, listener: (data: { graphics?: Shape, event: MouseEvent }) => void) {
    this.listener.subscribe(key, listener);
  }

  public off(key: ListenerTypes, listener: (data: { graphics?: Shape, event: MouseEvent }) => void) {
    this.listener.unsubscribe(key, listener);
  }
}
