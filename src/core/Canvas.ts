import { mergeObjects, throttle } from '../utils';
import { Listener } from '../lib/Listener';
import { Shape, ShapeKeys } from './Shape';
import { Quadtree } from './Quadtree';

export interface CanvasOptions {
  width: number;
  height: number;
  timout: number;
  capacity: number;
  maxTreeNode: number;
}

export type ListenerTypes = 'click' | 'dblclick' | 'contextmenu' | 'mousemove' | 'mousedown' | 'mouseup';

// TODO: 画布
export class Canvas {
  // TODO: 图形集合
  public graphics: Quadtree;

  // TODO: 选中的图形
  private selected?: Shape[] = [];

  // TODO: 选项
  private readonly options: CanvasOptions;

  // TODO: 画布
  private readonly canvas: HTMLCanvasElement;

  // TODO: 画布上下文
  private readonly context: CanvasRenderingContext2D;

  // TODO: 监听器
  private listener: Listener<{ graphics?: Shape[], event: MouseEvent }> = new Listener();

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

  // TODO: 发布事件
  private ShapePublish(keys: ShapeKeys, graphics: Shape[], event: MouseEvent) {
    this.listener.publish(keys, { graphics, event });
    for (const shape of graphics) {
      shape.publish(keys, event);
    }
  }

  // TODO: 鼠标按下
  private onMouseDown(event: MouseEvent) {
    this.selected = this.graphics.isPointInShape(event.offsetX, event.offsetY);
    this.ShapePublish('mousedown', this.selected, event);
  }

  // TODO: 鼠标移动
  private onMouseMove(event: MouseEvent) {
    this.ShapePublish('mousemove', this.selected, event);
  }

  // TODO: 鼠标抬起
  private onMouseUp(event: MouseEvent) {
    this.onMouseMove(event);
    this.ShapePublish('mouseup', this.selected, event);
  }

  // TODO: 单击
  private onClick(event: MouseEvent) {
    this.ShapePublish('click', this.graphics.isPointInShape(event.offsetX, event.offsetY), event);
  }

  // TODO: 双击
  private onDoubleClick(event: MouseEvent) {
    this.ShapePublish('dblclick', this.graphics.isPointInShape(event.offsetX, event.offsetY), event);
  }

  // TODO: 右键菜单
  private onContextMenu(event: MouseEvent) {
    this.ShapePublish('contextmenu', this.graphics.isPointInShape(event.offsetX, event.offsetY), event);
  }

  // TODO: 绑定事件
  public on(key: ListenerTypes, listener: (data: { graphics?: Shape[], event: MouseEvent }) => void) {
    this.listener.subscribe(key, listener);
  }

  // TODO: 解绑事件
  public off(key: ListenerTypes, listener: (data: { graphics?: Shape[], event: MouseEvent }) => void) {
    this.listener.unsubscribe(key, listener);
  }

  // TODO: 清空画布
  public clearDraw() {
    const { width, height } = this.canvas;
    this.context.clearRect(0, 0, width, height);
  }

  // TODO: 绘画
  public draw() {
    this.clearDraw();
    this.graphics.draw(this.context);
  }
}
