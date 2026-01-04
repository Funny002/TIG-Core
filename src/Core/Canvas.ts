import { getRatio, mergeObj, throttle } from '../Utils';
import { Listener } from '../Lib/Listener';
import { Watch } from '../Lib/Decorators';

// TODO: 画布 - 子项
export class CanvasItem {
  // TODO: 宽度
  @Watch<number>(function () {
    this['handlerCanvas']();
  }) public width: number;

  // TODO: 高度
  @Watch<number>(function () {
    this['handlerCanvas']();
  }) public height: number;

  // TODO: 画布
  public readonly canvas: HTMLCanvasElement;

  // TODO: 画布上下文
  public readonly context: CanvasRenderingContext2D;

  constructor(width: number, height: number, canvas?: HTMLCanvasElement) {
    this.width = width;
    this.height = height;
    this.canvas = canvas || document.createElement('canvas');
    this.context = this.canvas.getContext('2d', { willReadFrequently: true });
    this.handlerCanvas();
  }

  // TODO: 像素比
  get ratio() {
    return getRatio(this.context);
  }

  // TODO: 处理画布
  private handlerCanvas() {
    if (!this.canvas) return;
    const { width, height, ratio } = this;
    this.canvas.height = height * ratio;
    this.canvas.width = width * ratio;
    this.context.scale(ratio, ratio);
  }

  // TODO: 位图
  public getBitmap() {
    try {
      return this.context?.getImageData(0, 0, this.width, this.height);
    } catch (e) {
      return null;
    }
  }

  // TODO: 清除画布
  public clear() {
    this.context?.clearRect(0, 0, this.width, this.height);
  }

  // TODO: 销毁
  public destroy() {
    this.canvas?.remove();
  }
}

// TODO: 画布参数
export interface CanvasOptions {
  width: number;
  height: number;
  timout: number;
}

// TODO: 监听器类型
export type ListenerTypes = 'click' | 'dblclick' | 'contextmenu' | 'mousemove' | 'mousedown' | 'mouseup';

// TODO: 画布
export class Canvas {
  // TODO: 画布 - 类
  private __canvas: CanvasItem;

  // TODO: 画布 - 像素比
  get ratio() {
    return this.__canvas.ratio;
  }

  // TODO: 画布 - 上下文
  get context() {
    return this.__canvas.context;
  }

  // TODO: 画布 - 元素
  get canvas() {
    return this.__canvas.canvas;
  }

  // TODO: 监听器
  private listener: Listener<MouseEvent> = new Listener();

  constructor(selectors: string | HTMLCanvasElement, options?: Partial<CanvasOptions>) {
    const { width, height, timout } = mergeObj({ width: 340, height: 300, timout: 0 }, options || {});
    this.__canvas = new CanvasItem(width, height, typeof selectors === 'string' ? document.querySelector(selectors) : selectors);
    this.canvas.addEventListener('mousemove', throttle(this.onMouseMove.bind(this), timout));
    this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
    //
    this.canvas.addEventListener('click', this.onClick.bind(this));
    this.canvas.addEventListener('dblclick', this.onDoubleClick.bind(this));
    this.canvas.addEventListener('contextmenu', this.onContextMenu.bind(this));
    //
    Object.defineProperty(this, '__canvas', { enumerable: false });
  }

  // TODO: 鼠标按下
  private onMouseDown(event: MouseEvent) {
    this.listener.publish('mousedown', event);
  }

  // TODO: 鼠标移动
  private onMouseMove(event: MouseEvent) {
    this.listener.publish('mousemove', event);
  }

  // TODO: 鼠标抬起
  private onMouseUp(event: MouseEvent) {
    this.onMouseMove(event);
    this.listener.publish('mouseup', event);
  }

  // TODO: 单击
  private onClick(event: MouseEvent) {
    this.listener.publish('click', event);
  }

  // TODO: 双击
  private onDoubleClick(event: MouseEvent) {
    this.listener.publish('dblclick', event);
  }

  // TODO: 右键菜单
  private onContextMenu(event: MouseEvent) {
    this.listener.publish('contextmenu', event);
  }

  // TODO: 绑定事件
  public on(key: ListenerTypes, listener: (data: MouseEvent) => void) {
    this.listener.subscribe(key, listener);
  }

  // TODO: 解绑事件
  public off(key: ListenerTypes, listener: (data: MouseEvent) => void) {
    this.listener.unsubscribe(key, listener);
  }

  // TODO: 获取位图
  public getBitmap() {
    return this.__canvas.getBitmap();
  }

  // TODO: 清空画布
  public clearDraw() {
    this.__canvas.clear();
  }

  // TODO: 销毁
  public destroy() {
    this.__canvas.destroy();
  }
}
