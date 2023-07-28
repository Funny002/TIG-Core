import { Paths, PathsGroup } from '@core/Paths';
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
  private options: CanvasOptions;
  public graphics: PathsGroup = new PathsGroup();

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
    this.canvas.addEventListener('keydown', this.onKeyDown.bind(this));
    this.canvas.addEventListener('keyup', this.onKeyUp.bind(this));
    //
    this.canvas.addEventListener('click', this.onClick.bind(this));
    this.canvas.addEventListener('dblclick', this.onDoubleClick.bind(this));
    this.canvas.addEventListener('contextmenu', this.onContextMenu.bind(this));
  }

  private onMouseMove(event: MouseEvent) {
    console.log('mousemove', event);
  }

  private onMouseDown(event: MouseEvent) {
    console.log('mousedown', event);
  }

  private onMouseUp(event: MouseEvent) {
    console.log('mouseup', event);
  }

  private onKeyDown(event: KeyboardEvent) {
    console.log('keydown', event);
  }

  private onKeyUp(event: KeyboardEvent) {
    console.log('keyup', event);
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

  draw() {
    this.graphics.draw(this.context);
  }

  on() {
  }

  off() {
  }
}
